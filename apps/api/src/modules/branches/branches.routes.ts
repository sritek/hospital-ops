/**
 * Branches Routes
 * Route definitions for branch management
 */

import type { FastifyInstance } from 'fastify';
import { branchesController } from './branches.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { setTenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.guard';

export async function branchesRoutes(fastify: FastifyInstance) {
  // All routes require authentication and tenant context
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', setTenantContext);

  // GET /branches - List branches
  fastify.get('/', {
    preHandler: [requirePermission('branches:read')],
    handler: (req, reply) => branchesController.list(req, reply),
  });

  // GET /branches/:id - Get branch by ID
  fastify.get('/:id', {
    preHandler: [requirePermission('branches:read')],
    handler: (req, reply) => branchesController.getById(req as any, reply),
  });

  // POST /branches - Create branch
  fastify.post('/', {
    preHandler: [requirePermission('branches:create')],
    handler: (req, reply) => branchesController.create(req, reply),
  });

  // PATCH /branches/:id - Update branch
  fastify.patch('/:id', {
    preHandler: [requirePermission('branches:write')],
    handler: (req, reply) => branchesController.update(req as any, reply),
  });

  // DELETE /branches/:id - Soft delete branch
  fastify.delete('/:id', {
    preHandler: [requirePermission('branches:delete')],
    handler: (req, reply) => branchesController.delete(req as any, reply),
  });
}
