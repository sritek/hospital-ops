/**
 * Middleware - Barrel Export
 */

// Authentication
export { authenticate, optionalAuth, requireRole } from './auth.middleware';

// Tenant Context (RLS)
export {
  setTenantContext,
  requireBranch,
  getTenantContext,
  withTenantTransaction,
} from './tenant.middleware';

// Permission Guards
export {
  requirePermission,
  requireAllPermissions,
  requireAdmin,
  requireSuperAdmin,
  requireOwnerOrPermission,
} from './permission.guard';

// Rate Limiting
export {
  createRateLimiter,
  authRateLimiter,
  otpRateLimiter,
  otpHourlyRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  apiRateLimitConfig,
  registerRateLimitHeaders,
  RateLimitError,
} from './rate-limit.middleware';
