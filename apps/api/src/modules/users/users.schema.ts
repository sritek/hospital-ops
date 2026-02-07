/**
 * Users Module Validation Schemas
 */

import { z } from 'zod';
import { UserRole } from '@prisma/client';

const userRoleEnum = z.nativeEnum(UserRole);

export const createUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(2).max(255),
  gender: z.enum(['male', 'female', 'other']).optional(),
  role: userRoleEnum,
  registrationNumber: z.string().max(50).optional(),
  registrationCouncil: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  qualification: z.string().max(255).optional(),
  branchIds: z.array(z.string().uuid()).min(1, 'At least one branch required'),
  primaryBranchId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(255).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  role: userRoleEnum.optional(),
  registrationNumber: z.string().max(50).optional(),
  registrationCouncil: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  qualification: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: userRoleEnum.optional(),
  branchId: z.string().uuid().optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const assignBranchesSchema = z.object({
  branchIds: z.array(z.string().uuid()).min(1, 'At least one branch required'),
  primaryBranchId: z.string().uuid().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type AssignBranchesInput = z.infer<typeof assignBranchesSchema>;
