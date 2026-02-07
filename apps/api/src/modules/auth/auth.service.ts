/**
 * Auth Service - Business Logic
 */

import { authRepository } from './auth.repository';
import { hashPassword, verifyPassword, isPasswordReused } from './password.util';
import { generateTokens, getRefreshTokenExpiry } from './token.util';
import { generateOtpCode, getOtpExpiry, isOtpExpired, isMaxAttemptsExceeded } from './otp.util';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type {
  LoginInput,
  RegisterInput,
  GenerateOtpInput,
  VerifyOtpInput,
  ResetPasswordInput,
  ChangePasswordInput,
  RefreshTokenInput,
  AuthUser,
  LoginResponse,
  UserWithBranches,
} from './auth.types';

// Account lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export class AuthService {
  /**
   * Login with phone and password
   */
  async login(
    input: LoginInput,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponse> {
    const { phone, password, tenantId } = input;

    // Find user
    const user = await authRepository.findUserByPhone(phone, tenantId);

    if (!user) {
      await this.recordFailedAttempt(phone, tenantId, meta, 'User not found');
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.recordFailedAttempt(phone, tenantId, meta, 'Account locked');
      throw new UnauthorizedError('Account is temporarily locked. Please try again later.');
    }

    // Check if user is active
    if (!user.isActive) {
      await this.recordFailedAttempt(phone, tenantId, meta, 'Account inactive');
      throw new UnauthorizedError('Account is inactive. Please contact administrator.');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      await this.handleFailedLogin(user.id, phone, tenantId, meta);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await authRepository.resetFailedLoginCount(user.id);
    await authRepository.updateLastLogin(user.id);

    // Record successful login
    await authRepository.recordLoginAttempt({
      phone,
      tenantId: user.tenantId,
      success: true,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // Generate tokens
    const branchIds = user.userBranches.map((b) => b.branchId);
    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as any,
      branchIds,
    });

    // Store refresh token
    await authRepository.createRefreshToken({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.mapToAuthUser(user),
    };
  }

  /**
   * Register new tenant with owner
   */
  async register(
    input: RegisterInput
  ): Promise<{ tenantId: string; userId: string; message: string }> {
    const { facilityName, ownerName, phone, email, password } = input;

    // Check if phone already exists
    const existingUser = await authRepository.findUserByPhone(phone);
    if (existingUser) {
      throw new ConflictError('Phone number is already registered');
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await authRepository.findUserByEmail(email);
      if (existingEmail) {
        throw new ConflictError('Email is already registered');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create tenant with owner
    const result = await authRepository.createTenantWithOwner({
      facilityName,
      ownerName,
      phone,
      email,
      passwordHash,
    });

    // Add password to history
    await authRepository.addPasswordHistory(result.user.id, passwordHash);

    logger.info({ tenantId: result.tenant.id, userId: result.user.id }, 'New tenant registered');

    return {
      tenantId: result.tenant.id,
      userId: result.user.id,
      message: 'Registration successful. Your 30-day free trial has started.',
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    input: RefreshTokenInput,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const { refreshToken } = input;

    // Find refresh token
    const storedToken = await authRepository.findRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Get user
    const user = await authRepository.findUserById(storedToken.userId);

    if (!user || !user.isActive) {
      await authRepository.revokeRefreshToken(refreshToken);
      throw new UnauthorizedError('User account is inactive');
    }

    // Generate new access token
    const branchIds = user.userBranches.map((b) => b.branchId);
    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as any,
      branchIds,
    });

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await authRepository.revokeRefreshToken(refreshToken);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await authRepository.revokeAllUserTokens(userId);
  }

  /**
   * Request OTP
   */
  async requestOtp(input: GenerateOtpInput): Promise<{ message: string; expiresIn: number }> {
    const { phone, purpose, tenantId } = input;

    // For login/reset, verify user exists
    if (purpose === 'login' || purpose === 'reset_password') {
      const user = await authRepository.findUserByPhone(phone, tenantId);
      if (!user) {
        // Don't reveal if user exists
        return {
          message: 'If the phone number is registered, you will receive an OTP',
          expiresIn: 600,
        };
      }
    }

    // Generate OTP
    const code = generateOtpCode();
    const expiresAt = getOtpExpiry();

    // Store OTP
    await authRepository.createOtpCode({
      phone,
      code,
      purpose,
      expiresAt,
      tenantId,
    });

    // TODO: Send OTP via SMS/WhatsApp
    // For development, log the OTP
    if (process.env.NODE_ENV === 'development') {
      logger.info({ phone, code, purpose }, 'OTP generated (dev mode)');
    }

    return {
      message: 'OTP sent successfully',
      expiresIn: 600, // 10 minutes
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(input: VerifyOtpInput): Promise<{ valid: boolean; message: string }> {
    const { phone, code, purpose } = input;

    // Find valid OTP
    const otp = await authRepository.findValidOtpCode(phone, code, purpose);

    if (!otp) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    // Check if expired
    if (isOtpExpired(otp.expiresAt)) {
      return { valid: false, message: 'OTP has expired' };
    }

    // Check max attempts
    if (isMaxAttemptsExceeded(otp.attempts)) {
      return { valid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempts
    await authRepository.incrementOtpAttempts(otp.id);

    // Verify code
    if (otp.code !== code) {
      return { valid: false, message: 'Invalid OTP' };
    }

    // Mark as used
    await authRepository.markOtpUsed(otp.id);

    return { valid: true, message: 'OTP verified successfully' };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const { phone, otp, newPassword } = input;

    // Verify OTP
    const otpResult = await this.verifyOtp({ phone, code: otp, purpose: 'reset_password' });

    if (!otpResult.valid) {
      throw new BadRequestError(otpResult.message);
    }

    // Find user
    const user = await authRepository.findUserByPhone(phone);

    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Check password history
    const recentHashes = await authRepository.getRecentPasswordHashes(user.id);
    const isReused = await isPasswordReused(newPassword, recentHashes);

    if (isReused) {
      throw new BadRequestError(
        'Cannot reuse recent passwords. Please choose a different password.'
      );
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(user.id, passwordHash);
    await authRepository.addPasswordHistory(user.id, passwordHash);

    // Revoke all refresh tokens
    await authRepository.revokeAllUserTokens(user.id);

    // Reset lockout
    await authRepository.resetFailedLoginCount(user.id);

    logger.info({ userId: user.id }, 'Password reset successful');

    return { message: 'Password reset successful. Please login with your new password.' };
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const { userId, currentPassword, newPassword } = input;

    // Get user
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    // Check password history
    const recentHashes = await authRepository.getRecentPasswordHashes(userId);
    const isReused = await isPasswordReused(newPassword, recentHashes);

    if (isReused) {
      throw new BadRequestError(
        'Cannot reuse recent passwords. Please choose a different password.'
      );
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(userId, passwordHash);
    await authRepository.addPasswordHistory(userId, passwordHash);

    logger.info({ userId }, 'Password changed successfully');

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new BadRequestError('User not found');
    }

    return this.mapToAuthUser(user);
  }

  // ==================== Private Methods ====================

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(
    userId: string,
    phone: string,
    tenantId: string | undefined,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    // Get current user to check failed count
    const user = await authRepository.findUserById(userId);

    if (!user) return;

    const newCount = user.failedLoginCount + 1;

    // Lock account if max attempts exceeded
    let lockedUntil: Date | undefined;
    if (newCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      logger.warn({ userId, phone }, 'Account locked due to too many failed attempts');
    }

    await authRepository.updateFailedLoginCount(userId, newCount, lockedUntil);

    // Record failed attempt
    await this.recordFailedAttempt(phone, tenantId, meta, 'Invalid password');
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedAttempt(
    phone: string,
    tenantId: string | undefined,
    meta?: { ipAddress?: string; userAgent?: string },
    reason?: string
  ): Promise<void> {
    await authRepository.recordLoginAttempt({
      phone,
      tenantId,
      success: false,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      failureReason: reason,
    });
  }

  /**
   * Map user to AuthUser response
   */
  private mapToAuthUser(user: UserWithBranches): AuthUser {
    const primaryBranch = user.userBranches.find((b) => b.isPrimary);

    return {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email || undefined,
      phone: user.phone,
      role: user.role as any,
      avatarUrl: user.avatarUrl || undefined,
      branches: user.userBranches.map((b) => ({
        id: b.id,
        branchId: b.branchId,
        branchName: b.branch.name,
        branchCode: b.branch.code,
        isPrimary: b.isPrimary,
      })),
      primaryBranchId: primaryBranch?.branchId,
    };
  }
}

export const authService = new AuthService();
