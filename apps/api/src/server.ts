/**
 * Fastify Server Entry Point
 */

import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { env } from './config/env';
import { logger } from './lib/logger';
import { HttpError, ValidationError } from './lib/errors';
import { authRoutes } from './modules/auth';
import { initTokenUtil } from './modules/auth/token.util';
import { tenantsRoutes } from './modules/tenants';
import { branchesRoutes } from './modules/branches';
import { usersRoutes } from './modules/users';
import { auditRoutes } from './modules/audit';

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : [env.APP_URL],
    credentials: true,
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Initialize token utility with Fastify instance (after JWT plugin)
  initTokenUtil(fastify);

  // Swagger
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Hospital-Ops API',
        description: 'API documentation for Hospital & Clinic Management Platform',
        version: '1.0.0',
      },
      servers: [
        {
          url: env.API_URL,
          description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }));

  // Ready check (for k8s)
  fastify.get('/health/ready', async () => ({
    status: 'ready',
    timestamp: new Date().toISOString(),
  }));

  // API v1 routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(tenantsRoutes, { prefix: '/api/v1/tenants' });
  await fastify.register(branchesRoutes, { prefix: '/api/v1/branches' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
  await fastify.register(auditRoutes, { prefix: '/api/v1/audit-logs' });
}

async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      logger.error({ err: error, requestId: request.id }, 'Request error');

      if (error instanceof ValidationError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      }

      if (error instanceof HttpError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      // Handle Fastify validation errors
      if (error.validation) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.validation.map((v: any) => ({
              field: v.instancePath?.replace('/', '') || v.params?.missingProperty || 'unknown',
              message: v.message,
            })),
          },
        });
      }

      // Default error response
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        },
      });
    });

    await fastify.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`API documentation at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await fastify.close();
    process.exit(0);
  });
});

start();
