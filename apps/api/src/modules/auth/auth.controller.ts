/**
 * Auth Controller - Route Handlers
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { ValidationError } from '../../lib/errors';
import {
  loginSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import type { z } from 'zod';

type LoginBody = z.infer<typeof loginSchema>;
type RegisterBody = z.infer<typeof registerSchema>;
type OtpRequestBody = z.infer<typeof otpRequestSchema>;
type OtpVerifyBody = z.infer<typeof otpVerifySchema>;
type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

/**
 * POST /auth/register
 */
export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  const validation = registerSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.register(validation.data);

  return reply.status(201).send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/login
 */
export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.login(validation.data, {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/logout
 */
export async function logoutHandler(
  request: FastifyRequest<{ Body: RefreshTokenBody }>,
  reply: FastifyReply
) {
  const validation = refreshTokenSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  await authService.logout(validation.data.refreshToken);

  return reply.send({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}

/**
 * POST /auth/refresh
 */
export async function refreshHandler(
  request: FastifyRequest<{ Body: RefreshTokenBody }>,
  reply: FastifyReply
) {
  const validation = refreshTokenSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.refreshToken(validation.data, {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/request-otp
 */
export async function requestOtpHandler(
  request: FastifyRequest<{ Body: OtpRequestBody }>,
  reply: FastifyReply
) {
  const validation = otpRequestSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.requestOtp(validation.data);

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/verify-otp
 */
export async function verifyOtpHandler(
  request: FastifyRequest<{ Body: OtpVerifyBody }>,
  reply: FastifyReply
) {
  const validation = otpVerifySchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.verifyOtp(validation.data);

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/reset-password
 */
export async function resetPasswordHandler(
  request: FastifyRequest<{ Body: ResetPasswordBody }>,
  reply: FastifyReply
) {
  const validation = resetPasswordSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.resetPassword(validation.data);

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * POST /auth/change-password
 */
export async function changePasswordHandler(
  request: FastifyRequest<{ Body: ChangePasswordBody }>,
  reply: FastifyReply
) {
  const validation = changePasswordSchema.safeParse(request.body);

  if (!validation.success) {
    throw new ValidationError(
      'Validation failed',
      validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    );
  }

  const result = await authService.changePassword({
    userId: request.currentUser.sub,
    ...validation.data,
  });

  return reply.send({
    success: true,
    data: result,
  });
}

/**
 * GET /auth/me
 */
export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await authService.getCurrentUser(request.currentUser.sub);

  return reply.send({
    success: true,
    data: user,
  });
}
