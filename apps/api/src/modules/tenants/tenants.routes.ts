/**
 * Tenants Routes
 * Route definitions for tenant management
 */

import type { FastifyInstance } from 'fastify';
import { tenantsController } from './tenants.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { setTenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.guard';

export async function tenantsRoutes(fastify: FastifyInstance) {
  // All routes require authentication and tenant context
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', setTenantContext);

  // GET /tenants/current - Get current tenant
  fastify.get('/current', {
    preHandler: [requirePermission('tenants:read')],
    handler: (req, reply) => tenantsController.getCurrent(req, reply),
  });

  // PATCH /tenants/current - Update current tenant
  fastify.patch('/current', {
    preHandler: [requirePermission('tenants:write')],
    handler: (req, reply) => tenantsController.updateCurrent(req, reply),
  });

  // POST /tenants/current/logo - Upload tenant logo
  fastify.post('/current/logo', {
    preHandler: [requirePermission('tenants:write')],
    handler: (req, reply) => tenantsController.uploadLogo(req, reply),
  });
}
