/**
 * Formatting Utilities for Indian Healthcare
 */

import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { enIN } from 'date-fns/locale';

/**
 * Format currency in Indian format (₹X,XX,XXX.XX)
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (compact && amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number in Indian format (X,XX,XXX)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format date (DD/MM/YYYY - Indian format)
 */
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: enIN });
}

/**
 * Format relative date (Today, Tomorrow, Yesterday, or date)
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy', { locale: enIN });
}

/**
 * Format time (12-hour with AM/PM)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');

  if (!hours || !minutes || hours.length !== 2 || minutes.length !== 2) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const h = parseInt(hours, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}
