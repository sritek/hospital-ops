/**
 * Mock clinic and branch data
 */

import type { Clinic, Branch } from './types';

export const mockBranches: Branch[] = [
  {
    id: 'branch-001',
    tenantId: 'tenant-001',
    name: 'Main Branch - Sector 18',
    code: 'HF-S18',
    address: '123, MG Road, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    phone: '0120-4567890',
    email: 'sector18@healthfirst.in',
    gstin: '09AAACH1234A1Z5',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    workingHours: {
      monday: { open: '09:00', close: '21:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tuesday: { open: '09:00', close: '21:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { open: '09:00', close: '21:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { open: '09:00', close: '21:00', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { open: '09:00', close: '21:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '14:00' },
    },
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'branch-002',
    tenantId: 'tenant-001',
    name: 'Sector 62 Branch',
    code: 'HF-S62',
    address: '456, Institutional Area, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    phone: '0120-4567891',
    email: 'sector62@healthfirst.in',
    gstin: '09AAACH1234A1Z6',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    workingHours: {
      monday: { open: '10:00', close: '20:00' },
      tuesday: { open: '10:00', close: '20:00' },
      wednesday: { open: '10:00', close: '20:00' },
      thursday: { open: '10:00', close: '20:00' },
      friday: { open: '10:00', close: '20:00' },
      saturday: { open: '10:00', close: '17:00' },
    },
    isActive: true,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
];

export const mockClinic: Clinic = {
  id: 'tenant-001',
  name: 'HealthFirst Multi-Specialty Clinic',
  slug: 'healthfirst',
  legalName: 'HealthFirst Healthcare Pvt. Ltd.',
  email: 'contact@healthfirst.in',
  phone: '0120-4567890',
  logoUrl: '/images/clinic-logo.png',
  address: '123, MG Road, Sector 18',
  city: 'Noida',
  state: 'Uttar Pradesh',
  pincode: '201301',
  gstin: '09AAACH1234A1Z5',
  hfrId: 'IN2710000001',
  hipId: 'HIP2710000001',
  subscriptionPlan: 'professional',
  subscriptionStatus: 'active',
  branches: mockBranches,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

// Helper to get branch by ID
export function getBranchById(branchId: string): Branch | undefined {
  return mockBranches.find((b) => b.id === branchId);
}

// Helper to get active branches
export function getActiveBranches(): Branch[] {
  return mockBranches.filter((b) => b.isActive);
}
