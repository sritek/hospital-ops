/**
 * Tenant Context Middleware
 * Sets PostgreSQL session variables for Row-Level Security (RLS)
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

// Extend FastifyRequest with tenant context
declare module 'fastify' {
  interface FastifyRequest {
    tenantContext: {
      tenantId: string;
      branchId?: string;
      userId: string;
    };
  }
}

/**
 * Set tenant context for RLS
 * Must be called after authenticate middleware
 */
export async function setTenantContext(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!request.currentUser) {
    throw new UnauthorizedError('Authentication required');
  }

  const { sub: userId, tenantId, branchIds } = request.currentUser;

  // Get branch from header or use first available
  const requestedBranchId = request.headers['x-branch-id'] as string | undefined;
  let branchId: string | undefined;

  if (requestedBranchId) {
    // Verify user has access to requested branch
    if (!branchIds.includes(requestedBranchId)) {
      throw new ForbiddenError('Access denied to this branch');
    }
    branchId = requestedBranchId;
  } else if (branchIds.length === 1) {
    // Auto-select if user has only one branch
    branchId = branchIds[0];
  }

  // Store context in request
  request.tenantContext = {
    tenantId,
    branchId,
    userId,
  };

  // Set PostgreSQL session variables for RLS
  // Note: This sets variables for the current transaction
  await prisma.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', $1, true)`, tenantId);

  if (branchId) {
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.current_branch_id', $1, true)`,
      branchId
    );
  }

  await prisma.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, true)`, userId);
}

/**
 * Require branch selection
 * Use for endpoints that need a specific branch context
 */
export async function requireBranch(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.tenantContext?.branchId) {
    throw new ForbiddenError('Branch selection required. Set X-Branch-Id header.');
  }
}

/**
 * Helper to get tenant context from request
 */
export function getTenantContext(request: FastifyRequest) {
  if (!request.tenantContext) {
    throw new UnauthorizedError('Tenant context not set');
  }
  return request.tenantContext;
}

/**
 * Helper to execute queries with tenant context in a transaction
 */
export async function withTenantTransaction<T>(
  request: FastifyRequest,
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  const { tenantId, branchId, userId } = getTenantContext(request);

  return prisma.$transaction(async (tx) => {
    // Set RLS context
    await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', $1, true)`, tenantId);

    if (branchId) {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_branch_id', $1, true)`, branchId);
    }

    await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, true)`, userId);

    return callback(tx as typeof prisma);
  });
}
