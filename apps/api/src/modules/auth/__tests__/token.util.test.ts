/**
 * JWT Token Utility Tests
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import {
  initTokenUtil,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  decodeToken,
  getRefreshTokenExpiry,
  isTokenExpired,
  parseExpiry,
} from '../token.util';
import type { UserRole } from '@hospital-ops/shared';

// Mock environment
vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only-32chars',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

describe('Token Utilities', () => {
  const mockInput = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    branchIds: ['123e4567-e89b-12d3-a456-426614174002'],
    role: 'doctor' as UserRole,
  };

  // Initialize Fastify with JWT before tests
  beforeAll(async () => {
    const fastify = Fastify();
    await fastify.register(jwt, {
      secret: 'test-secret-key-for-testing-purposes-only-32chars',
    });
    await fastify.ready();
    initTokenUtil(fastify);
  });

  describe('parseExpiry', () => {
    it('should parse seconds', () => {
      expect(parseExpiry('30s')).toBe(30);
    });

    it('should parse minutes', () => {
      expect(parseExpiry('15m')).toBe(900);
    });

    it('should parse hours', () => {
      expect(parseExpiry('2h')).toBe(7200);
    });

    it('should parse days', () => {
      expect(parseExpiry('7d')).toBe(604800);
    });

    it('should return default for invalid format', () => {
      expect(parseExpiry('invalid')).toBe(900);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(mockInput);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload', () => {
      const token = generateAccessToken(mockInput);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(mockInput.userId);
      expect(decoded?.tenantId).toBe(mockInput.tenantId);
      expect(decoded?.branchIds).toEqual(mockInput.branchIds);
      expect(decoded?.role).toBe(mockInput.role);
    });

    it('should include permissions based on role', () => {
      const token = generateAccessToken(mockInput);
      const decoded = decodeToken(token);

      expect(decoded?.permissions).toBeDefined();
      expect(Array.isArray(decoded?.permissions)).toBe(true);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a random token', () => {
      const token = generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes = 128 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const result = generateTokens(mockInput);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeDefined();
    });

    it('should return correct expiry time', () => {
      const result = generateTokens(mockInput);

      // 15 minutes = 900 seconds
      expect(result.expiresIn).toBe(900);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockInput);
      const payload = verifyAccessToken(token);

      expect(payload.sub).toBe(mockInput.userId);
      expect(payload.tenantId).toBe(mockInput.tenantId);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw for tampered token', () => {
      const token = generateAccessToken(mockInput);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tamperedToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token', () => {
      const token = generateAccessToken(mockInput);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(mockInput.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('should return a future date', () => {
      const expiry = getRefreshTokenExpiry();
      const now = new Date();

      expect(expiry.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should be approximately 7 days in the future', () => {
      const expiry = getRefreshTokenExpiry();
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      const diff = expiry.getTime() - now.getTime();
      expect(diff).toBeGreaterThan(sevenDaysMs - 1000); // Allow 1 second tolerance
      expect(diff).toBeLessThan(sevenDaysMs + 1000);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(isTokenExpired(pastExp)).toBe(true);
    });

    it('should return false for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(isTokenExpired(futureExp)).toBe(false);
    });

    it('should return true for token expiring now', () => {
      const nowExp = Math.floor(Date.now() / 1000);
      expect(isTokenExpired(nowExp)).toBe(true);
    });
  });
});
