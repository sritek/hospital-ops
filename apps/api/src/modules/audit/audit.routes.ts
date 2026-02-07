/**
 * Audit Routes
 * Route definitions for audit log queries
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware';
import { setTenantContext, getTenantContext } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.guard';
import { queryAuditLogs } from '../../lib/audit';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function auditRoutes(fastify: FastifyInstance) {
  // All routes require authentication and tenant context
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', setTenantContext);

  // GET /audit-logs - List audit logs (admin only)
  fastify.get('/', {
    preHandler: [requirePermission('audit:read')],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = getTenantContext(request);
      const query = querySchema.parse(request.query);

      const result = await queryAuditLogs({
        tenantId,
        ...query,
      });

      return reply.send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    },
  });
}
