/**
 * Users Controller
 * Route handlers for user management
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { usersService, UsersService } from './users.service';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  assignBranchesSchema,
} from './users.schema';
import { getTenantContext } from '../../middleware/tenant.middleware';
import { prisma } from '../../lib/prisma';

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  /**
   * GET /users
   * List users
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const query = listUsersQuerySchema.parse(request.query);
    const currentUserRole = request.currentUser!.role;

    const result = await this.service.list(tenantId, query, currentUserRole);

    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  /**
   * GET /users/:id
   * Get user by ID
   */
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;

    const user = await this.service.getById(id, tenantId);

    return reply.send({
      success: true,
      data: user,
    });
  }

  /**
   * POST /users
   * Create user
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const data = createUserSchema.parse(request.body);
    const currentUserRole = request.currentUser!.role;

    // Get tenant subscription plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    });

    const user = await this.service.create(
      tenantId,
      data,
      tenant?.subscriptionPlan || 'trial',
      currentUserRole
    );

    return reply.status(201).send({
      success: true,
      data: user,
    });
  }

  /**
   * PATCH /users/:id
   * Update user
   */
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;
    const data = updateUserSchema.parse(request.body);
    const currentUserRole = request.currentUser!.role;

    const user = await this.service.update(id, tenantId, data, currentUserRole);

    return reply.send({
      success: true,
      data: user,
    });
  }

  /**
   * DELETE /users/:id
   * Soft delete user
   */
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;
    const currentUserRole = request.currentUser!.role;

    await this.service.delete(id, tenantId, currentUserRole);

    return reply.send({
      success: true,
      message: 'User deactivated successfully',
    });
  }

  /**
   * POST /users/:id/branches
   * Assign branches to user
   */
  async assignBranches(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { tenantId } = getTenantContext(request);
    const { id } = request.params;
    const data = assignBranchesSchema.parse(request.body);

    const user = await this.service.assignBranches(id, tenantId, data);

    return reply.send({
      success: true,
      data: user,
    });
  }

  /**
   * DELETE /users/:id/branches/:branchId
   * Remove branch assignment
   */
  async removeBranchAssignment(
    request: FastifyRequest<{ Params: { id: string; branchId: string } }>,
    reply: FastifyReply
  ) {
    const { tenantId } = getTenantContext(request);
    const { id, branchId } = request.params;

    await this.service.removeBranchAssignment(id, branchId, tenantId);

    return reply.send({
      success: true,
      message: 'Branch assignment removed',
    });
  }
}

export const usersController = new UsersController();
