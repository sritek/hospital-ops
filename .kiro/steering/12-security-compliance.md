---
# Security and Compliance - DPDP Act, encryption, audit trails
inclusion: fileMatch
fileMatchPattern: "**/security/**/*.ts, **/auth/**/*.ts, **/audit/**/*.ts, **/encryption/**/*.ts"
---

# Security & Compliance Guide

## Overview

This document covers security patterns and compliance requirements for Hospital-Ops including DPDP Act 2023 compliance, data encryption, audit trails, and healthcare-specific security measures.

---

## 1. Compliance Requirements

### DPDP Act 2023 (Digital Personal Data Protection)

| Requirement              | Implementation                          |
| ------------------------ | --------------------------------------- |
| Consent Management       | Explicit consent before data collection |
| Purpose Limitation       | Data used only for stated purposes      |
| Data Minimization        | Collect only necessary data             |
| Storage Limitation       | Retention policies with auto-deletion   |
| Right to Access          | Patient data export API                 |
| Right to Correction      | Self-service profile updates            |
| Right to Erasure         | Data deletion workflow                  |
| Data Breach Notification | 72-hour notification process            |

### Healthcare Compliance

| Requirement               | Implementation                      |
| ------------------------- | ----------------------------------- |
| Medical Records Retention | 7 years minimum                     |
| Audit Trail               | All access logged                   |
| Data Encryption           | AES-256 at rest, TLS 1.3 in transit |
| Access Control            | Role-based with MFA for admins      |
| ABDM Compliance           | FHIR R4, consent protocols          |

---

## 2. Data Classification

```typescript
// lib/security/data-classification.ts

export enum DataClassification {
  PUBLIC = "public", // Non-sensitive, can be shared
  INTERNAL = "internal", // Business data, limited sharing
  CONFIDENTIAL = "confidential", // PII, requires protection
  RESTRICTED = "restricted", // PHI, highest protection
}
```

export const DATA_CLASSIFICATION_MAP: Record<string, DataClassification> = {
// Patient data
'patient.name': DataClassification.CONFIDENTIAL,
'patient.phone': DataClassification.CONFIDENTIAL,
'patient.email': DataClassification.CONFIDENTIAL,
'patient.address': DataClassification.CONFIDENTIAL,
'patient.dateOfBirth': DataClassification.CONFIDENTIAL,
'patient.abhaNumber': DataClassification.RESTRICTED,
'patient.allergies': DataClassification.RESTRICTED,
'patient.chronicConditions': DataClassification.RESTRICTED,

// Medical records
'consultation.notes': DataClassification.RESTRICTED,
'consultation.diagnosis': DataClassification.RESTRICTED,
'prescription.medications': DataClassification.RESTRICTED,
'labResult.values': DataClassification.RESTRICTED,

// Financial
'invoice.amount': DataClassification.CONFIDENTIAL,
'payment.transactionId': DataClassification.CONFIDENTIAL,

// Staff
'user.phone': DataClassification.CONFIDENTIAL,
'user.email': DataClassification.CONFIDENTIAL,
'user.passwordHash': DataClassification.RESTRICTED,
};

export function getClassification(field: string): DataClassification {
return DATA_CLASSIFICATION_MAP[field] || DataClassification.INTERNAL;
}

export function requiresEncryption(classification: DataClassification): boolean {
return classification === DataClassification.RESTRICTED;
}

export function requiresAuditLog(classification: DataClassification): boolean {
return classification === DataClassification.CONFIDENTIAL ||
classification === DataClassification.RESTRICTED;
}

````

---

## 3. Encryption

### Field-Level Encryption

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export class EncryptionService {
  private masterKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    if (!key || key.length < 32) {
      throw new Error('Invalid encryption master key');
    }
    this.masterKey = Buffer.from(key, 'hex');
  }

  // Derive tenant-specific key
  private deriveKey(tenantId: string): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,
      tenantId,
      100000,
      32,
      'sha256'
    );
  }
````

encrypt(plaintext: string, tenantId: string): string {
const key = this.deriveKey(tenantId);
const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

}

