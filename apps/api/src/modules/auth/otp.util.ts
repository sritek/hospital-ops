/**
 * OTP Generation and Verification Utilities
 */

import { randomInt } from 'crypto';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a random OTP code
 */
export function generateOtpCode(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return randomInt(min, max).toString();
}

/**
 * Get OTP expiry date
 */
export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Check if OTP is expired
 */
export function isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Check if max attempts exceeded
 */
export function isMaxAttemptsExceeded(attempts: number): boolean {
  return attempts >= MAX_OTP_ATTEMPTS;
}

/**
 * Get OTP configuration
 */
export function getOtpConfig() {
  return {
    length: OTP_LENGTH,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    maxAttempts: MAX_OTP_ATTEMPTS,
  };
}

/**
 * Mask phone number for display (e.g., ****543210)
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 6) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}
