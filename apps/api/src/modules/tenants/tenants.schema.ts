/**
 * Tenants Module Validation Schemas
 */

import { z } from 'zod';

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  legalName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
    .optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Invalid pincode')
    .optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// File upload constraints
export const logoUploadSchema = z.object({
  filename: z.string(),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(2 * 1024 * 1024, 'Logo must be less than 2MB'),
});

export type LogoUploadInput = z.infer<typeof logoUploadSchema>;