decrypt(ciphertext: string, tenantId: string): string {
const key = this.deriveKey(tenantId);
const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;

}

// Hash for searchable encrypted fields
hash(value: string, tenantId: string): string {
return crypto
.createHmac('sha256', this.deriveKey(tenantId))
.update(value.toLowerCase())
.digest('hex');
}
}

export const encryption = new EncryptionService();

````

### Prisma Middleware for Auto-Encryption

```typescript
// lib/prisma/encryption-middleware.ts
import { Prisma } from '@prisma/client';
import { encryption } from '@/lib/security/encryption';

const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Patient: ['abhaNumber'],
  Consultation: ['notes'],
  Prescription: ['medications'],
};

export function encryptionMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const model = params.model as string;
    const encryptedFields = ENCRYPTED_FIELDS[model];

    if (!encryptedFields) {
      return next(params);
    }

    // Encrypt on create/update
    if (params.action === 'create' || params.action === 'update') {
      const tenantId = params.args.data?.tenantId || params.args.where?.tenantId;

      if (tenantId) {
        for (const field of encryptedFields) {
          if (params.args.data?.[field]) {
            params.args.data[field] = encryption.encrypt(
              params.args.data[field],
              tenantId
            );
          }
        }
      }
    }

    const result = await next(params);

    // Decrypt on read
    if (result && (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany')) {
      const decrypt = (record: any) => {
        if (!record?.tenantId) return record;

        for (const field of encryptedFields) {
          if (record[field]) {
            try {
              record[field] = encryption.decrypt(record[field], record.tenantId);
            } catch {
              // Field might not be encrypted (legacy data)
            }
          }
        }
        return record;
      };

      if (Array.isArray(result)) {
        return result.map(decrypt);
      }
      return decrypt(result);
    }

    return result;
  };
}
````

---

## 4. Audit Logging

### Comprehensive Audit Service

```typescript
// lib/security/audit.service.ts
import { prisma } from '@/lib/prisma';
import { FastifyRequest } from 'fastify';

export interface AuditLogParams {
  tenantId: string;
  branchId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: Record<string, unknown>;
  request?: FastifyRequest;
}

export class AuditService {
  async log(params: AuditLogParams): Promise<void> {
    const {
      tenantId,
      branchId,
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata,
      request,
    } = params;

    // Mask sensitive fields in logged values
    const maskedOldValues = this.maskSensitiveData(oldValues);
    const maskedNewValues = this.maskSensitiveData(newValues);

    await prisma.auditLog.create({
      data: {
        tenantId,
        branchId,
        userId,
        action,
        entityType,
        entityId,
        oldValues: maskedOldValues as any,
        newValues: maskedNewValues as any,
        metadata: metadata as any,
        ipAddress: request?.ip || null,
        userAgent: request?.headers['user-agent'] || null,
        requestId: request?.id || null,
        timestamp: new Date(),
      },
    });

    // For high-severity actions, also log to external SIEM
    if (this.isHighSeverityAction(action)) {
      await this.logToSIEM(params);
    }
  }
```

private maskSensitiveData(data: unknown): unknown {
if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
      'password', 'passwordHash', 'token', 'secret',
      'abhaNumber', 'aadhaar', 'pan',
    ];

    const masked = { ...data as Record<string, unknown> };

    for (const field of sensitiveFields) {
      if (field in masked) {
        masked[field] = '***MASKED***';
      }
    }

    return masked;

}

private isHighSeverityAction(action: string): boolean {
const highSeverityActions = [
'login_failed',
'password_change',
'role_change',
'data_export',
'data_delete',
'consent_revoke',
'admin_access',
'bulk_operation',
];
return highSeverityActions.includes(action);
}

private async logToSIEM(params: AuditLogParams): Promise<void> {
// Integration with external SIEM (e.g., AWS Security Hub, Splunk)
// Implementation depends on chosen SIEM solution
}

// Query audit logs with retention policy
async query(params: {
tenantId: string;
entityType?: string;
entityId?: string;
userId?: string;
action?: string;
startDate?: Date;
endDate?: Date;
page?: number;
limit?: number;
}) {
const { tenantId, entityType, entityId, userId, action, startDate, endDate, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };

}
}

export const auditService = new AuditService();

````

### Audited Actions

```typescript
// lib/security/audit-actions.ts

export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',

