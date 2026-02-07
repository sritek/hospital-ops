---
# Authentication patterns - JWT, RBAC, session management, 2FA
inclusion: fileMatch
fileMatchPattern: "apps/api/src/modules/auth/**/*.ts, apps/api/src/common/middleware/auth*.ts, apps/api/src/lib/jwt.ts"
---

# Authentication & Authorization Guide

## Overview

This document covers authentication, authorization, and session management patterns for Hospital-Ops.

---

## 1. Authentication Flow

### Login Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   API       │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │  POST /auth/login  │                    │
      │  {phone, password} │                    │
      │───────────────────▶│                    │
      │                    │  Find user by phone│
      │                    │───────────────────▶│
      │                    │◀───────────────────│
      │                    │                    │
      │                    │  Verify password   │
      │                    │  (bcrypt compare)  │
      │                    │                    │
      │                    │  Generate tokens   │
      │                    │  - Access (15min)  │
      │                    │  - Refresh (7days) │
      │                    │                    │
      │  {accessToken,     │                    │
      │   refreshToken,    │                    │
      │   user}            │                    │
      │◀───────────────────│                    │
```

---

## 2. JWT Implementation

### Token Configuration

```typescript
// config/auth.config.ts
export const authConfig = {
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: "15m",
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: "7d",
    },
  },
  bcrypt: {
    saltRounds: 12,
  },
  otp: {
    length: 6,
    expiresIn: 300, // 5 minutes
    maxAttempts: 3,
  },
  session: {
    maxConcurrent: 5, // Max devices per user
  },
};
```

### JWT Service

```typescript
// lib/jwt.ts
import jwt from "jsonwebtoken";
import { authConfig } from "@/config/auth.config";

export interface AccessTokenPayload {
  sub: string; // User ID
  tenantId: string;
  branchIds: string[];
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  type: "refresh";
  sessionId: string;
  iat: number;
  exp: number;
}

export function generateAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, authConfig.jwt.accessToken.secret, {
    expiresIn: authConfig.jwt.accessToken.expiresIn,
  });
}

export function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, authConfig.jwt.refreshToken.secret, {
    expiresIn: authConfig.jwt.refreshToken.expiresIn,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    authConfig.jwt.accessToken.secret,
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(
    token,
    authConfig.jwt.refreshToken.secret,
  ) as RefreshTokenPayload;
}

export function decodeToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload;
  } catch {
    return null;
  }
}
```

---

## 3. Auth Service

```typescript
// modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { AppError } from "@/common/errors/app-error";
import { authConfig } from "@/config/auth.config";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import { auditLog } from "@/lib/audit";
import { ROLE_PERMISSIONS } from "@/config/permissions";

export class AuthService {
  async login(
    phone: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Find user
    const user = await prisma.user.findFirst({
      where: { phone, deletedAt: null },
      include: {
        tenant: true,
        branches: {
          include: { branch: true },
        },
      },
    });

    if (!user) {
      throw AppError.unauthorized("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw AppError.unauthorized("Account is deactivated");
    }

    // Check tenant subscription
    if (user.tenant.subscriptionStatus !== "active") {
      throw AppError.unauthorized("Subscription is inactive");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed attempt
      await auditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: "failed_login",
        entityType: "user",
        entityId: user.id,
      });

      throw AppError.unauthorized("Invalid credentials");
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Get user permissions
    const permissions = ROLE_PERMISSIONS[user.role] || [];

    // Get branch IDs
    const branchIds = user.branches.map((ub) => ub.branchId);

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      branchIds,
      role: user.role,
      permissions,
    });

    const refreshToken = generateRefreshToken({
      sub: user.id,
      tenantId: user.tenantId,
      type: "refresh",
      sessionId,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Store session in Redis
    await redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString(),
      }),
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await auditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "login",
      entityType: "user",
      entityId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        branches: user.branches.map((ub) => ({
          id: ub.branch.id,
          name: ub.branch.name,
          isPrimary: ub.isPrimary,
        })),
      },
    };
  }

  async refresh(refreshToken: string) {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Invalid refresh token");
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            tenant: true,
            branches: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw AppError.unauthorized("Refresh token not found or expired");
    }

    const user = storedToken.user;

    // Check if user is still active
    if (!user.isActive || user.deletedAt) {
      throw AppError.unauthorized("Account is deactivated");
    }

    // Get permissions
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    const branchIds = user.branches.map((ub) => ub.branchId);

    // Generate new access token
    const accessToken = generateAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      branchIds,
      role: user.role,
      permissions,
    });

    return { accessToken };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Revoke specific token
      await prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all tokens for user
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    // Audit log
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await auditLog({
        tenantId: user.tenantId,
        userId,
        action: "logout",
        entityType: "user",
        entityId: userId,
      });
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw AppError.notFound("User");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest(
        "INVALID_PASSWORD",
        "Current password is incorrect",
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(
      newPassword,
      authConfig.bcrypt.saltRounds,
    );

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens (force re-login)
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Audit log
    await auditLog({
      tenantId: user.tenantId,
      userId,
      action: "password_change",
      entityType: "user",
      entityId: userId,
    });
  }
}
```

---

## 4. OTP Authentication

```typescript
// modules/auth/otp.service.ts
import { redis } from "@/lib/redis";
import { AppError } from "@/common/errors/app-error";
import { authConfig } from "@/config/auth.config";
import { queues } from "@/lib/queue";

