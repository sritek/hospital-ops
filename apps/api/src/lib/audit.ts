/**
 * Audit Service
 * Centralized audit logging for sensitive actions
 */

import type { FastifyRequest } from 'fastify';
import { prisma } from './prisma';

export interface AuditLogParams {
  tenantId: string;
  branchId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  request?: FastifyRequest;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        branchId: params.branchId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues,
        newValues: params.newValues,
        ipAddress: params.request?.ip,
        userAgent: params.request?.headers['user-agent'],
        requestId: params.request?.id,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Audit action types
 */
export const AuditAction = {
  // User actions
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',
  USER_ACTIVATE: 'user.activate',
  USER_DEACTIVATE: 'user.deactivate',

  // Auth actions
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGE: 'auth.password_change',
  PASSWORD_RESET: 'auth.password_reset',

  // Branch actions
  BRANCH_CREATE: 'branch.create',
  BRANCH_UPDATE: 'branch.update',
  BRANCH_DELETE: 'branch.delete',
  BRANCH_ACTIVATE: 'branch.activate',
  BRANCH_DEACTIVATE: 'branch.deactivate',

  // Tenant actions
  TENANT_UPDATE: 'tenant.update',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Entity types for audit logging
 */
export const EntityType = {
  USER: 'user',
  BRANCH: 'branch',
  TENANT: 'tenant',
  PATIENT: 'patient',
  APPOINTMENT: 'appointment',
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

/**
 * Helper to extract changed fields
 */
export function getChangedFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { oldValues: Record<string, unknown>; newValues: Record<string, unknown> } {
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  for (const key of Object.keys(newObj)) {
    if (oldObj[key] !== newObj[key]) {
      oldValues[key] = oldObj[key];
      newValues[key] = newObj[key];
    }
  }

  return { oldValues, newValues };
}

/**
 * Audit log query options
 */
export interface AuditLogQueryOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(options: AuditLogQueryOptions) {
  const {
    tenantId,
    page = 1,
    limit = 20,
    entityType,
    entityId,
    userId,
    action,
    startDate,
    endDate,
  } = options;

  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
    ...(userId && { userId }),
    ...(action && { action }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