  // Patient
  PATIENT_CREATE: 'patient_create',
  PATIENT_UPDATE: 'patient_update',
  PATIENT_VIEW: 'patient_view',
  PATIENT_DELETE: 'patient_delete',
  PATIENT_EXPORT: 'patient_export',

  // Medical Records
  CONSULTATION_CREATE: 'consultation_create',
  CONSULTATION_UPDATE: 'consultation_update',
  PRESCRIPTION_CREATE: 'prescription_create',
  LAB_ORDER_CREATE: 'lab_order_create',
  LAB_RESULT_VIEW: 'lab_result_view',

  // Billing
  INVOICE_CREATE: 'invoice_create',
  INVOICE_VOID: 'invoice_void',
  REFUND_PROCESS: 'refund_process',
  DISCOUNT_APPLY: 'discount_apply',

  // Admin
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  ROLE_CHANGE: 'role_change',
  PERMISSION_CHANGE: 'permission_change',

  // Consent
  CONSENT_GRANT: 'consent_grant',
  CONSENT_REVOKE: 'consent_revoke',
  DATA_SHARE: 'data_share',

  // System
  BULK_OPERATION: 'bulk_operation',
  DATA_IMPORT: 'data_import',
  REPORT_GENERATE: 'report_generate',
} as const;
````

---

## 5. Consent Management

```typescript
// lib/security/consent.service.ts
import { prisma } from '@/lib/prisma';
import { auditService, AUDIT_ACTIONS } from './audit.service';

export interface ConsentRequest {
  tenantId: string;
  patientId: string;
  purpose: string;
  dataTypes: string[];
  validFrom: Date;
  validTo: Date;
  requestedBy: string;
}

export class ConsentService {
  async requestConsent(request: ConsentRequest): Promise<string> {
    const consent = await prisma.consent.create({
      data: {
        tenantId: request.tenantId,
        patientId: request.patientId,
        purpose: request.purpose,
        dataTypes: request.dataTypes,
        validFrom: request.validFrom,
        validTo: request.validTo,
        status: 'pending',
        requestedBy: request.requestedBy,
        requestedAt: new Date(),
      },
    });

    // Send consent request to patient via WhatsApp
    await this.sendConsentRequest(consent.id);

    return consent.id;
  }

  async grantConsent(consentId: string, patientId: string): Promise<void> {
    const consent = await prisma.consent.findUnique({
      where: { id: consentId },
    });

    if (!consent || consent.patientId !== patientId) {
      throw new Error('Invalid consent request');
    }

    await prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'granted',
        grantedAt: new Date(),
      },
    });

    await auditService.log({
      tenantId: consent.tenantId,
      userId: patientId,
      action: AUDIT_ACTIONS.CONSENT_GRANT,
      entityType: 'consent',
      entityId: consentId,
      newValues: { purpose: consent.purpose, dataTypes: consent.dataTypes },
    });
  }

  async revokeConsent(consentId: string, patientId: string, reason: string): Promise<void> {
    const consent = await prisma.consent.findUnique({
      where: { id: consentId },
    });

    if (!consent || consent.patientId !== patientId) {
      throw new Error('Invalid consent');
    }

    await prisma.consent.update({
      where: { id: consentId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });

    await auditService.log({
      tenantId: consent.tenantId,
      userId: patientId,
      action: AUDIT_ACTIONS.CONSENT_REVOKE,
      entityType: 'consent',
      entityId: consentId,
      newValues: { reason },
    });
  }
```

async checkConsent(params: {
tenantId: string;
patientId: string;
purpose: string;
dataType: string;
}): Promise<boolean> {
const consent = await prisma.consent.findFirst({
where: {
tenantId: params.tenantId,
patientId: params.patientId,
purpose: params.purpose,
dataTypes: { has: params.dataType },
status: 'granted',
validFrom: { lte: new Date() },
validTo: { gte: new Date() },
},
});

    return !!consent;

}