export class OtpService {
  private generateOtp(): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < authConfig.otp.length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async sendOtp(phone: string, purpose: "login" | "reset_password" | "verify") {
    const key = `otp:${purpose}:${phone}`;
    const attemptsKey = `otp_attempts:${purpose}:${phone}`;

    // Check rate limit
    const attempts = await redis.get(attemptsKey);
    if (attempts && parseInt(attempts) >= authConfig.otp.maxAttempts) {
      throw AppError.tooManyRequests(
        "Too many OTP requests. Please try again later.",
      );
    }

    // Generate OTP
    const otp = this.generateOtp();

    // Store OTP
    await redis.setex(key, authConfig.otp.expiresIn, otp);

    // Increment attempts
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, 3600); // Reset after 1 hour

    // Queue SMS/WhatsApp
    await queues.smsNotifications.add("send-otp", {
      phone,
      otp,
      purpose,
    });

    return { message: "OTP sent successfully" };
  }

  async verifyOtp(
    phone: string,
    otp: string,
    purpose: "login" | "reset_password" | "verify",
  ) {
    const key = `otp:${purpose}:${phone}`;

    const storedOtp = await redis.get(key);
    if (!storedOtp) {
      throw AppError.badRequest("OTP_EXPIRED", "OTP has expired or not found");
    }

    if (storedOtp !== otp) {
      throw AppError.badRequest("INVALID_OTP", "Invalid OTP");
    }

    // Delete OTP after successful verification
    await redis.del(key);

    return { verified: true };
  }
}
```

---

## 5. Two-Factor Authentication (2FA)

```typescript
// modules/auth/twofa.service.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/common/errors/app-error";

