/**
 * Tenants Service
 * Business logic for tenant management
 */

import { tenantsRepository, TenantsRepository } from './tenants.repository';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import type { UpdateTenantDto, TenantResponse } from './tenants.types';
import { toTenantResponse } from './tenants.types';

export class TenantsService {
  constructor(private repository: TenantsRepository = tenantsRepository) {}

  /**
   * Get current tenant details
   */
  async getCurrentTenant(tenantId: string): Promise<TenantResponse> {
    const tenant = await this.repository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return toTenantResponse(tenant);
  }

  /**
   * Update current tenant
   */
  async updateCurrentTenant(tenantId: string, data: UpdateTenantDto): Promise<TenantResponse> {
    const tenant = await this.repository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const updated = await this.repository.update(tenantId, data);
    return toTenantResponse(updated);
  }

  /**
   * Update tenant logo
   */
  async updateLogo(tenantId: string, logoUrl: string): Promise<TenantResponse> {
    const tenant = await this.repository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Validate logo URL format
    if (!logoUrl.startsWith('https://') && !logoUrl.startsWith('/uploads/')) {
      throw new BadRequestError('Invalid logo URL');
    }

    const updated = await this.repository.updateLogo(tenantId, logoUrl);
    return toTenantResponse(updated);
  }

  /**
   * Get tenant with statistics
   */
  async getTenantWithStats(tenantId: string) {
    const tenant = await this.repository.findWithStats(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return {
      ...toTenantResponse(tenant),
      stats: {
        branchCount: tenant._count.branches,
        userCount: tenant._count.users,
      },
    };
  }
}

export const tenantsService = new TenantsService();