private async sendConsentRequest(consentId: string): Promise<void> {
// Send WhatsApp message with consent request link
}
}

export const consentService = new ConsentService();

````

---

## 6. Data Retention & Deletion

```typescript
// lib/security/data-retention.service.ts
import { prisma } from '@/lib/prisma';

export const RETENTION_POLICIES = {
  // Medical records - 7 years (legal requirement)
  medicalRecords: 7 * 365,

  // Financial records - 7 years (GST requirement)
  financialRecords: 7 * 365,

  // Audit logs - 7 years
  auditLogs: 7 * 365,

  // Session data - 30 days
  sessions: 30,

  // Temporary data - 7 days
  tempData: 7,

  // Marketing data - 2 years (unless consent renewed)
  marketingData: 2 * 365,
};

export class DataRetentionService {
  async enforceRetention(): Promise<void> {
    const now = new Date();

    // Delete expired sessions
    await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // Delete old temporary data
    const tempCutoff = new Date(now.getTime() - RETENTION_POLICIES.tempData * 24 * 60 * 60 * 1000);
    await prisma.tempData.deleteMany({
      where: {
        createdAt: { lt: tempCutoff },
      },
    });

    // Archive old audit logs (move to cold storage)
    const auditCutoff = new Date(now.getTime() - RETENTION_POLICIES.auditLogs * 24 * 60 * 60 * 1000);
    await this.archiveAuditLogs(auditCutoff);
  }
````

// Right to Erasure (DPDP Act)
async processErasureRequest(params: {
tenantId: string;
patientId: string;
requestedBy: string;
}): Promise<void> {
const { tenantId, patientId, requestedBy } = params;

    // Check if erasure is allowed (no legal holds)
    const canErase = await this.checkErasureEligibility(tenantId, patientId);
    if (!canErase.eligible) {
      throw new Error(`Cannot erase: ${canErase.reason}`);
    }

    // Anonymize patient data (don't delete medical records)
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: 'ANONYMIZED',
        phone: `ANON_${patientId.slice(0, 8)}`,
        email: null,
        address: null,
        dateOfBirth: null,
        abhaNumber: null,
        deletedAt: new Date(),
      },
    });

    // Delete non-essential data
    await prisma.marketingConsent.deleteMany({
      where: { patientId },
    });

    await prisma.patientPreference.deleteMany({
      where: { patientId },
    });

    // Log erasure
    await auditService.log({
      tenantId,
      userId: requestedBy,
      action: 'data_erasure',
      entityType: 'patient',
      entityId: patientId,
      metadata: { reason: 'DPDP erasure request' },
    });

}

private async checkErasureEligibility(tenantId: string, patientId: string): Promise<{
eligible: boolean;
reason?: string;
}> {
// Check for pending bills
const pendingBills = await prisma.invoice.count({
where: {
tenantId,
patientId,
paymentStatus: { in: ['pending', 'partial'] },
},
});

    if (pendingBills > 0) {
      return { eligible: false, reason: 'Pending bills exist' };
    }

    // Check for active admissions
    const activeAdmissions = await prisma.admission.count({
      where: {
        patientId,
        status: { in: ['admitted', 'in_treatment'] },
      },
    });

    if (activeAdmissions > 0) {
      return { eligible: false, reason: 'Active admission exists' };
    }

    return { eligible: true };

}

private async archiveAuditLogs(cutoffDate: Date): Promise<void> {
// Move to S3 Glacier or similar cold storage
}
}

export const dataRetentionService = new DataRetentionService();

````

---

## 7. Security Headers & Rate Limiting

```typescript
// lib/security/security-headers.ts
import { FastifyInstance } from 'fastify';

export function registerSecurityHeaders(fastify: FastifyInstance) {
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Content-Security-Policy', "default-src 'self'");
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  });
}
````

