/**
 * Common Zod Schemas
 */

import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number');

export const emailSchema = z.string().email().optional();

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const abhaSchema = z
  .string()
  .regex(/^\d{14}$/, 'Invalid ABHA number')
  .optional();

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
