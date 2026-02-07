# Phase 1: Foundation - Technical Design

## Overview

This document details the technical implementation for Phase 1: Foundation, covering authentication, multi-tenancy, RBAC, and audit logging.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Apps                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Web App   │  │ Booking App │  │  Mobile App │          │
│  │  (Next.js)  │  │  (Next.js)  │  │   (Future)  │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Fastify)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware: CORS → RateLimit → Auth → Permission   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │    Auth     │  │   Tenants   │  │    Users    │          │
│  │   Module    │  │   Module    │  │   Module    │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │   PostgreSQL 16     │  │      Redis 7        │           │
│  │   (RLS enabled)     │  │  (Sessions, Cache)  │           │
│  └─────────────────────┘  └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Tenant    │───┬───│    Branch    │       │  AuditLog    │
│              │   │   │              │       │              │
│ id           │   │   │ id           │       │ id           │
│ name         │   │   │ tenant_id    │───────│ tenant_id    │
│ slug         │   │   │ name         │       │ branch_id    │
│ email        │   │   │ code         │       │ user_id      │
│ phone        │   │   │ address      │       │ action       │
│ settings     │   │   │ gstin        │       │ entity_type  │
│ subscription │   │   │ working_hours│       │ entity_id    │
└──────────────┘   │   │ is_active    │       │ old_values   │
                   │   └──────────────┘       │ new_values   │
                   │          │               │ ip_address   │
                   │          │               │ created_at   │
                   │   ┌──────┴──────┐        └──────────────┘
                   │   │             │
                   │   ▼             │
              ┌────┴───────┐   ┌────┴────────┐
              │    User    │───│ UserBranch  │
              │            │   │             │
              │ id         │   │ id          │
              │ tenant_id  │   │ user_id     │
              │ phone      │   │ branch_id   │
              │ email      │   │ is_primary  │
              │ password   │   └─────────────┘
              │ name       │
              │ role       │   ┌─────────────┐
              │ is_active  │───│RefreshToken │
              └────────────┘   │             │
                               │ id          │
                               │ user_id     │
                               │ token       │
                               │ expires_at  │
                               └─────────────┘
