/**
 * JWT Token Utilities
 *
 * Uses @fastify/jwt for token operations via Fastify instance
 */

import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'crypto';
import { env } from '../../config/env';
import { getPermissionsForRole } from '@hospital-ops/shared';
import type { TokenPayload, GenerateTokensInput, GenerateTokensResult } from './auth.types';

// Store fastify instance reference for token operations
let fastifyInstance: FastifyInstance | null = null;

/**
 * Initialize token utility with Fastify instance
 * Call this during server startup after JWT plugin is registered
 */
export function initTokenUtil(fastify: FastifyInstance): void {
  fastifyInstance = fastify;
}

/**
 * Get the Fastify instance (throws if not initialized)
 */
function getFastify(): FastifyInstance {
  if (!fastifyInstance) {
    throw new Error('Token utility not initialized. Call initTokenUtil() first.');
  }
  return fastifyInstance;
}

// Parse expiry string to seconds
export function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

/**
 * Generate access token using Fastify JWT
 */
export function generateAccessToken(input: GenerateTokensInput): string {
  const fastify = getFastify();

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: input.userId,
    tenantId: input.tenantId,
    branchIds: input.branchIds,
    role: input.role,
    permissions: getPermissionsForRole(input.role),
  };

  return fastify.jwt.sign(payload, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

/**
 * Generate refresh token (opaque token - not a JWT)
 */
export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(input: GenerateTokensInput): GenerateTokensResult {
  const accessToken = generateAccessToken(input);
  const refreshToken = generateRefreshToken();
  const expiresIn = parseExpiry(env.JWT_ACCESS_EXPIRY);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  const fastify = getFastify();
  return fastify.jwt.verify<TokenPayload>(token);
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const fastify = getFastify();
    return fastify.jwt.decode<TokenPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  const expirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRY);
  return new Date(Date.now() + expirySeconds * 1000);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(exp: number): boolean {
  return Date.now() >= exp * 1000;
}
