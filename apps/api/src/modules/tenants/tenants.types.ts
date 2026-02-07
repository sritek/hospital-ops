/**
 * Tenants Module Types
 */

import type { Tenant } from '@prisma/client';

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  email: string;
  phone: string | null;
  logoUrl: string | null;
  hfrId: string | null;
  hipId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  settings: Record<string, unknown>;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateTenantDto {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  settings?: Record<string, unknown>;
}

export interface TenantSettings {
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  defaultLanguage?: string;
}

export function toTenantResponse(tenant: Tenant): TenantResponse {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    legalName: tenant.legalName,
    email: tenant.email,
    phone: tenant.phone,
    logoUrl: tenant.logoUrl,
    hfrId: tenant.hfrId,
    hipId: tenant.hipId,
    address: tenant.address,
    city: tenant.city,
    state: tenant.state,
    pincode: tenant.pincode,
    settings: tenant.settings as Record<string, unknown>,
    subscriptionPlan: tenant.subscriptionPlan,
    subscriptionStatus: tenant.subscriptionStatus,
    trialEndsAt: tenant.trialEndsAt,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}
