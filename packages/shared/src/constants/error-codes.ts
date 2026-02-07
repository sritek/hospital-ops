/**
 * Error Codes for Hospital-Ops
 */

export const ErrorCode = {
  // Authentication (1xxx)
  INVALID_CREDENTIALS: 1001,
  TOKEN_EXPIRED: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  REFRESH_TOKEN_EXPIRED: 1005,
  INVALID_TOKEN: 1006,
  OTP_EXPIRED: 1007,
  INVALID_OTP: 1008,

  // Validation (2xxx)
  VALIDATION_ERROR: 2001,
  INVALID_INPUT: 2002,
  MISSING_REQUIRED_FIELD: 2003,
  INVALID_FORMAT: 2004,

  // Business Logic (3xxx)
  SLOT_NOT_AVAILABLE: 3001,
  PATIENT_EXISTS: 3002,
  APPOINTMENT_CONFLICT: 3003,
  INSUFFICIENT_STOCK: 3004,
  PRESCRIPTION_EXPIRED: 3005,
  CONSENT_REQUIRED: 3006,
  ABHA_VERIFICATION_FAILED: 3007,
  PATIENT_BLOCKED: 3008,
  DOCTOR_NOT_AVAILABLE: 3009,
  BRANCH_CLOSED: 3010,
  BED_NOT_AVAILABLE: 3011,
  DRUG_INTERACTION: 3012,
  CONTROLLED_SUBSTANCE: 3013,

  // Resource (4xxx)
  NOT_FOUND: 4001,
  ALREADY_EXISTS: 4002,
  CONFLICT: 4003,
  RESOURCE_LOCKED: 4004,
  RESOURCE_DELETED: 4005,

  // External Services (5xxx)
  ABDM_ERROR: 5001,
  WHATSAPP_ERROR: 5002,
  PAYMENT_ERROR: 5003,
  SMS_ERROR: 5004,
  LAB_INTEGRATION_ERROR: 5005,

  // System (9xxx)
  INTERNAL_ERROR: 9001,
  DATABASE_ERROR: 9002,
  EXTERNAL_SERVICE_ERROR: 9003,
  RATE_LIMIT_EXCEEDED: 9004,
  SERVICE_UNAVAILABLE: 9005,
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessages: Record<ErrorCodeType, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please login again.',
  [ErrorCode.UNAUTHORIZED]: 'You must be logged in to access this resource',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'Your session has expired. Please login again.',
  [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.OTP_EXPIRED]: 'OTP has expired. Please request a new one.',
  [ErrorCode.INVALID_OTP]: 'Invalid OTP. Please try again.',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid input data',
  [ErrorCode.INVALID_INPUT]: 'The provided input is invalid',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'Invalid data format',
  [ErrorCode.SLOT_NOT_AVAILABLE]: 'The selected time slot is not available',
  [ErrorCode.PATIENT_EXISTS]: 'Patient with this phone/ABHA already exists',
  [ErrorCode.APPOINTMENT_CONFLICT]: 'There is a scheduling conflict',
  [ErrorCode.INSUFFICIENT_STOCK]: 'Insufficient stock to complete this operation',
  [ErrorCode.PRESCRIPTION_EXPIRED]: 'This prescription has expired',
  [ErrorCode.CONSENT_REQUIRED]: 'Patient consent is required for this operation',
  [ErrorCode.ABHA_VERIFICATION_FAILED]: 'ABHA verification failed',
  [ErrorCode.PATIENT_BLOCKED]: 'This patient has been blocked from booking',
  [ErrorCode.DOCTOR_NOT_AVAILABLE]: 'The selected doctor is not available',
  [ErrorCode.BRANCH_CLOSED]: 'The facility is closed at the selected time',
  [ErrorCode.BED_NOT_AVAILABLE]: 'No beds available in the selected ward',
  [ErrorCode.DRUG_INTERACTION]: 'Drug interaction detected',
  [ErrorCode.CONTROLLED_SUBSTANCE]: 'Controlled substance requires verification',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.ALREADY_EXISTS]: 'A resource with this identifier already exists',
  [ErrorCode.CONFLICT]: 'The operation conflicts with the current state',
  [ErrorCode.RESOURCE_LOCKED]: 'The resource is currently locked',
  [ErrorCode.RESOURCE_DELETED]: 'The resource has been deleted',
  [ErrorCode.ABDM_ERROR]: 'ABDM service error occurred',
  [ErrorCode.WHATSAPP_ERROR]: 'WhatsApp service error occurred',
  [ErrorCode.PAYMENT_ERROR]: 'Payment processing error occurred',
  [ErrorCode.SMS_ERROR]: 'SMS service error occurred',
  [ErrorCode.LAB_INTEGRATION_ERROR]: 'Lab integration error occurred',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service error occurred',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable',
};

export function getErrorMessage(code: ErrorCodeType): string {
  return ErrorMessages[code] || 'An unknown error occurred';
}
