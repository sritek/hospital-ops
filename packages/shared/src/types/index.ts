// Shared TypeScript Types

// Re-export auth types
export * from './auth';

// User Roles
export type UserRole =
  | 'super_admin'
  | 'branch_admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_tech'
  | 'accountant';

// Appointment Status
export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// Appointment Type
export type AppointmentType = 'consultation' | 'follow_up' | 'procedure' | 'telemedicine';

// Booking Status (for patients)
export type BookingStatus = 'normal' | 'warning' | 'prepaid_only' | 'blocked';

// Payment Status
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

// Payment Method
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'insurance' | 'wallet';

// Gender
export type Gender = 'male' | 'female' | 'other';

// Blood Group
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Subscription Plan
export type SubscriptionPlan = 'trial' | 'basic' | 'professional' | 'enterprise';

// Subscription Status
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// JWT Payload
export interface JWTPayload {
  sub: string;
  tenantId: string;
  branchIds: string[];
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  branchId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
