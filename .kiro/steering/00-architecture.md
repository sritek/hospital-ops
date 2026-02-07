# Hospital-Ops System Architecture

## Overview

Hospital-Ops is a next-generation, AI-powered, WhatsApp-centric Hospital & Clinic Management Software designed for the Indian healthcare market. This document defines the technical architecture, patterns, and standards for development.

## Tech Stack

### Backend

| Component  | Technology | Version | Purpose                        |
| ---------- | ---------- | ------- | ------------------------------ |
| Runtime    | Node.js    | v22 LTS | Server runtime                 |
| Framework  | Fastify    | 5.x     | High-performance API framework |
| Language   | TypeScript | 5.x     | Type-safe development          |
| ORM        | Prisma     | 6.x     | Type-safe database access      |
| Validation | Zod        | 3.x     | Schema validation              |
| Auth       | JWT        | -       | Access & refresh tokens        |
| Jobs       | BullMQ     | 5.x     | Background job processing      |
| Cache      | Redis      | 7.x     | Caching, sessions, queues      |

### Frontend

| Component     | Technology      | Version | Purpose                      |
| ------------- | --------------- | ------- | ---------------------------- |
| Framework     | Next.js         | 15.x    | React framework (App Router) |
| Language      | TypeScript      | 5.x     | Type-safe development        |
| UI Library    | React           | 19.x    | Component library            |
| Styling       | Tailwind CSS    | 4.x     | Utility-first CSS            |
| Components    | shadcn/ui       | latest  | Pre-built components         |
| Data Fetching | TanStack Query  | 5.x     | Server state management      |
| Forms         | React Hook Form | 7.x     | Form handling                |
| State         | Zustand         | 5.x     | Client state management      |
| Charts        | Recharts        | 2.x     | Data visualization           |
| i18n          | next-intl       | 3.x     | Internationalization         |

### Database

| Component   | Technology     | Purpose                       |
| ----------- | -------------- | ----------------------------- |
| Primary DB  | PostgreSQL 16  | Main data store with RLS      |
| Cache/Queue | Redis 7        | Sessions, caching, job queues |
| Search      | PostgreSQL FTS | Full-text search with pg_trgm |

### Infrastructure (AWS India - ap-south-1)

| Component     | Service             | Purpose                     |
| ------------- | ------------------- | --------------------------- |
| Compute       | ECS Fargate         | Containerized workloads     |
| Database      | RDS PostgreSQL      | Managed database (Multi-AZ) |
| Cache         | ElastiCache Redis   | Managed Redis               |
| Storage       | S3                  | Files, documents, images    |
| CDN           | CloudFront          | Static asset delivery       |
| Load Balancer | ALB                 | Traffic distribution        |
| DNS           | Route 53            | Domain management           |
| Secrets       | Secrets Manager     | Credential storage          |
| Monitoring    | CloudWatch + Sentry | Logs, metrics, errors       |

### AI/ML Stack

| Component      | Technology       | Purpose                         |
| -------------- | ---------------- | ------------------------------- |
| LLM            | Claude/GPT-4     | Clinical documentation, chatbot |
| Speech-to-Text | Whisper/Deepgram | Ambient scribe                  |
| Custom Models  | AWS SageMaker    | Risk prediction, analytics      |

---

## Project Structure

