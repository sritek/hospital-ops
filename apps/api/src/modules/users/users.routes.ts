/**
 * Users Routes
 * Route definitions for user management
 */

import type { FastifyInstance } from 'fastify';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { setTenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.guard';

export async function usersRoutes(fastify: FastifyInstance) {
  // All routes require authentication and tenant context
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', setTenantContext);

  // GET /users - List users
  fastify.get('/', {
    preHandler: [requirePermission('users:read')],
    handler: (req, reply) => usersController.list(req, reply),
  });

  // GET /users/:id - Get user by ID
  fastify.get('/:id', {
    preHandler: [requirePermission('users:read')],
    handler: (req, reply) => usersController.getById(req as any, reply),
  });

  // POST /users - Create user
  fastify.post('/', {
    preHandler: [requirePermission('users:create')],
    handler: (req, reply) => usersController.create(req, reply),
  });

  // PATCH /users/:id - Update user
  fastify.patch('/:id', {
    preHandler: [requirePermission('users:write')],
    handler: (req, reply) => usersController.update(req as any, reply),
  });

  // DELETE /users/:id - Soft delete user
  fastify.delete('/:id', {
    preHandler: [requirePermission('users:delete')],
    handler: (req, reply) => usersController.delete(req as any, reply),
  });

  // POST /users/:id/branches - Assign branches
  fastify.post('/:id/branches', {
    preHandler: [requirePermission('users:write')],
    handler: (req, reply) => usersController.assignBranches(req as any, reply),
  });

  // DELETE /users/:id/branches/:branchId - Remove branch assignment
  fastify.delete('/:id/branches/:branchId', {
    preHandler: [requirePermission('users:write')],
    handler: (req, reply) => usersController.removeBranchAssignment(req as any, reply),
  });
}
