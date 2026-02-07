/**
 * Password Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePasswordComplexity,
  isPasswordReused,
} from '../password.util';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hash = await hashPassword('TestPassword123!');

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordComplexity', () => {
    it('should accept a strong password', () => {
      const result = validatePasswordComplexity('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a password that is too short', () => {
      const result = validatePasswordComplexity('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject a password without uppercase', () => {
      const result = validatePasswordComplexity('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject a password without lowercase', () => {
      const result = validatePasswordComplexity('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject a password without numbers', () => {
      const result = validatePasswordComplexity('NoNumbersHere!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject a password without special characters', () => {
      const result = validatePasswordComplexity('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak passwords', () => {
      const result = validatePasswordComplexity('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('isPasswordReused', () => {
    it('should detect reused password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isReused = await isPasswordReused(password, [hash]);
      expect(isReused).toBe(true);
    });

    it('should not flag new password', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';
      const hash = await hashPassword(oldPassword);

      const isReused = await isPasswordReused(newPassword, [hash]);
      expect(isReused).toBe(false);
    });

    it('should check only specified number of recent passwords', async () => {
      const passwords = ['Pass1!aA', 'Pass2!aA', 'Pass3!aA', 'Pass4!aA', 'Pass5!aA', 'Pass6!aA'];
      const hashes = await Promise.all(passwords.map((p) => hashPassword(p)));

      // Check only first 3 passwords (Pass1, Pass2, Pass3)
      const isReused = await isPasswordReused('Pass1!aA', hashes, 3);
      expect(isReused).toBe(true);

      // Pass6 is at index 5, so if we only check first 3, it should not be found
      const isPass6Reused = await isPasswordReused('Pass6!aA', hashes, 3);
      expect(isPass6Reused).toBe(false);
    });
  });
});