export class TwoFactorService {
  async setup(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User");

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `HospitalOps:${user.phone}`,
      issuer: "HospitalOps",
    });

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...(user.settings as object),
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
        },
      },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enable(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User");

    const settings = user.settings as any;
    const secret = settings?.twoFactorSecret;

    if (!secret) {
      throw AppError.badRequest("2FA_NOT_SETUP", "2FA has not been set up");
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw AppError.badRequest("INVALID_2FA_TOKEN", "Invalid 2FA token");
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...settings,
          twoFactorEnabled: true,
        },
      },
    });

    return { enabled: true };
  }

  async verify(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User");

    const settings = user.settings as any;
    if (!settings?.twoFactorEnabled) {
      return true; // 2FA not enabled, skip verification
    }

    const verified = speakeasy.totp.verify({
      secret: settings.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    return verified;
  }

  async disable(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User");

    const settings = user.settings as any;

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: settings?.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw AppError.badRequest("INVALID_2FA_TOKEN", "Invalid 2FA token");
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...settings,
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      },
    });

    return { disabled: true };
  }
}
```

---

## 6. Role-Based Access Control (RBAC)

### Permission Configuration

```typescript
// config/permissions.ts
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"], // All permissions

  branch_admin: [
    "branches:read",
    "users:read",
    "users:write",
    "patients:*",
    "appointments:*",
    "consultations:*",
    "prescriptions:*",
    "billing:*",
    "reports:read",
    "inventory:*",
    "ipd:*",
    "laboratory:*",
    "pharmacy:*",
  ],

  doctor: [
    "patients:read",
    "patients:write",
    "appointments:read",
    "appointments:write:own",
    "consultations:*",
    "prescriptions:*",
    "lab_orders:write",
    "lab_results:read",
    "ipd:read",
    "ipd:write:own",
    "vitals:read",
  ],

  nurse: [
    "patients:read",
    "appointments:read",
    "vitals:*",
    "ipd:read",
    "ipd:write:nursing",
    "medication_admin:*",
    "consultations:read",
  ],

  receptionist: [
    "patients:read",
    "patients:write",
    "appointments:*",
    "billing:read",
    "billing:write",
    "queue:*",
    "consultations:read",
  ],

  pharmacist: [
    "patients:read:limited",
    "prescriptions:read",
    "dispensing:*",
    "inventory:*",
    "pharmacy:*",
  ],

  lab_tech: [
    "patients:read:limited",
    "lab_orders:read",
    "lab_results:*",
    "samples:*",
  ],

  accountant: [
    "billing:read",
    "reports:read:financial",
    "insurance:read",
    "expenses:read",
    "day_closure:*",
  ],
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "patients:read": "View patient information",
  "patients:write": "Create and update patients",
  "patients:delete": "Delete patients",
  "patients:read:limited": "View limited patient info (masked phone)",
  "appointments:read": "View appointments",
  "appointments:write": "Create and update appointments",
  "appointments:write:own": "Manage own appointments only",
  "consultations:*": "Full consultation access",
  "prescriptions:*": "Full prescription access",
  "billing:read": "View bills and payments",
  "billing:write": "Create and update bills",
  "reports:read": "View all reports",
  "reports:read:financial": "View financial reports only",
  // ... more descriptions
};
```

### Permission Checking Utility

```typescript
// common/utils/permission.utils.ts
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  // Super admin has all permissions
  if (userPermissions.includes("*")) return true;

  // Exact match
  if (userPermissions.includes(requiredPermission)) return true;

  // Wildcard match (e.g., 'patients:*' matches 'patients:read')
  const [resource, action] = requiredPermission.split(":");
  if (userPermissions.includes(`${resource}:*`)) return true;

  // Check :own suffix
  if (action?.includes(":own")) {
    const basePermission = requiredPermission.replace(":own", "");
    return userPermissions.includes(basePermission);
  }

  return false;
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.some((p) => hasPermission(userPermissions, p));
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.every((p) => hasPermission(userPermissions, p));
}
```

---

## 7. Auth Routes

```typescript
// modules/auth/auth.routes.ts
import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { TwoFactorService } from "./twofa.service";
import { authenticate } from "@/common/middleware/auth.middleware";
import { rateLimit } from "@/common/middleware/rate-limit.middleware";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();
  const otpService = new OtpService();
  const twoFactorService = new TwoFactorService();
  const controller = new AuthController(
    authService,
    otpService,
    twoFactorService,
  );

  // Login with rate limiting
  fastify.post("/login", {
    preHandler: [rateLimit({ max: 5, windowMs: 60000, keyPrefix: "login" })],
    schema: {
      tags: ["Auth"],
      summary: "Login with phone and password",
      body: {
        type: "object",
        required: ["phone", "password"],
        properties: {
          phone: { type: "string" },
          password: { type: "string" },
          twoFactorToken: { type: "string" },
        },
      },
    },
    handler: controller.login.bind(controller),
  });

  // Refresh token
  fastify.post("/refresh", {
    schema: {
      tags: ["Auth"],
      summary: "Refresh access token",
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
    },
    handler: controller.refresh.bind(controller),
  });

  // Logout
  fastify.post("/logout", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Logout and revoke tokens",
    },
    handler: controller.logout.bind(controller),
  });

  // OTP routes
  fastify.post("/otp/send", {
    preHandler: [rateLimit({ max: 3, windowMs: 60000, keyPrefix: "otp" })],
    schema: {
      tags: ["Auth"],
      summary: "Send OTP to phone",
      body: {
        type: "object",
        required: ["phone", "purpose"],
        properties: {
          phone: { type: "string" },
          purpose: {
            type: "string",
            enum: ["login", "reset_password", "verify"],
          },
        },
      },
    },
    handler: controller.sendOtp.bind(controller),
  });

  fastify.post("/otp/verify", {
    schema: {
      tags: ["Auth"],
      summary: "Verify OTP",
      body: {
        type: "object",
        required: ["phone", "otp", "purpose"],
        properties: {
          phone: { type: "string" },
          otp: { type: "string" },
          purpose: {
            type: "string",
            enum: ["login", "reset_password", "verify"],
          },
        },
      },
    },
    handler: controller.verifyOtp.bind(controller),
  });

  // Password management
  fastify.post("/change-password", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Change password",
      body: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8 },
        },
      },
    },
    handler: controller.changePassword.bind(controller),
  });

  fastify.post("/forgot-password", {
    preHandler: [rateLimit({ max: 3, windowMs: 300000, keyPrefix: "forgot" })],
    schema: {
      tags: ["Auth"],
      summary: "Request password reset",
    },
    handler: controller.forgotPassword.bind(controller),
  });

  fastify.post("/reset-password", {
    schema: {
      tags: ["Auth"],
      summary: "Reset password with OTP",
    },
    handler: controller.resetPassword.bind(controller),
  });

  // 2FA routes
  fastify.post("/2fa/setup", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Setup 2FA",
    },
    handler: controller.setup2FA.bind(controller),
  });

  fastify.post("/2fa/enable", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Enable 2FA with verification token",
    },
    handler: controller.enable2FA.bind(controller),
  });

  fastify.post("/2fa/disable", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Disable 2FA",
    },
    handler: controller.disable2FA.bind(controller),
  });

  // Current user
  fastify.get("/me", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Get current user profile",
    },
    handler: controller.getCurrentUser.bind(controller),
  });
}
```

---

## 8. Session Management

### Session Service

```typescript
// modules/auth/session.service.ts
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export interface Session {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActivityAt: string;
}

