/**
 * Branches Module Types
 */

import type { Branch } from '@prisma/client';

export interface BranchResponse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  timezone: string;
  currency: string;
  workingHours: WorkingHours | null;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breaks?: { start: string; end: string }[];
}

export interface CreateBranchDto {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  timezone?: string;
  workingHours?: WorkingHours;
  settings?: Record<string, unknown>;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  timezone?: string;
  workingHours?: WorkingHours;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

export interface ListBranchesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export function toBranchResponse(branch: Branch): BranchResponse {
  return {
    id: branch.id,
    tenantId: branch.tenantId,
    name: branch.name,
    code: branch.code,
    address: branch.address,
    city: branch.city,
    state: branch.state,
    pincode: branch.pincode,
    phone: branch.phone,
    email: branch.email,
    gstin: branch.gstin,
    timezone: branch.timezone,
    currency: branch.currency,
    workingHours: branch.workingHours as WorkingHours | null,
    settings: branch.settings as Record<string, unknown>,
    isActive: branch.isActive,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}
