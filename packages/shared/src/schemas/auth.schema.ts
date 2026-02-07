/**
 * Authentication Schemas
 */

import { z } from 'zod';

// Phone number validation (Indian format)
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number');

// Password validation with complexity
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Simple password (for login - no complexity check)
const simplePasswordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const loginSchema = z.object({
  phone: phoneSchema,
  password: simplePasswordSchema,
});

export const registerSchema = z.object({
  facilityName: z.string().min(2, 'Facility name must be at least 2 characters').max(255),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').max(255),
  phone: phoneSchema,
  email: z.string().email('Invalid email').optional(),
  password: passwordSchema,
});

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(['login', 'register', 'reset_password', 'verify_phone']),
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'register', 'reset_password', 'verify_phone']),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: simplePasswordSchema,
  newPassword: passwordSchema,
});

export const resetPasswordSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: passwordSchema,
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
