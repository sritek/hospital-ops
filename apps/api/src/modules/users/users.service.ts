/**
 * Users Service
 * Business logic for user management
 */

import { usersRepository, UsersRepository } from './users.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../lib/errors';
import { hashPassword } from '../auth/password.util';
import type {
  CreateUserDto,
  UpdateUserDto,
  ListUsersQuery,
  AssignBranchesDto,
} from './users.types';
import { toUserResponseWithBranches } from './users.types';
import type { UserRole } from '@prisma/client';

// Subscription plan limits
const PLAN_LIMITS: Record<string, number> = {
  trial: 5,
  basic: 10,
  professional: 50,
  enterprise: 500,
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  branch_admin: 80,
  doctor: 60,
  nurse: 50,
  receptionist: 40,
  pharmacist: 40,
  lab_tech: 40,
  accountant: 40,
};

export class UsersService {
  constructor(private repository: UsersRepository = usersRepository) {}

  /**
   * List users
   */
  async list(tenantId: string, query: ListUsersQuery, currentUserRole: UserRole) {
    const result = await this.repository.findMany(tenantId, {
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      role: query.role,
      branchId: query.branchId,
      isActive: query.isActive,
    });

    return {
      data: result.data.map(toUserResponseWithBranches),
      meta: result.meta,
    };
  }

  /**
   * Get user by ID
   */
  async getById(id: string, tenantId: string) {
    const user = await this.repository.findByIdWithBranches(id, tenantId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return toUserResponseWithBranches(user);
  }

  /**
   * Create user
   */
  async create(
    tenantId: string,
    data: CreateUserDto,
    subscriptionPlan: string,
    currentUserRole: UserRole
  ) {
    // Check user limit
    const currentCount = await this.repository.countByTenant(tenantId);
    const limit = PLAN_LIMITS[subscriptionPlan] || PLAN_LIMITS.trial;

    if (currentCount >= limit) {
      throw new ForbiddenError(
        `User limit reached. Your ${subscriptionPlan} plan allows ${limit} users.`
      );
    }

    // Check role hierarchy - can't create user with higher role
    if (ROLE_HIERARCHY[data.role] >= ROLE_HIERARCHY[currentUserRole]) {
      throw new ForbiddenError('Cannot create user with equal or higher role');
    }

    // Check phone uniqueness
    const isPhoneAvailable = await this.repository.isPhoneAvailable(data.phone, tenantId);
    if (!isPhoneAvailable) {
      throw new BadRequestError('Phone number already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Determine primary branch
    const primaryBranchId = data.primaryBranchId || data.branchIds[0];

    const user = await this.repository.create(
      {
        tenant: { connect: { id: tenantId } },
        phone: data.phone,
        email: data.email,
        passwordHash,
        name: data.name,
        gender: data.gender,
        role: data.role,
        registrationNumber: data.registrationNumber,
        registrationCouncil: data.registrationCouncil,
        specialization: data.specialization,
        qualification: data.qualification,
      },
      data.branchIds,
      primaryBranchId
    );

    return toUserResponseWithBranches(user);
  }

  /**
   * Update user
   */
  async update(id: string, tenantId: string, data: UpdateUserDto, currentUserRole: UserRole) {
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Check role hierarchy for role changes
    if (data.role && ROLE_HIERARCHY[data.role] >= ROLE_HIERARCHY[currentUserRole]) {
      throw new ForbiddenError('Cannot assign equal or higher role');
    }

    // Can't modify user with higher role
    if (ROLE_HIERARCHY[existing.role] >= ROLE_HIERARCHY[currentUserRole]) {
      throw new ForbiddenError('Cannot modify user with equal or higher role');
    }

    const user = await this.repository.update(id, tenantId, {
      email: data.email,
      name: data.name,
      gender: data.gender,
      role: data.role,
      registrationNumber: data.registrationNumber,
      registrationCouncil: data.registrationCouncil,
      specialization: data.specialization,
      qualification: data.qualification,
      isActive: data.isActive,
    });

    const userWithBranches = await this.repository.findByIdWithBranches(id, tenantId);
    return toUserResponseWithBranches(userWithBranches!);
  }

  /**
   * Soft delete user
   */
  async delete(id: string, tenantId: string, currentUserRole: UserRole): Promise<void> {
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Can't delete user with higher role
    if (ROLE_HIERARCHY[existing.role] >= ROLE_HIERARCHY[currentUserRole]) {
      throw new ForbiddenError('Cannot delete user with equal or higher role');
    }

    await this.repository.softDelete(id, tenantId);
  }

  /**
   * Assign branches to user
   */
  async assignBranches(userId: string, tenantId: string, data: AssignBranchesDto) {
    const existing = await this.repository.findById(userId, tenantId);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const primaryBranchId = data.primaryBranchId || data.branchIds[0];
    await this.repository.assignBranches(userId, data.branchIds, primaryBranchId);

    const user = await this.repository.findByIdWithBranches(userId, tenantId);
    return toUserResponseWithBranches(user!);
  }

  /**
   * Remove branch assignment
   */
  async removeBranchAssignment(userId: string, branchId: string, tenantId: string): Promise<void> {
    const existing = await this.repository.findById(userId, tenantId);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Check if this is the last branch
    const branchIds = await this.repository.getUserBranchIds(userId);
    if (branchIds.length <= 1) {
      throw new BadRequestError('Cannot remove last branch assignment');
    }

    await this.repository.removeBranchAssignment(userId, branchId);
  }
}

export const usersService = new UsersService();
