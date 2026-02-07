/**
 * Authentication Middleware
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../lib/errors';
import type { UserRole } from '@hospital-ops/shared';

// Extend FastifyRequest with our custom user type
declare module 'fastify' {
  interface FastifyRequest {
    currentUser: {
      sub: string;
      tenantId: string;
      branchIds: string[];
      role: UserRole;
      permissions: string[];
      iat: number;
      exp: number;
    };
  }
}

/**
 * Authenticate request using JWT
 * Requires valid Bearer token in Authorization header
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing authentication token');
    }

    // Verify JWT using Fastify's built-in method
    const decoded = await request.jwtVerify<{
      sub: string;
      tenantId: string;
      branchIds: string[];
      role: UserRole;
      permissions: string[];
      iat: number;
      exp: number;
    }>();

    // Store decoded user in request
    request.currentUser = decoded;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = await request.jwtVerify<{
        sub: string;
        tenantId: string;
        branchIds: string[];
        role: UserRole;
        permissions: string[];
        iat: number;
        exp: number;
      }>();
      request.currentUser = decoded;
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }
}

/**
 * Require specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.currentUser) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(request.currentUser.role)) {
      throw new UnauthorizedError('Insufficient role privileges');
    }
  };
}
