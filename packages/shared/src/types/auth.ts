/**
 * Authentication Types
 */

import type { UserRole } from './index';

// Login Response
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

// Authenticated User
export interface AuthUser {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  branches: UserBranch[];
  primaryBranchId?: string;
}

// User Branch Assignment
export interface UserBranch {
  id: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  isPrimary: boolean;
}

// Token Payload (decoded JWT)
export interface TokenPayload {
  sub: string;
  tenantId: string;
  branchIds: string[];
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// Refresh Token Response
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Registration Input
export interface RegisterInput {
  facilityName: string;
  phone: string;
  password: string;
  email?: string;
  ownerName: string;
}

// Registration Response
export interface RegisterResponse {
  tenantId: string;
  userId: string;
  message: string;
}

// OTP Purpose
export type OtpPurpose = 'login' | 'register' | 'reset_password' | 'verify_phone';

// OTP Request
export interface OtpRequest {
  phone: string;
  purpose: OtpPurpose;
}

// OTP Verify
export interface OtpVerify {
  phone: string;
  code: string;
  purpose: OtpPurpose;
}

// Password Reset
export interface PasswordResetInput {
  phone: string;
  otp: string;
  newPassword: string;
}

// Password Change
export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}