```

### Prisma Schema Updates

Add to `apps/api/prisma/schema.prisma`:

```prisma
// Refresh Token for JWT
model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(500)
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  revokedAt DateTime? @map("revoked_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

// OTP Codes for verification
model OtpCode {
  id        String   @id @default(uuid()) @db.Uuid
  phone     String   @db.VarChar(20)
  code      String   @db.VarChar(6)
  purpose   String   @db.VarChar(20) // login, reset_password, verify_phone
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  usedAt    DateTime? @map("used_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([phone, purpose])
  @@map("otp_codes")
}
```

## Authentication Flow

### Registration Flow

```
1. Client submits: phone, password, facility_name
2. Server validates input
3. Server sends OTP to phone
4. Client submits OTP
5. Server verifies OTP
6. Server creates Tenant + User (super_admin) in transaction
7. Server creates default Branch
8. Server returns JWT tokens
```

### Login Flow

```
1. Client submits: phone, password
2. Server validates credentials
3. Server checks account status (active, not locked)
4. Server generates access token (15 min) + refresh token (7 days)
5. Server stores refresh token in database
6. Server logs successful login
7. Server returns tokens + user profile
```

### Token Refresh Flow

```
1. Client submits: refresh_token
2. Server validates refresh token exists and not expired/revoked
3. Server generates new access token
4. Server returns new access token
```

## Module Structure

### Auth Module

```
apps/api/src/modules/auth/
├── auth.controller.ts    # Route handlers
├── auth.service.ts       # Business logic
├── auth.repository.ts    # Database operations
├── auth.schema.ts        # Zod validation schemas
├── auth.routes.ts        # Route definitions
├── auth.types.ts         # TypeScript types
└── __tests__/
    └── auth.service.test.ts
```

### Tenants Module

```
apps/api/src/modules/tenants/
├── tenants.controller.ts
├── tenants.service.ts
├── tenants.repository.ts
├── tenants.schema.ts
├── tenants.routes.ts
└── tenants.types.ts
```

### Users Module

```
apps/api/src/modules/users/
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── users.schema.ts
├── users.routes.ts
└── users.types.ts
```

### Branches Module

```
apps/api/src/modules/branches/
├── branches.controller.ts
├── branches.service.ts
├── branches.repository.ts
├── branches.schema.ts
├── branches.routes.ts
└── branches.types.ts
```

## Permission Matrix

| Role         | Tenants     | Branches                    | Users                       | Audit Logs        |
| ------------ | ----------- | --------------------------- | --------------------------- | ----------------- |
| super_admin  | read, write | read, write, create, delete | read, write, create, delete | read              |
| branch_admin | read        | read (own)                  | read, write (own branch)    | read (own branch) |
| doctor       | -           | read (own)                  | read (own)                  | -                 |
| nurse        | -           | read (own)                  | read (own)                  | -                 |
| receptionist | -           | read (own)                  | read (own)                  | -                 |
| pharmacist   | -           | read (own)                  | read (own)                  | -                 |
| lab_tech     | -           | read (own)                  | read (own)                  | -                 |
| accountant   | read        | read                        | read                        | read              |

## API Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [{ "field": "phone", "message": "Invalid phone number format" }]
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Security Implementation

### Password Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### JWT Token Generation

```typescript
// Access Token Payload
interface AccessTokenPayload {
  sub: string; // user_id
  tenantId: string;
  branchIds: string[];
  role: UserRole;
  permissions: string[];
}

// Token expiry
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
```

### Rate Limiting

```typescript
// Auth endpoints: 5 requests per minute
await fastify.register(rateLimit, {
  max: 5,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});
```

## Row-Level Security (RLS)

### Tenant Isolation Policy

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_branches ON branches
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Setting Tenant Context

```typescript
// Middleware sets context before each request
await prisma.$executeRaw`
  SELECT set_config('app.current_tenant_id', ${tenantId}::text, true)
`;
```

## Audit Logging

### Audited Actions

| Entity | Actions                                                      |
| ------ | ------------------------------------------------------------ |
| User   | create, update, deactivate, role_change, login, login_failed |
| Branch | create, update, deactivate                                   |
| Tenant | update                                                       |

### Audit Service

```typescript
interface AuditLogParams {
  tenantId: string;
  branchId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}

async function createAuditLog(params: AuditLogParams): Promise<void> {
  await prisma.auditLog.create({ data: params });
}
```

## Correctness Properties

### P1: Authentication Integrity

- A user can only log in with correct credentials
- Failed login attempts are tracked and lockout is enforced after 5 failures
- Tokens are invalidated on logout and password change

### P2: Tenant Isolation

- Users can only access data belonging to their tenant
- RLS policies prevent cross-tenant data access even with direct SQL
- All queries include tenant_id filter

### P3: Role Permission Enforcement

- API endpoints enforce role-based permissions
- Users cannot perform actions outside their permission set
- Permission checks happen at middleware level before business logic

### P4: Audit Completeness

- All sensitive actions are logged
- Audit logs are immutable (no update/delete operations)
- Audit logs include sufficient context for investigation

### P5: Branch Scoping

- Users can only access branches they are assigned to
- branch_admin can only manage users in their branch
- Data queries respect branch assignments

## Testing Strategy

### Unit Tests

- Password hashing/verification
- Token generation/validation
- Permission checking logic
- Input validation schemas

### Integration Tests

- Registration flow end-to-end
- Login flow with various scenarios
- Token refresh flow
- CRUD operations for all entities

### Property-Based Tests

- P1: Authentication with random valid/invalid credentials
- P2: Tenant isolation with cross-tenant access attempts
- P3: Permission enforcement across all role combinations
