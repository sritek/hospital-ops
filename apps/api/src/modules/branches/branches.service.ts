/**
 * Branches Service
 * Business logic for branch management
 */

import { branchesRepository, BranchesRepository } from './branches.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../lib/errors';
import type {
  CreateBranchDto,
  UpdateBranchDto,
  BranchResponse,
  ListBranchesQuery,
} from './branches.types';
import { toBranchResponse } from './branches.types';

// Subscription plan limits
const PLAN_LIMITS: Record<string, number> = {
  trial: 2,
  basic: 3,
  professional: 10,
  enterprise: 100,
};

export class BranchesService {
  constructor(private repository: BranchesRepository = branchesRepository) {}

  /**
   * List branches
   */
  async list(tenantId: string, query: ListBranchesQuery) {
    const result = await this.repository.findMany(tenantId, {
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      isActive: query.isActive,
    });

    return {
      data: result.data.map(toBranchResponse),
      meta: result.meta,
    };
  }

  /**
   * Get branch by ID
   */
  async getById(id: string, tenantId: string): Promise<BranchResponse> {
    const branch = await this.repository.findById(id, tenantId);

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    return toBranchResponse(branch);
  }

  /**
   * Create branch
   */
  async create(
    tenantId: string,
    data: CreateBranchDto,
    subscriptionPlan: string
  ): Promise<BranchResponse> {
    // Check branch limit
    const currentCount = await this.repository.countByTenant(tenantId);
    const limit = PLAN_LIMITS[subscriptionPlan] || PLAN_LIMITS.trial;

    if (currentCount >= limit) {
      throw new ForbiddenError(
        `Branch limit reached. Your ${subscriptionPlan} plan allows ${limit} branches.`
      );
    }

    // Check code uniqueness
    const isCodeAvailable = await this.repository.isCodeAvailable(data.code, tenantId);
    if (!isCodeAvailable) {
      throw new BadRequestError('Branch code already exists');
    }

    const branch = await this.repository.create({
      tenant: { connect: { id: tenantId } },
      name: data.name,
      code: data.code,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      phone: data.phone,
      email: data.email,
      gstin: data.gstin,
      timezone: data.timezone || 'Asia/Kolkata',
      workingHours: data.workingHours,
      settings: data.settings || {},
    });

    return toBranchResponse(branch);
  }

  /**
   * Update branch
   */
  async update(id: string, tenantId: string, data: UpdateBranchDto): Promise<BranchResponse> {
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundError('Branch not found');
    }

    const branch = await this.repository.update(id, tenantId, {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      phone: data.phone,
      email: data.email,
      gstin: data.gstin,
      timezone: data.timezone,
      workingHours: data.workingHours,
      settings: data.settings,
      isActive: data.isActive,
    });

    return toBranchResponse(branch);
  }

  /**
   * Soft delete branch
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundError('Branch not found');
    }

    // Check if this is the last active branch
    const activeCount = await this.repository.countByTenant(tenantId);
    if (activeCount <= 1) {
      throw new BadRequestError('Cannot delete the last branch');
    }

    await this.repository.softDelete(id, tenantId);
  }
}

export const branchesService = new BranchesService();