```
hospital-ops/
├── apps/
│   ├── api/                      # Fastify Backend API
│   │   ├── src/
│   │   │   ├── modules/          # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── tenants/
│   │   │   │   ├── patients/
│   │   │   │   ├── appointments/
│   │   │   │   ├── consultations/
│   │   │   │   ├── prescriptions/
│   │   │   │   ├── ipd/
│   │   │   │   ├── laboratory/
│   │   │   │   ├── pharmacy/
│   │   │   │   ├── billing/
│   │   │   │   ├── staff/
│   │   │   │   ├── reports/
│   │   │   │   └── integrations/
│   │   │   │       ├── abdm/     # ABHA, FHIR, consent
│   │   │   │       ├── whatsapp/
│   │   │   │       ├── payments/
│   │   │   │       └── video/
│   │   │   ├── common/
│   │   │   │   ├── middleware/
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   ├── errors/
│   │   │   │   └── utils/
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── redis.ts
│   │   │   │   ├── cache.ts
│   │   │   │   ├── queue/
│   │   │   │   ├── s3.ts
│   │   │   │   └── ai/
│   │   │   ├── jobs/
│   │   │   └── config/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tests/
│   │
│   ├── web/                      # Next.js Admin Dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── patients/
│   │   │   │   │   ├── appointments/
│   │   │   │   │   ├── opd/
│   │   │   │   │   ├── ipd/
│   │   │   │   │   ├── pharmacy/
│   │   │   │   │   ├── laboratory/
│   │   │   │   │   ├── billing/
│   │   │   │   │   ├── staff/
│   │   │   │   │   ├── reports/
│   │   │   │   │   └── settings/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/           # shadcn components
│   │   │   │   ├── forms/
│   │   │   │   ├── tables/
│   │   │   │   ├── charts/
│   │   │   │   └── layouts/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   └── tests/
│   │
│   └── booking/                  # Public Booking Portal
│       ├── src/
│       │   ├── app/[tenant]/
│       │   └── components/
│       └── tests/
│
├── packages/
│   ├── shared/                   # Shared types, utils, constants
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   ├── utils/
│   │   │   └── validators/
│   │   └── package.json
│   │
│   ├── ui/                       # Shared UI components (optional)
│   │   └── package.json
│   │
│   └── config/                   # Shared configs
│       ├── eslint-preset.js
│       ├── tsconfig.base.json
│       └── package.json
│
├── infrastructure/
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── modules/
│   └── docker/
│       ├── api/Dockerfile
│       ├── web/Dockerfile
│       └── worker/Dockerfile
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Multi-Tenancy Architecture

### Shared Database with Row-Level Security (RLS)

All tenants share a single PostgreSQL database with strict data isolation:

```
┌─────────────────────────────────────────────────────────────┐
│                      Request Flow                            │
├─────────────────────────────────────────────────────────────┤
│  1. API Request → Extract tenant_id from JWT                │
│  2. Middleware → Validate user belongs to tenant            │
│  3. Set PostgreSQL session variables                        │
│  4. Prisma queries execute with RLS policies active         │
│  5. Database enforces tenant isolation at row level         │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Context Setup

```typescript
// Set at start of each request
await prisma.$executeRaw`
  SELECT set_config('app.current_tenant_id', ${tenantId}::text, true),
         set_config('app.current_branch_id', ${branchId}::text, true),
         set_config('app.current_user_id', ${userId}::text, true)
`;
```

### RLS Policy Pattern

```sql
-- Enable RLS on table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY tenant_isolation ON patients
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Branch-level policy (where applicable)
CREATE POLICY branch_isolation ON appointments
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      current_setting('app.current_branch_id', true) IS NULL
      OR branch_id = current_setting('app.current_branch_id')::uuid
    )
  );
```

---

## Database Design Principles

### Primary Key Strategy

- Use UUIDs for all primary keys: `uuid_generate_v4()`
- Never expose sequential IDs externally

### Standard Table Columns

```sql
-- Tenant-scoped table
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Business columns here

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Optimistic locking (for concurrent updates)
  version INTEGER NOT NULL DEFAULT 1
);

-- Standard indexes
CREATE INDEX idx_table_tenant ON table_name(tenant_id);
CREATE INDEX idx_table_deleted ON table_name(tenant_id, deleted_at)
  WHERE deleted_at IS NULL;
```

### Branch-Scoped Tables

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  -- ...
);

CREATE INDEX idx_appointments_tenant_branch
  ON appointments(tenant_id, branch_id);
