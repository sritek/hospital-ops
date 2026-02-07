/**
 * Permission Guard Middleware
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { hasAnyPermission, hasAllPermissions } from '@hospital-ops/shared';
import type { UserRole } from '@hospital-ops/shared';

/**
 * Require ANY of the specified permissions
 * User needs at least one of the permissions to access
 */
export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.currentUser) {
      throw new UnauthorizedError('Authentication required');
    }

    const { role } = request.currentUser;
    const hasAccess = hasAnyPermission(role, permissions);

    if (!hasAccess) {
      throw new ForbiddenError(`Insufficient permissions. Required: ${permissions.join(' or ')}`);
    }
  };
}

/**
 * Require ALL of the specified permissions
 * User needs all permissions to access
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.currentUser) {
      throw new UnauthorizedError('Authentication required');
    }

    const { role } = request.currentUser;
    const hasAccess = hasAllPermissions(role, permissions);

    if (!hasAccess) {
      throw new ForbiddenError(`Insufficient permissions. Required all: ${permissions.join(', ')}`);
    }
  };
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.currentUser) {
      throw new UnauthorizedError('Authentication required');
    }

    const { role } = request.currentUser;

    if (!roles.includes(role)) {
      throw new ForbiddenError(`Access restricted to: ${roles.join(', ')}`);
    }
  };
}

/**
 * Require admin role (super_admin or branch_admin)
 */
export function requireAdmin() {
  return requireRole('super_admin', 'branch_admin');
}

/**
 * Require super admin role only
 */
export function requireSuperAdmin() {
  return requireRole('super_admin');
}

/**
 * Check if user owns the resource or has admin access
 * Useful for "own resource" permissions
 */
export function requireOwnerOrPermission(
  getOwnerId: (request: FastifyRequest) => string | Promise<string>,
  ...permissions: string[]
) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.currentUser) {
      throw new UnauthorizedError('Authentication required');
    }

    const { role, sub: userId } = request.currentUser;

    // Check if user has the permission
    if (hasAnyPermission(role, permissions)) {
      return;
    }

    // Check if user is the owner
    const ownerId = await getOwnerId(request);
    if (ownerId === userId) {
      return;
    }

    throw new ForbiddenError('Access denied');
  };
}
