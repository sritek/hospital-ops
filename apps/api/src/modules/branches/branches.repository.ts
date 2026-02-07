/**
 * Branches Repository
 * Database operations for branch management
 */

import { prisma } from '../../lib/prisma';
import type { Branch, Prisma } from '@prisma/client';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BranchesRepository {
  /**
   * Find branch by ID
   */
  async findById(id: string, tenantId: string): Promise<Branch | null> {
    return prisma.branch.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  /**
   * Find branch by code within tenant
   */
  async findByCode(code: string, tenantId: string): Promise<Branch | null> {
    return prisma.branch.findFirst({
      where: { code, tenantId, deletedAt: null },
    });
  }

  /**
   * List branches with pagination
   */
  async findMany(
    tenantId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      isActive?: boolean;
    }
  ): Promise<PaginatedResult<Branch>> {
    const { page, limit, search, isActive } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.BranchWhereInput = {
      tenantId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.branch.count({ where }),
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
   * Create branch
   */
  async create(data: Prisma.BranchCreateInput): Promise<Branch> {
    return prisma.branch.create({ data });
  }

  /**
   * Update branch
   */
  async update(id: string, tenantId: string, data: Prisma.BranchUpdateInput): Promise<Branch> {
    return prisma.branch.update({
      where: { id, tenantId },
      data,
    });
  }

  /**
   * Soft delete branch
   */
  async softDelete(id: string, tenantId: string): Promise<Branch> {
    return prisma.branch.update({
      where: { id, tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /**
   * Check if code is available
   */
  async isCodeAvailable(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.branch.findFirst({
      where: {
        code,
        tenantId,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    return !existing;
  }

  /**
   * Count branches for tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    return prisma.branch.count({
      where: { tenantId, deletedAt: null },
    });
  }
}

export const branchesRepository = new BranchesRepository();