```

### Naming Conventions

| Type         | Convention               | Example                    |
| ------------ | ------------------------ | -------------------------- |
| Tables       | snake_case, plural       | `patients`, `lab_orders`   |
| Columns      | snake_case               | `first_name`, `created_at` |
| Indexes      | idx*{table}*{columns}    | `idx_patients_phone`       |
| Foreign Keys | {table}\_id              | `patient_id`, `branch_id`  |
| Enums        | PascalCase               | `AppointmentStatus`        |
| Constraints  | {table}_{type}_{columns} | `patients_unique_phone`    |

---

## Core Database Schema

### Tenants & Branches

```sql
-- Healthcare Facility (Tenant)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  legal_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  logo_url VARCHAR(500),

  -- ABDM Integration
  hfr_id VARCHAR(50),              -- Health Facility Registry ID
  hip_id VARCHAR(50),              -- Health Information Provider ID

  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Subscription
  subscription_plan VARCHAR(50) DEFAULT 'trial',
  subscription_status VARCHAR(20) DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Branch/Location
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,

  -- Contact
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),

  -- Tax
  gstin VARCHAR(20),

  -- Operations
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  currency VARCHAR(3) DEFAULT 'INR',
  working_hours JSONB,

  -- Settings
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, code)
);
```

### Users & Roles

```sql
-- Staff/Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Identity
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Profile
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(10),
  avatar_url VARCHAR(500),

  -- Role & Access
  role VARCHAR(50) NOT NULL,

  -- Professional (for doctors/nurses)
  registration_number VARCHAR(50),
  registration_council VARCHAR(100),
  specialization VARCHAR(100),
  qualification VARCHAR(255),
  hpr_id VARCHAR(50),              -- Healthcare Professional Registry ID
  digital_signature_url VARCHAR(500),

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, phone)
);

-- User-Branch Assignment
CREATE TABLE user_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, branch_id)
);

-- Roles Enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'branch_admin',
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'lab_tech',
  'accountant'
);
```

### Patients

```sql
-- Patient Master
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- ABHA Integration
  abha_number VARCHAR(20),
  abha_address VARCHAR(100),

  -- Identity
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  gender VARCHAR(10),
  date_of_birth DATE,
  photo_url VARCHAR(500),

  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),

  -- Medical
  blood_group VARCHAR(5),
  allergies TEXT[],
  chronic_conditions TEXT[],

  -- Preferences
  preferred_language VARCHAR(10) DEFAULT 'en',
  marketing_consent BOOLEAN DEFAULT true,

  -- Booking Status
  no_show_count INTEGER DEFAULT 0,
  booking_status VARCHAR(20) DEFAULT 'normal',

  -- First Visit Tracking
  first_visit_branch_id UUID REFERENCES branches(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, phone),
  UNIQUE(tenant_id, abha_number) WHERE abha_number IS NOT NULL
);
```

---

## API Design Patterns

### RESTful Structure

```
Base URL: https://api.hospitalops.in/v1

Authentication:
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout
  POST   /auth/forgot-password
  POST   /auth/reset-password
  POST   /auth/verify-otp

Resources:
  GET    /resources           # List (with pagination, filtering)
  POST   /resources           # Create
  GET    /resources/:id       # Get single
  PATCH  /resources/:id       # Update (partial)
  DELETE /resources/:id       # Soft delete

Nested Resources:
  GET    /patients/:id/appointments
  GET    /patients/:id/prescriptions
  GET    /appointments/:id/billing
```

### Request/Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "phone", "message": "Invalid phone number format" }
    ]
  }
}
```

### Module Structure

```typescript
// src/modules/patients/
├── patients.controller.ts    // Route handlers
├── patients.service.ts       // Business logic
├── patients.repository.ts    // Database operations
├── patients.schema.ts        // Zod validation schemas
├── patients.routes.ts        // Route definitions
├── patients.types.ts         // TypeScript types
└── __tests__/
    ├── patients.service.test.ts
    └── patients.api.test.ts
```

### Controller Pattern

```typescript
// patients.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { PatientService } from "./patients.service";
import { CreatePatientSchema, UpdatePatientSchema } from "./patients.schema";

export class PatientController {
  constructor(private patientService: PatientService) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId, branchId } = request.user;
    const { page, limit, search } = request.query as ListPatientsQuery;

    const result = await this.patientService.list({
      tenantId,
      branchId,
      page,
      limit,
      search,
    });

    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { tenantId, userId } = request.user;
    const data = request.body as CreatePatientSchema;

    const patient = await this.patientService.create({
      tenantId,
      createdBy: userId,
      ...data,
    });

    return reply.status(201).send({
      success: true,
      data: patient,
    });
  }
}
```

### Service Pattern

