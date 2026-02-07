/**
 * Auth Routes
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authenticate,
  authRateLimiter,
  otpRateLimiter,
  otpHourlyRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
} from '../../middleware';
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  requestOtpHandler,
  verifyOtpHandler,
  resetPasswordHandler,
  changePasswordHandler,
  meHandler,
} from './auth.controller';

export async function authRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  // POST /auth/register - Register new tenant
  fastify.post('/register', {
    preHandler: [registrationRateLimiter],
    schema: {
      description: 'Register a new healthcare facility (tenant) with owner account',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['facilityName', 'ownerName', 'phone', 'password'],
        properties: {
          facilityName: { type: 'string', minLength: 2, maxLength: 255 },
          ownerName: { type: 'string', minLength: 2, maxLength: 255 },
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                tenantId: { type: 'string' },
                userId: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: registerHandler,
  });

  // POST /auth/login - Login with phone and password
  fastify.post('/login', {
    preHandler: [authRateLimiter],
    schema: {
      description: 'Login with phone number and password',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['phone', 'password'],
        properties: {
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    tenantId: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    avatarUrl: { type: 'string' },
                    branches: { type: 'array' },
                    primaryBranchId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: loginHandler,
  });

  // POST /auth/logout - Logout (revoke refresh token)
  fastify.post('/logout', {
    schema: {
      description: 'Logout and revoke refresh token',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: logoutHandler,
  });

  // POST /auth/refresh - Refresh access token
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token using refresh token',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: refreshHandler,
  });

  // POST /auth/request-otp - Request OTP
  fastify.post('/request-otp', {
    preHandler: [otpRateLimiter, otpHourlyRateLimiter],
    schema: {
      description: 'Request OTP for login, registration, or password reset',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['phone', 'purpose'],
        properties: {
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          purpose: {
            type: 'string',
            enum: ['login', 'register', 'reset_password', 'verify_phone'],
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: requestOtpHandler,
  });

  // POST /auth/verify-otp - Verify OTP
  fastify.post('/verify-otp', {
    preHandler: [authRateLimiter],
    schema: {
      description: 'Verify OTP code',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['phone', 'code', 'purpose'],
        properties: {
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
          purpose: {
            type: 'string',
            enum: ['login', 'register', 'reset_password', 'verify_phone'],
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: verifyOtpHandler,
  });

  // POST /auth/reset-password - Reset password with OTP
  fastify.post('/reset-password', {
    preHandler: [passwordResetRateLimiter],
    schema: {
      description: 'Reset password using OTP verification',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['phone', 'otp', 'newPassword'],
        properties: {
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          otp: { type: 'string', minLength: 6, maxLength: 6 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: resetPasswordHandler,
  });

  // Protected routes (authentication required)

  // POST /auth/change-password - Change password (authenticated)
  fastify.post('/change-password', {
    preHandler: [authenticate],
    schema: {
      description: 'Change password for authenticated user',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 8 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: changePasswordHandler,
  });

  // GET /auth/me - Get current user profile
  fastify.get('/me', {
    preHandler: [authenticate],
    schema: {
      description: 'Get current authenticated user profile',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                tenantId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                role: { type: 'string' },
                avatarUrl: { type: 'string' },
                branches: { type: 'array' },
                primaryBranchId: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: meHandler,
  });
}
