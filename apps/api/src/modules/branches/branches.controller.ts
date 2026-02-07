/**
 * Branches Controller
 * Route handlers for branch management
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { branchesService, BranchesService } from './branches.service';
import { createBranchSchema, updateBranchSchema, listBranchesQuerySchema } from './branches.schema';
import { getTenantContext } from '../../middleware/tenant.middleware';
import { prisma } from '../../lib/prisma';

export class BranchesController {
  constructor(private service: BranchesService = branchesService) {}

  /**
   * GET /branches
   * List branches
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const query = listBranchesQuerySchema.parse(request.query);

    const result = await this.service.list(tenantId, query);

    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  /**
   * GET /branches/:id
   * Get branch by ID
   */
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;

    const branch = await this.service.getById(id, tenantId);

    return reply.send({
      success: true,
      data: branch,
    });
  }

  /**
   * POST /branches
   * Create branch
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const data = createBranchSchema.parse(request.body);

    // Get tenant subscription plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    });

    const branch = await this.service.create(tenantId, data, tenant?.subscriptionPlan || 'trial');

    return reply.status(201).send({
      success: true,
      data: branch,
    });
  }

  /**
   * PATCH /branches/:id
   * Update branch
   */
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;
    const data = updateBranchSchema.parse(request.body);

    const branch = await this.service.update(id, tenantId, data);

    return reply.send({
      success: true,
      data: branch,
    });
  }

  /**
   * DELETE /branches/:id
   * Soft delete branch
   */
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;

    await this.service.delete(id, tenantId);

    return reply.send({
      success: true,
      message: 'Branch deactivated successfully',
    });
  }
}

export const branchesController = new BranchesController();