export class SessionService {
  async getActiveSessions(userId: string): Promise<Session[]> {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    const sessions: Session[] = [];
    for (const token of tokens) {
      const sessionData = await redis.get(`session:${token.id}`);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, id: sessionId },
      data: { revokedAt: new Date() },
    });

    await redis.del(`session:${sessionId}`);
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    const where: any = { userId, revokedAt: null };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const tokens = await prisma.refreshToken.findMany({ where });

    await prisma.refreshToken.updateMany({
      where,
      data: { revokedAt: new Date() },
    });

    // Clear Redis sessions
    for (const token of tokens) {
      await redis.del(`session:${token.id}`);
    }
  }

  async updateLastActivity(sessionId: string) {
    const sessionData = await redis.get(`session:${sessionId}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivityAt = new Date().toISOString();
      await redis.setex(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify(session),
      );
    }
  }
}
```

---

## 9. Password Policies

```typescript
// common/utils/password.utils.ts
import { AppError } from "@/common/errors/app-error";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

const defaultPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

export function validatePassword(
  password: string,
  policy = defaultPolicy,
): void {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  if (errors.length > 0) {
    throw AppError.badRequest(
      "WEAK_PASSWORD",
      "Password does not meet requirements",
      errors,
    );
  }
}

export function generateSecurePassword(length = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const all = uppercase + lowercase + numbers + special;

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
```

---

## 10. Request User Type Declaration

```typescript
// types/fastify.d.ts
import { FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      userId: string;
      tenantId: string;
      branchIds: string[];
      role: string;
      permissions: string[];
    };
  }
}
```

---

## Summary

This authentication guide covers:

1. **JWT Implementation**: Access and refresh tokens
2. **Auth Service**: Login, logout, token refresh
3. **OTP Authentication**: Phone-based verification
4. **Two-Factor Authentication**: TOTP-based 2FA
5. **RBAC**: Role-based permissions
6. **Auth Routes**: Complete API endpoints
7. **Session Management**: Multi-device sessions
8. **Password Policies**: Validation and generation

Security best practices:

- Short-lived access tokens (15 min)
- Secure refresh token storage
- Rate limiting on auth endpoints
- 2FA for admin roles
- Session tracking and revocation
- Password strength validation
- Audit logging for all auth events
