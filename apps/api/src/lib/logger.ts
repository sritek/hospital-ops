/**
 * Logger Setup (Pino)
 */

import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
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
  base: {
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.abhaNumber',
      '*.aadhaar',
    ],
    remove: true,
  },
});

export const createRequestLogger = (requestId: string, tenantId?: string) => {
  return logger.child({ requestId, tenantId });
};

export default logger;
