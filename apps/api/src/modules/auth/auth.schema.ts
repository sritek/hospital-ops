/**
 * Auth Route Schemas (Fastify/Swagger)
 */

import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from '@hospital-ops/shared';

// Re-export shared schemas
export {
  loginSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordSchema,
};

// Response schemas for Swagger documentation
export const loginResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    user: z.object({
      id: z.string(),
      tenantId: z.string(),
      name: z.string(),
      email: z.string().optional(),
      phone: z.string(),
      role: z.string(),
      avatarUrl: z.string().optional(),
      branches: z.array(
        z.object({
          id: z.string(),
          branchId: z.string(),
          branchName: z.string(),
          branchCode: z.string(),
          isPrimary: z.boolean(),
        })
      ),
      primaryBranchId: z.string().optional(),
    }),
  }),
});

export const registerResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    tenantId: z.string(),
    userId: z.string(),
    message: z.string(),
  }),
});

export const refreshResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    accessToken: z.string(),
    expiresIn: z.number(),
  }),
});

export const otpResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    message: z.string(),
    expiresIn: z.number(),
  }),
});

export const verifyOtpResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    valid: z.boolean(),
    message: z.string(),
  }),
});

export const messageResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    message: z.string(),
  }),
});

export const userResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string(),
    role: z.string(),
    avatarUrl: z.string().optional(),
    branches: z.array(
      z.object({
        id: z.string(),
        branchId: z.string(),
        branchName: z.string(),
        branchCode: z.string(),
        isPrimary: z.boolean(),
      })
    ),
    primaryBranchId: z.string().optional(),
  }),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  }),
});
