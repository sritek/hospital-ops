/**
 * Role-Permission Matrix for Hospital-Ops
 */

import type { UserRole } from '../types';

export const PERMISSIONS = {
  // Tenant
  TENANT_READ: 'tenants:read',
  TENANT_WRITE: 'tenants:write',
  TENANT_MANAGE: 'tenants:*',

  // Branch
  BRANCH_READ: 'branches:read',
  BRANCH_WRITE: 'branches:write',
  BRANCH_CREATE: 'branches:create',
  BRANCH_DELETE: 'branches:delete',
  BRANCH_MANAGE: 'branches:*',

  // Users/Staff
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_CREATE: 'users:create',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:*',

  // Audit
  AUDIT_READ: 'audit:read',

  // Patients
  PATIENTS_READ: 'patients:read',
  PATIENTS_WRITE: 'patients:write',
  PATIENTS_READ_LIMITED: 'patients:read:limited',
  PATIENTS_MANAGE: 'patients:*',

  // Appointments
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_WRITE: 'appointments:write',
  APPOINTMENTS_READ_OWN: 'appointments:read:own',
  APPOINTMENTS_WRITE_OWN: 'appointments:write:own',
  APPOINTMENTS_MANAGE: 'appointments:*',

  // Consultations
  CONSULTATIONS_READ: 'consultations:read',
  CONSULTATIONS_WRITE: 'consultations:write',
  CONSULTATIONS_MANAGE: 'consultations:*',

  // Prescriptions
  PRESCRIPTIONS_READ: 'prescriptions:read',
  PRESCRIPTIONS_WRITE: 'prescriptions:write',
  PRESCRIPTIONS_MANAGE: 'prescriptions:*',

  // IPD
  IPD_READ: 'ipd:read',
  IPD_WRITE: 'ipd:write',
  IPD_WRITE_OWN: 'ipd:write:own',
  IPD_WRITE_NURSING: 'ipd:write:nursing',
  IPD_MANAGE: 'ipd:*',

  // Laboratory
  LAB_ORDERS_READ: 'lab_orders:read',
  LAB_ORDERS_WRITE: 'lab_orders:write',
  LAB_RESULTS_READ: 'lab_results:read',
  LAB_RESULTS_WRITE: 'lab_results:write',
  SAMPLES_MANAGE: 'samples:*',

  // Pharmacy
  DISPENSING_READ: 'dispensing:read',
  DISPENSING_WRITE: 'dispensing:write',
  DISPENSING_MANAGE: 'dispensing:*',

  // Vitals
  VITALS_READ: 'vitals:read',
  VITALS_WRITE: 'vitals:write',

  // Medication Administration
  MEDICATION_ADMIN_WRITE: 'medication_admin:write',

  // Queue
  QUEUE_MANAGE: 'queue:*',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_WRITE: 'billing:write',
  BILLING_MANAGE: 'billing:*',

  // Insurance
  INSURANCE_READ: 'insurance:read',
  INSURANCE_WRITE: 'insurance:write',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_READ_BRANCH: 'reports:read:branch',
  REPORTS_READ_FINANCIAL: 'reports:read:financial',
  REPORTS_MANAGE: 'reports:*',

  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_MANAGE: 'inventory:*',

  // Settings
  SETTINGS_MANAGE: 'settings:manage',

  // All permissions
  ALL: '*',
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [PERMISSIONS.ALL],

  branch_admin: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.PATIENTS_MANAGE,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.CONSULTATIONS_MANAGE,
    PERMISSIONS.PRESCRIPTIONS_MANAGE,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ],

  doctor: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE_OWN,
    PERMISSIONS.CONSULTATIONS_MANAGE,
    PERMISSIONS.PRESCRIPTIONS_MANAGE,
    PERMISSIONS.LAB_ORDERS_WRITE,
    PERMISSIONS.LAB_RESULTS_READ,
    PERMISSIONS.IPD_READ,
    PERMISSIONS.IPD_WRITE_OWN,
  ],

  nurse: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.VITALS_WRITE,
    PERMISSIONS.IPD_READ,
    PERMISSIONS.IPD_WRITE_NURSING,
    PERMISSIONS.MEDICATION_ADMIN_WRITE,
  ],

  receptionist: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_WRITE,
    PERMISSIONS.QUEUE_MANAGE,
  ],

  pharmacist: [
    PERMISSIONS.PATIENTS_READ_LIMITED,
    PERMISSIONS.PRESCRIPTIONS_READ,
    PERMISSIONS.DISPENSING_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
  ],

  lab_tech: [
    PERMISSIONS.PATIENTS_READ_LIMITED,
    PERMISSIONS.LAB_ORDERS_READ,
    PERMISSIONS.LAB_RESULTS_WRITE,
    PERMISSIONS.SAMPLES_MANAGE,
  ],

  accountant: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_READ_FINANCIAL,
    PERMISSIONS.INSURANCE_READ,
    PERMISSIONS.AUDIT_READ,
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes(PERMISSIONS.ALL)) return true;
  const [resource] = permission.split(':');
  return permissions.includes(permission) || permissions.includes(`${resource}:*`);
}

export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    branch_admin: 'Branch Admin',
    doctor: 'Doctor',
    nurse: 'Nurse',
    receptionist: 'Receptionist',
    pharmacist: 'Pharmacist',
    lab_tech: 'Lab Technician',
    accountant: 'Accountant',
  };
  return displayNames[role] || role;
}

/**
 * All available roles
 */
export const ALL_ROLES: UserRole[] = [
  'super_admin',
  'branch_admin',
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'lab_tech',
  'accountant',
];

/**
 * Roles that can be assigned by branch_admin
 */
export const BRANCH_ASSIGNABLE_ROLES: UserRole[] = [
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'lab_tech',
  'accountant',
];