```typescript
// patients.service.ts
import { PatientRepository } from "./patients.repository";
import { CreatePatientDto, UpdatePatientDto } from "./patients.types";
import { AppError } from "@/common/errors";

export class PatientService {
  constructor(private repository: PatientRepository) {}

  async create(data: CreatePatientDto) {
    // Check for duplicate
    const existing = await this.repository.findByPhone(
      data.tenantId,
      data.phone,
    );
    if (existing) {
      throw new AppError(
        "PATIENT_EXISTS",
        "Patient with this phone already exists",
      );
    }

    // Create patient
    const patient = await this.repository.create(data);

    // Queue welcome message
    await queues.whatsappNotifications.add("welcome", {
      tenantId: data.tenantId,
      patientId: patient.id,
      templateId: "patient_welcome",
    });

    return patient;
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
// Access Token (15 minutes)
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "branchIds": ["branch-1", "branch-2"],
  "role": "doctor",
  "permissions": ["patients:read", "patients:write", "prescriptions:write"],
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token (7 days)
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Role Hierarchy

```
super_admin
├── branch_admin
│   ├── doctor
│   ├── nurse
│   ├── receptionist
│   ├── pharmacist
│   ├── lab_tech
│   └── accountant
```

### Permission Matrix

```typescript
const ROLE_PERMISSIONS = {
  super_admin: ["*"],

  branch_admin: [
    "branches:read",
    "users:read",
    "users:write",
    "patients:*",
    "appointments:*",
    "consultations:*",
    "prescriptions:*",
    "billing:*",
    "reports:read",
    "inventory:*",
  ],

  doctor: [
    "patients:read",
    "patients:write",
    "appointments:read",
    "appointments:write:own",
    "consultations:*",
    "prescriptions:*",
    "lab_orders:write",
    "lab_results:read",
    "ipd:read",
    "ipd:write:own",
  ],

  nurse: [
    "patients:read",
    "appointments:read",
    "vitals:write",
    "ipd:read",
    "ipd:write:nursing",
    "medication_admin:write",
  ],

  receptionist: [
    "patients:read",
    "patients:write",
    "appointments:*",
    "billing:read",
    "billing:write",
    "queue:*",
  ],

  pharmacist: [
    "patients:read:limited",
    "prescriptions:read",
    "dispensing:*",
    "inventory:*",
  ],

  lab_tech: [
    "patients:read:limited",
    "lab_orders:read",
    "lab_results:write",
    "samples:*",
  ],

  accountant: ["billing:read", "reports:read:financial", "insurance:read"],
};
```

### Permission Guard

```typescript
// guards/permission.guard.ts
export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userPermissions = request.user.permissions;

    // Super admin has all permissions
    if (userPermissions.includes("*")) return;

    const hasPermission = permissions.some((p) => {
      // Check exact match
      if (userPermissions.includes(p)) return true;

      // Check wildcard (e.g., 'patients:*' matches 'patients:read')
      const [resource] = p.split(":");
      return userPermissions.includes(`${resource}:*`);
    });

    if (!hasPermission) {
      throw new AppError("FORBIDDEN", "Insufficient permissions");
    }
  };
}

// Usage in routes
fastify.get("/patients", {
  preHandler: [authenticate, requirePermission("patients:read")],
  handler: patientController.list,
});
```

---

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  // Authentication (1xxx)
  INVALID_CREDENTIALS = 1001,
  TOKEN_EXPIRED = 1002,
  UNAUTHORIZED = 1003,
  FORBIDDEN = 1004,

  // Validation (2xxx)
  VALIDATION_ERROR = 2001,
  INVALID_INPUT = 2002,
  MISSING_REQUIRED_FIELD = 2003,

  // Business Logic (3xxx)
  SLOT_NOT_AVAILABLE = 3001,
  PATIENT_EXISTS = 3002,
  APPOINTMENT_CONFLICT = 3003,
  INSUFFICIENT_STOCK = 3004,
  PRESCRIPTION_EXPIRED = 3005,
  CONSENT_REQUIRED = 3006,
  ABHA_VERIFICATION_FAILED = 3007,

  // Resource (4xxx)
  NOT_FOUND = 4001,
  ALREADY_EXISTS = 4002,
  CONFLICT = 4003,
  GONE = 4004,

  // External Services (5xxx)
  ABDM_ERROR = 5001,
  WHATSAPP_ERROR = 5002,
  PAYMENT_ERROR = 5003,
  SMS_ERROR = 5004,

  // System (9xxx)
  INTERNAL_ERROR = 9001,
  DATABASE_ERROR = 9002,
  EXTERNAL_SERVICE_ERROR = 9003,
}
```

