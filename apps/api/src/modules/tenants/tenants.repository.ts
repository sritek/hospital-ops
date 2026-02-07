/**
 * Tenants Repository
 * Database operations for tenant management
 */

import { prisma } from '../../lib/prisma';
import type { Tenant, Prisma } from '@prisma/client';

export class TenantsRepository {
  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { id },
    });
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { slug },
    });
  }

  /**
   * Update tenant
   */
  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }

  /**
   * Update tenant logo URL
   */
  async updateLogo(id: string, logoUrl: string): Promise<Tenant> {
    return prisma.tenant.update({
      where: { id },
      data: { logoUrl },
    });
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.tenant.findFirst({
      where: {
        slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    return !existing;
  }

  /**
   * Get tenant with branch count
   */
  async findWithStats(
    id: string
  ): Promise<(Tenant & { _count: { branches: number; users: number } }) | null> {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });
  }
}

export const tenantsRepository = new TenantsRepository();
