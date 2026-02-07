/**
 * Permission Helper Tests
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
  getRoleDisplayName,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from '../constants/roles';
import type { UserRole } from '../types';

describe('Permission Helpers', () => {
  describe('hasPermission', () => {
    it('should return true for super_admin with any permission', () => {
      expect(hasPermission('super_admin', 'users:read')).toBe(true);
      expect(hasPermission('super_admin', 'tenants:write')).toBe(true);
      expect(hasPermission('super_admin', 'any:permission')).toBe(true);
    });

    it('should return true for exact permission match', () => {
      expect(hasPermission('doctor', 'patients:read')).toBe(true);
      expect(hasPermission('receptionist', 'appointments:read')).toBe(true);
    });

    it('should return true for wildcard permission match', () => {
      // Doctor has consultations:* which should match consultations:read
      expect(hasPermission('doctor', 'consultations:read')).toBe(true);
      expect(hasPermission('doctor', 'consultations:write')).toBe(true);
    });

    it('should return false for missing permission', () => {
      expect(hasPermission('doctor', 'billing:write')).toBe(false);
      expect(hasPermission('nurse', 'users:write')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid_role' as UserRole, 'users:read')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', () => {
      expect(hasAnyPermission('doctor', ['patients:read', 'billing:write'])).toBe(true);
      expect(hasAnyPermission('nurse', ['vitals:write', 'billing:manage'])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(hasAnyPermission('lab_tech', ['billing:write', 'users:manage'])).toBe(false);
    });

    it('should return true for super_admin with any permissions', () => {
      expect(hasAnyPermission('super_admin', ['any:permission', 'another:one'])).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(hasAllPermissions('doctor', ['patients:read', 'patients:write'])).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      expect(hasAllPermissions('doctor', ['patients:read', 'billing:write'])).toBe(false);
    });

    it('should return true for super_admin with any permissions', () => {
      expect(hasAllPermissions('super_admin', ['any:permission', 'another:one'])).toBe(true);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return permissions array for valid role', () => {
      const permissions = getPermissionsForRole('doctor');
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return wildcard for super_admin', () => {
      const permissions = getPermissionsForRole('super_admin');
      expect(permissions).toContain('*');
    });

    it('should return empty array for invalid role', () => {
      const permissions = getPermissionsForRole('invalid_role' as UserRole);
      expect(permissions).toEqual([]);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return formatted display name', () => {
      expect(getRoleDisplayName('super_admin')).toBe('Super Admin');
      expect(getRoleDisplayName('branch_admin')).toBe('Branch Admin');
      expect(getRoleDisplayName('doctor')).toBe('Doctor');
      expect(getRoleDisplayName('lab_tech')).toBe('Lab Technician');
    });

    it('should return role as fallback for unknown role', () => {
      expect(getRoleDisplayName('unknown_role' as UserRole)).toBe('unknown_role');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should have permissions defined for all roles', () => {
      const roles: UserRole[] = [
        'super_admin',
        'branch_admin',
        'doctor',
        'nurse',
        'receptionist',
        'pharmacist',
        'lab_tech',
        'accountant',
      ];

      roles.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should have super_admin with wildcard permission', () => {
      expect(ROLE_PERMISSIONS.super_admin).toContain(PERMISSIONS.ALL);
    });
  });

  describe('Role-specific permissions', () => {
    it('branch_admin should have user management permissions', () => {
      expect(hasPermission('branch_admin', 'users:read')).toBe(true);
      expect(hasPermission('branch_admin', 'users:write')).toBe(true);
    });

    it('doctor should have clinical permissions', () => {
      expect(hasPermission('doctor', 'patients:read')).toBe(true);
      expect(hasPermission('doctor', 'prescriptions:write')).toBe(true);
      expect(hasPermission('doctor', 'lab_orders:write')).toBe(true);
    });

    it('nurse should have vitals and nursing permissions', () => {
      expect(hasPermission('nurse', 'vitals:write')).toBe(true);
      expect(hasPermission('nurse', 'ipd:write:nursing')).toBe(true);
    });

    it('receptionist should have appointment and billing permissions', () => {
      expect(hasPermission('receptionist', 'appointments:read')).toBe(true);
      expect(hasPermission('receptionist', 'billing:read')).toBe(true);
    });

    it('pharmacist should have dispensing permissions', () => {
      expect(hasPermission('pharmacist', 'prescriptions:read')).toBe(true);
      expect(hasPermission('pharmacist', 'dispensing:write')).toBe(true);
    });

    it('lab_tech should have lab permissions', () => {
      expect(hasPermission('lab_tech', 'lab_orders:read')).toBe(true);
      expect(hasPermission('lab_tech', 'lab_results:write')).toBe(true);
    });

    it('accountant should have financial permissions', () => {
      expect(hasPermission('accountant', 'billing:read')).toBe(true);
      expect(hasPermission('accountant', 'reports:read:financial')).toBe(true);
    });
  });
});