### AppError Class

```typescript
// common/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(resource: string) {
    return new AppError("NOT_FOUND", `${resource} not found`, 404);
  }

  static conflict(message: string) {
    return new AppError("CONFLICT", message, 409);
  }
}
```

---

## Audit Logging

### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  branch_id UUID,
  user_id UUID,

  -- Action details
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,

  -- Change tracking
  old_values JSONB,
  new_values JSONB,

  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(50),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX idx_audit_tenant_date ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
```

### Audited Actions

| Category     | Actions                                               |
| ------------ | ----------------------------------------------------- |
| Patient      | create, update, delete, view_sensitive, share_records |
| Prescription | create, modify, dispense                              |
| Billing      | create, modify, void, refund, discount_applied        |
| User         | create, update, role_change, deactivate               |
| Access       | login, logout, failed_login, password_change          |
| Consent      | grant, revoke, expire                                 |
| Clinical     | diagnosis_add, vitals_record, lab_order               |

### Audit Service

```typescript
// lib/audit.ts
export async function auditLog(params: {
  tenantId: string;
  branchId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  request?: FastifyRequest;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      branchId: params.branchId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues as Prisma.JsonValue,
      newValues: params.newValues as Prisma.JsonValue,
      ipAddress: params.request?.ip,
      userAgent: params.request?.headers["user-agent"],
      requestId: params.request?.id,
    },
  });
}
```

---

## Caching Strategy

### Cache Key Conventions

```typescript
// lib/cache-keys.ts
export const cacheKeys = {
  // Tenant
  tenantConfig: (tenantId: string) => `tenant:${tenantId}:config`,
  tenantSubscription: (tenantId: string) => `tenant:${tenantId}:subscription`,

  // Branch
  branchConfig: (branchId: string) => `branch:${branchId}:config`,
  branchWorkingHours: (branchId: string, date: string) =>
    `branch:${branchId}:hours:${date}`,
  branchServices: (branchId: string) => `branch:${branchId}:services`,

  // User
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userSession: (sessionId: string) => `session:${sessionId}`,

  // Patient
  patientProfile: (patientId: string) => `patient:${patientId}:profile`,

  // Appointments
  slotLock: (branchId: string, doctorId: string, date: string, time: string) =>
    `slot:${branchId}:${doctorId}:${date}:${time}`,
  doctorAvailability: (doctorId: string, date: string) =>
    `doctor:${doctorId}:availability:${date}`,

  // Queue
  queuePosition: (branchId: string, date: string) =>
    `queue:${branchId}:${date}`,

  // Drug database
  drugSearch: (query: string) => `drugs:search:${query}`,
  drugInteractions: (drugIds: string) => `drugs:interactions:${drugIds}`,
};

