/**
 * Auth Module Types
 */

import type { User, Tenant, Branch, UserBranch, RefreshToken, OtpCode } from '@prisma/client';
import type { UserRole, TokenPayload, AuthUser, LoginResponse } from '@hospital-ops/shared';

// User with relations
export interface UserWithBranches extends User {
  userBranches: (UserBranch & { branch: Branch })[];
}

// User with tenant
export interface UserWithTenant extends User {
  tenant: Tenant;
  userBranches: (UserBranch & { branch: Branch })[];
}

// Token generation input
export interface GenerateTokensInput {
  userId: string;
  tenantId: string;
  role: UserRole;
  branchIds: string[];
}

// Token generation result
export interface GenerateTokensResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Login input (internal)
export interface LoginInput {
  phone: string;
  password: string;
  tenantId?: string;
}

// Register input (internal)
export interface RegisterInput {
  facilityName: string;
  ownerName: string;
  phone: string;
  email?: string;
  password: string;
}

// OTP generation input
export interface GenerateOtpInput {
  phone: string;
  purpose: 'login' | 'register' | 'reset_password' | 'verify_phone';
  tenantId?: string;
}

// OTP verification input
export interface VerifyOtpInput {
  phone: string;
  code: string;
  purpose: 'login' | 'register' | 'reset_password' | 'verify_phone';
}

// Password reset input
export interface ResetPasswordInput {
  phone: string;
  otp: string;
  newPassword: string;
}

// Password change input
export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// Refresh token input
export interface RefreshTokenInput {
  refreshToken: string;
}

// Re-export for convenience
export type { TokenPayload, AuthUser, LoginResponse, UserRole };