// lib/security/rate-limiting.ts
import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function registerRateLimiting(fastify: FastifyInstance) {
await fastify.register(rateLimit, {
global: true,
max: 100,
timeWindow: '1 minute',
keyGenerator: (request) => {
// Rate limit by user if authenticated, otherwise by IP
return request.user?.id || request.ip;
},
errorResponseBuilder: (request, context) => ({
success: false,
error: {
code: 'RATE_LIMIT_EXCEEDED',
message: `Too many requests. Please try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
},
}),
});

// Stricter limits for auth endpoints
fastify.register(rateLimit, {
max: 5,
timeWindow: '1 minute',
keyGenerator: (request) => request.ip,
routeConfig: {
rateLimit: {
max: 5,
timeWindow: '1 minute',
},
},
});
}

````

---

## 8. Data Breach Response

```typescript
// lib/security/breach-response.ts
import { prisma } from '@/lib/prisma';
import { emailQueue, smsQueue } from '@/lib/queue/queues';

export interface BreachReport {
  tenantId: string;
  discoveredAt: Date;
  discoveredBy: string;
  description: string;
  affectedDataTypes: string[];
  estimatedAffectedCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class BreachResponseService {
  async reportBreach(report: BreachReport): Promise<string> {
    // Create breach record
    const breach = await prisma.dataBreach.create({
      data: {
        tenantId: report.tenantId,
        discoveredAt: report.discoveredAt,
        discoveredBy: report.discoveredBy,
        description: report.description,
        affectedDataTypes: report.affectedDataTypes,
        estimatedAffectedCount: report.estimatedAffectedCount,
        severity: report.severity,
        status: 'investigating',
      },
    });

    // Notify security team immediately
    await this.notifySecurityTeam(breach);

    // For high/critical severity, notify management
    if (report.severity === 'high' || report.severity === 'critical') {
      await this.notifyManagement(breach);
    }

    // Schedule regulatory notification (72 hours per DPDP Act)
    await this.scheduleRegulatoryNotification(breach.id);

    return breach.id;
  }

  async notifyAffectedUsers(breachId: string): Promise<void> {
    const breach = await prisma.dataBreach.findUnique({
      where: { id: breachId },
      include: { tenant: true },
    });

    if (!breach) return;

    // Get affected patients
    const affectedPatients = await this.getAffectedPatients(breach);

    for (const patient of affectedPatients) {
      // Send notification via preferred channel
      await emailQueue.add('breach-notification', {
        tenantId: breach.tenantId,
        to: patient.email,
        subject: 'Important Security Notice',
        template: 'data_breach_notification',
        data: {
          patientName: patient.name,
          breachDescription: breach.description,
          affectedData: breach.affectedDataTypes.join(', '),
          recommendedActions: this.getRecommendedActions(breach),
        },
      });
    }

    // Update breach status
    await prisma.dataBreach.update({
      where: { id: breachId },
      data: {
        usersNotifiedAt: new Date(),
        status: 'users_notified',
      },
    });
  }

  private async notifySecurityTeam(breach: any): Promise<void> {
    // Send immediate alert to security team
  }

  private async notifyManagement(breach: any): Promise<void> {
    // Send alert to management
  }

  private async scheduleRegulatoryNotification(breachId: string): Promise<void> {
    // Schedule notification to Data Protection Board within 72 hours
  }

  private async getAffectedPatients(breach: any): Promise<any[]> {
    // Identify affected patients based on breach scope
    return [];
  }

  private getRecommendedActions(breach: any): string[] {
    return [
      'Monitor your accounts for suspicious activity',
      'Update your password if you use the same password elsewhere',
      'Contact us if you notice any unauthorized access',
    ];
  }
}

export const breachResponseService = new BreachResponseService();
````

---

## 9. Security Best Practices

### Do's

- Encrypt all PHI at rest and in transit
- Log all access to sensitive data
- Implement MFA for admin accounts
- Regular security audits and penetration testing
- Keep dependencies updated
- Use parameterized queries (Prisma handles this)

### Don'ts

- Never log sensitive data in plain text
- Never store passwords in plain text
- Never expose internal errors to users
- Never trust client-side validation alone
- Never disable security headers
- Never skip audit logging for sensitive operations