// TTL values in seconds
export const cacheTTL = {
  config: 5 * 60, // 5 minutes
  permissions: 5 * 60, // 5 minutes
  workingHours: 60 * 60, // 1 hour
  services: 5 * 60, // 5 minutes
  slotLock: 5 * 60, // 5 minutes
  availability: 2 * 60, // 2 minutes
  drugSearch: 24 * 60 * 60, // 24 hours
  session: 24 * 60 * 60, // 24 hours
};
```

---

## Background Jobs

### Queue Definitions

```typescript
// lib/queue/queues.ts
export const queues = {
  // Notifications
  whatsappNotifications: createQueue("whatsapp-notifications"),
  smsNotifications: createQueue("sms-notifications"),
  emailNotifications: createQueue("email-notifications"),

  // Appointments
  appointmentReminders: createQueue("appointment-reminders"),
  followUpReminders: createQueue("follow-up-reminders"),

  // Clinical
  labResultsNotify: createQueue("lab-results-notify"),
  prescriptionDispatch: createQueue("prescription-dispatch"),

  // ABDM
  abdmSync: createQueue("abdm-sync"),
  consentRequests: createQueue("consent-requests"),

  // Reports
  reportGeneration: createQueue("report-generation"),
  dataSnapshots: createQueue("data-snapshots"),

  // Inventory
  stockAlerts: createQueue("stock-alerts"),
  expiryAlerts: createQueue("expiry-alerts"),

  // AI
  clinicalDocumentation: createQueue("clinical-documentation"),
  riskScoring: createQueue("risk-scoring"),
};
```

### Scheduled Jobs

| Job                   | Schedule       | Purpose                            |
| --------------------- | -------------- | ---------------------------------- |
| appointment-reminders | _/5 _ \* \* \* | Check and send upcoming reminders  |
| daily-snapshot        | 0 2 \* \* \*   | Daily data snapshots for reports   |
| stock-alerts          | 0 8 \* \* \*   | Low stock notifications            |
| expiry-alerts         | 0 9 \* \* \*   | Expiring items notifications       |
| follow-up-check       | 0 10 \* \* \*  | Check pending follow-ups           |
| consent-expiry        | 0 0 \* \* \*   | Check and notify expiring consents |

---

## Security Measures

### Data Protection

| Layer     | Measure                                     |
| --------- | ------------------------------------------- |
| Transit   | TLS 1.3 for all connections                 |
| Rest      | AES-256 encryption for sensitive data       |
| Passwords | bcrypt with cost factor 12                  |
| PHI       | Additional encryption for health data       |
| Tokens    | Secure, httpOnly cookies for refresh tokens |

### API Security

```typescript
// Rate limiting configuration
const rateLimits = {
  global: { max: 100, timeWindow: "1 minute" },
  auth: { max: 5, timeWindow: "1 minute" },
  otp: { max: 3, timeWindow: "1 minute" },
  api: { max: 1000, timeWindow: "1 minute" },
};

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'",
};
```

### Compliance Requirements

| Requirement     | Implementation                                          |
| --------------- | ------------------------------------------------------- |
| DPDP Act 2023   | Consent management, data minimization, right to erasure |
| ABDM            | FHIR R4 compliance, consent protocols, audit trails     |
| Medical Records | 7-year retention, tamper-proof audit logs               |
| GST             | Invoice format compliance, HSN codes                    |

---

## Internationalization (i18n)

### Supported Locales

- English (en-IN) - Default
- Hindi (hi-IN)

### Date/Time Formats

```typescript
// Indian formats
const formats = {
  date: "DD/MM/YYYY", // 05/02/2026
  time: "hh:mm A", // 10:30 AM
  datetime: "DD/MM/YYYY hh:mm A",
  timezone: "Asia/Kolkata",
};

// Currency formatting
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  // ₹1,00,000
}
```

### Message Templates

```typescript
// Templates stored with both languages
interface MessageTemplate {
  id: string;
  type: "whatsapp" | "sms" | "email";
  contentEn: string;
  contentHi: string;
  variables: string[];
}

// Selection based on patient preference
function getTemplateContent(template: MessageTemplate, language: string) {
  return language === "hi" ? template.contentHi : template.contentEn;
}
```

---

## Monitoring & Observability

### Health Checks

```typescript
// GET /health
{
  "status": "healthy",
  "timestamp": "2026-02-05T10:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "abdm": "healthy"
  }
}

// GET /health/ready (for k8s readiness)
// GET /health/live (for k8s liveness)
```

### Metrics

| Metric                        | Type      | Purpose                   |
| ----------------------------- | --------- | ------------------------- |
| http_requests_total           | Counter   | Total API requests        |
| http_request_duration_seconds | Histogram | Request latency           |
| db_query_duration_seconds     | Histogram | Database query time       |
| queue_jobs_processed          | Counter   | Background jobs processed |
| active_sessions               | Gauge     | Current active sessions   |

### Logging

```typescript
// Structured logging format
{
  "level": "info",
  "timestamp": "2026-02-05T10:30:00.000Z",
  "requestId": "req-123",
  "tenantId": "tenant-456",
  "userId": "user-789",
  "message": "Patient created",
  "context": {
    "patientId": "patient-abc",
    "action": "create"
  }
}
```

---

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over callbacks
- Use early returns to reduce nesting
- Keep functions small and focused
- Write self-documenting code with clear names

### Commit Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: api, web, booking, shared, infra

Examples:
feat(api): add patient registration endpoint
fix(web): resolve appointment calendar rendering
docs(api): update API documentation
```

### Branch Strategy

```
main          - Production-ready code
├── develop   - Integration branch
│   ├── feature/patient-registration
│   ├── feature/abdm-integration
│   └── fix/appointment-conflict
```
