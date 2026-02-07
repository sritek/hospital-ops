/**
 * Tenants Controller
 * Route handlers for tenant management
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { tenantsService, TenantsService } from './tenants.service';
import { updateTenantSchema } from './tenants.schema';
import { getTenantContext } from '../../middleware/tenant.middleware';
import { BadRequestError } from '../../lib/errors';

export class TenantsController {
  constructor(private service: TenantsService = tenantsService) {}

  /**
   * GET /tenants/current
   * Get current tenant details
   */
  async getCurrent(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const tenant = await this.service.getCurrentTenant(tenantId);

    return reply.send({
      success: true,
      data: tenant,
    });
  }

  /**
   * PATCH /tenants/current
   * Update current tenant
   */
  async updateCurrent(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const data = updateTenantSchema.parse(request.body);

    const tenant = await this.service.updateCurrentTenant(tenantId, data);

    return reply.send({
      success: true,
      data: tenant,
    });
  }

  /**
   * POST /tenants/current/logo
   * Upload tenant logo
   */
  async uploadLogo(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);

    // Handle multipart file upload
    const data = await request.file();

    if (!data) {
      throw new BadRequestError('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.mimetype)) {
      throw new BadRequestError('Invalid file type. Allowed: jpg, png, webp');
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > maxSize) {
      throw new BadRequestError('File too large. Maximum size: 2MB');
    }

    // TODO: Upload to S3 or local storage
    // For now, return a placeholder URL
    const logoUrl = `/uploads/tenants/${tenantId}/logo-${Date.now()}.${data.mimetype.split('/')[1]}`;

    const tenant = await this.service.updateLogo(tenantId, logoUrl);

    return reply.send({
      success: true,
      data: tenant,
    });
  }
}

export const tenantsController = new TenantsController();
