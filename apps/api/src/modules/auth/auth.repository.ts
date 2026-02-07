/**
 * Auth Repository - Database Operations
 */

import { prisma } from '../../lib/prisma';
import type {
  Prisma,
  User,
  RefreshToken,
  OtpCode,
  LoginAttempt,
  PasswordHistory,
} from '@prisma/client';
import type { UserWithBranches, UserWithTenant } from './auth.types';

export class AuthRepository {
  /**
   * Find user by phone within a tenant
   */
  async findUserByPhone(phone: string, tenantId?: string): Promise<UserWithBranches | null> {
    const where: Prisma.UserWhereInput = {
      phone,
      deletedAt: null,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return prisma.user.findFirst({
      where,
      include: {
        userBranches: {
          include: {
            branch: true,
          },
        },
      },
    }) as Promise<UserWithBranches | null>;
  }

  /**
   * Find user by ID with tenant and branches
   */
  async findUserById(userId: string): Promise<UserWithTenant | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        userBranches: {
          include: {
            branch: true,
          },
        },
      },
    }) as Promise<UserWithTenant | null>;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string, tenantId?: string): Promise<User | null> {
    const where: Prisma.UserWhereInput = {
      email,
      deletedAt: null,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return prisma.user.findFirst({ where });
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Update user's failed login count
   */
  async updateFailedLoginCount(userId: string, count: number, lockedUntil?: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: count,
        lockedUntil: lockedUntil || null,
      },
    });
  }

  /**
   * Reset failed login count
   */
  async resetFailedLoginCount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  // ==================== Refresh Token Operations ====================

  /**
   * Create refresh token
   */
  async createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Delete expired refresh tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });
    return result.count;
  }

  // ==================== OTP Operations ====================

  /**
   * Create OTP code
   */
  async createOtpCode(data: {
    phone: string;
    code: string;
    purpose: string;
    expiresAt: Date;
    tenantId?: string;
  }): Promise<OtpCode> {
    // Invalidate existing OTPs for same phone and purpose
    await prisma.otpCode.updateMany({
      where: {
        phone: data.phone,
        purpose: data.purpose,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    return prisma.otpCode.create({
      data: {
        phone: data.phone,
        code: data.code,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find valid OTP code
   */
  async findValidOtpCode(phone: string, code: string, purpose: string): Promise<OtpCode | null> {
    return prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Increment OTP attempts
   */
  async incrementOtpAttempts(otpId: string): Promise<void> {
    await prisma.otpCode.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });
  }

  /**
   * Mark OTP as used
   */
  async markOtpUsed(otpId: string): Promise<void> {
    await prisma.otpCode.update({
      where: { id: otpId },
      data: { usedAt: new Date() },
    });
  }

  // ==================== Login Attempt Operations ====================

  /**
   * Record login attempt
   */
  async recordLoginAttempt(data: {
    phone: string;
    tenantId?: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
  }): Promise<LoginAttempt> {
    return prisma.loginAttempt.create({
      data: {
        phone: data.phone,
        success: data.success,
        ipAddress: data.ipAddress || 'unknown',
        reason: data.failureReason,
      },
    });
  }

  /**
   * Get recent failed login attempts count
   */
  async getRecentFailedAttempts(phone: string, minutes: number = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await prisma.loginAttempt.count({
      where: {
        phone,
        success: false,
        createdAt: { gte: since },
      },
    });

    return count;
  }

  // ==================== Password History Operations ====================

  /**
   * Add password to history
   */
  async addPasswordHistory(userId: string, passwordHash: string): Promise<PasswordHistory> {
    return prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash,
      },
    });
  }

  /**
   * Get recent password hashes
   */
  async getRecentPasswordHashes(userId: string, count: number = 5): Promise<string[]> {
    const history = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: count,
      select: { passwordHash: true },
    });

    return history.map((h) => h.passwordHash);
  }

  // ==================== Tenant Operations ====================

  /**
   * Create tenant with owner user
   */
  async createTenantWithOwner(data: {
    facilityName: string;
    ownerName: string;
    phone: string;
    email?: string;
    passwordHash: string;
  }): Promise<{ tenant: { id: string; slug: string }; user: { id: string } }> {
    // Generate slug from facility name
    const slug = data.facilityName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    const finalSlug = existingTenant ? `${slug}-${Date.now().toString(36)}` : slug;

    return prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.facilityName,
          slug: finalSlug,
          email: data.email || `${data.phone}@hospital-ops.in`,
          phone: data.phone,
          subscriptionPlan: 'trial',
          subscriptionStatus: 'active',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Create default branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          code: 'MAIN',
          isActive: true,
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.ownerName,
          phone: data.phone,
          email: data.email,
          passwordHash: data.passwordHash,
          role: 'super_admin',
          isActive: true,
        },
      });

      // Assign user to branch
      await tx.userBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          isPrimary: true,
        },
      });

      return {
        tenant: { id: tenant.id, slug: tenant.slug },
        user: { id: user.id },
      };
    });
  }
}

export const authRepository = new AuthRepository();
