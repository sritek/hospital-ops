/**
 * Users Repository
 * Database operations for user management
 */

import { prisma } from '../../lib/prisma';
import type { User, UserRole, Prisma } from '@prisma/client';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type UserWithBranches = Prisma.UserGetPayload<{
  include: { userBranches: { include: { branch: true } } };
}>;

export class UsersRepository {
  /**
   * Find user by ID
   */
  async findById(id: string, tenantId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  /**
   * Find user by ID with branches
   */
  async findByIdWithBranches(id: string, tenantId: string): Promise<UserWithBranches | null> {
    return prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        userBranches: {
          include: { branch: true },
        },
      },
    });
  }

  /**
   * Find user by phone within tenant
   */
  async findByPhone(phone: string, tenantId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { phone, tenantId, deletedAt: null },
    });
  }

  /**
   * List users with pagination
   */
  async findMany(
    tenantId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      role?: UserRole;
      branchId?: string;
      isActive?: boolean;
    }
  ): Promise<PaginatedResult<UserWithBranches>> {
    const { page, limit, search, role, branchId, isActive } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(branchId && {
        userBranches: {
          some: { branchId },
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          userBranches: {
            include: { branch: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create user with branch assignments
   */
  async create(
    data: Prisma.UserCreateInput,
    branchIds: string[],
    primaryBranchId?: string
  ): Promise<UserWithBranches> {
    return prisma.user.create({
      data: {
        ...data,
        userBranches: {
          create: branchIds.map((branchId) => ({
            branchId,
            isPrimary: branchId === primaryBranchId,
          })),
        },
      },
      include: {
        userBranches: {
          include: { branch: true },
        },
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, tenantId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id, tenantId },
      data,
    });
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string, tenantId: string): Promise<User> {
    return prisma.user.update({
      where: { id, tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /**
   * Assign branches to user
   */
  async assignBranches(
    userId: string,
    branchIds: string[],
    primaryBranchId?: string
  ): Promise<void> {
    // Remove existing assignments
    await prisma.userBranch.deleteMany({
      where: { userId },
    });

    // Create new assignments
    await prisma.userBranch.createMany({
      data: branchIds.map((branchId) => ({
        userId,
        branchId,
        isPrimary: branchId === primaryBranchId,
      })),
    });
  }

  /**
   * Remove branch assignment
   */
  async removeBranchAssignment(userId: string, branchId: string): Promise<void> {
    await prisma.userBranch.delete({
      where: {
        userId_branchId: { userId, branchId },
      },
    });
  }

  /**
   * Get user's branch IDs
   */
  async getUserBranchIds(userId: string): Promise<string[]> {
    const assignments = await prisma.userBranch.findMany({
      where: { userId },
      select: { branchId: true },
    });
    return assignments.map((a) => a.branchId);
  }

  /**
   * Count users for tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    return prisma.user.count({
      where: { tenantId, deletedAt: null },
    });
  }

  /**
   * Check if phone is available
   */
  async isPhoneAvailable(phone: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.user.findFirst({
      where: {
        phone,
        tenantId,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    return !existing;
  }
}

export const usersRepository = new UsersRepository();
