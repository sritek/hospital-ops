# Phase 1: Foundation - Requirements

## Overview

Phase 1 establishes the core foundation for the Hospital-Ops platform, including multi-tenancy, authentication, role-based access control, and basic facility management. This phase must be completed before any clinical modules can be built.

## Scope

This phase covers:

- **Module 1**: Tenant & Facility Management (partial)
- **Module 9**: Staff Management - Authentication & RBAC (partial)

## User Stories & Acceptance Criteria

### Epic 1: Authentication & User Management

#### 1.1 User Registration & Login

**As a** clinic owner  
**I want to** register my facility and create my admin account  
**So that** I can start configuring the system

**Acceptance Criteria:**

- 1.1.1 Self-service registration with phone number and OTP verification
- 1.1.2 Password must be minimum 8 characters with complexity requirements
- 1.1.3 Email is optional but recommended for password recovery
- 1.1.4 30-day free trial automatically activated on registration
- 1.1.5 Registration creates both tenant and super_admin user atomically

#### 1.2 User Authentication

**As a** staff member  
**I want to** securely log in to the system  
**So that** I can access features based on my role

**Acceptance Criteria:**

- 1.2.1 Login via phone number + password
- 1.2.2 JWT access token (15 min expiry) + refresh token (7 days)
- 1.2.3 Failed login attempts tracked (max 5, then 15-min lockout)
- 1.2.4 Session invalidation on password change
- 1.2.5 Logout invalidates refresh token
- 1.2.6 Two-factor authentication (OTP) for admin roles

#### 1.3 Password Management

**As a** user  
**I want to** reset my password if forgotten  
**So that** I can regain access to my account

**Acceptance Criteria:**

- 1.3.1 Password reset via OTP sent to registered phone
- 1.3.2 OTP valid for 10 minutes, single use
- 1.3.3 Password change requires current password verification
- 1.3.4 Password history prevents reuse of last 5 passwords

---

### Epic 2: Tenant & Branch Management

#### 2.1 Tenant (Facility) Setup

**As a** clinic owner  
**I want to** configure my facility details  
**So that** the system reflects my business identity

**Acceptance Criteria:**

- 2.1.1 Facility name, legal name, and unique slug (URL-friendly)
- 2.1.2 Contact details: phone, email, address
- 2.1.3 Logo upload (max 2MB, jpg/png)
- 2.1.4 GST number validation (15-character format)
- 2.1.5 Timezone setting (default: Asia/Kolkata)
- 2.1.6 Unique booking URL generated: book.hospitalops.in/{slug}

#### 2.2 Branch Management

**As a** healthcare chain owner  
**I want to** add and manage multiple branches  
**So that** each location operates with its own settings

**Acceptance Criteria:**

- 2.2.1 Add branches with name, code (unique per tenant), address
- 2.2.2 Branch-specific contact details and GST number
- 2.2.3 Working hours configuration per branch (day-wise)
- 2.2.4 Branch can be activated/deactivated
- 2.2.5 Branch count limited by subscription plan
- 2.2.6 Default branch assigned to new users

#### 2.3 Subscription Management

**As a** clinic owner  
**I want to** view and manage my subscription  
**So that** I understand my plan limits and billing

**Acceptance Criteria:**

- 2.3.1 Display current plan: trial, basic, professional, enterprise
- 2.3.2 Show trial end date and days remaining
- 2.3.3 Display plan limits: branches, users, storage
- 2.3.4 Upgrade/downgrade request (manual for now)
- 2.3.5 Grace period of 7 days after trial/subscription expiry

---

### Epic 3: Role-Based Access Control (RBAC)

#### 3.1 User Roles

**As an** administrator  
**I want to** assign roles to staff members  
**So that** they have appropriate access levels

**Acceptance Criteria:**

- 3.1.1 Eight predefined roles: super_admin, branch_admin, doctor, nurse, receptionist, pharmacist, lab_tech, accountant
- 3.1.2 Each user has exactly one role
- 3.1.3 Role determines permission set (no custom permissions in Phase 1)
- 3.1.4 Role changes logged in audit trail
- 3.1.5 super_admin can manage all users; branch_admin only their branch

#### 3.2 Staff Management

**As an** administrator  
**I want to** add and manage staff members  
**So that** they can access the system

**Acceptance Criteria:**

- 3.2.1 Create user with: name, phone (unique per tenant), email, role
- 3.2.2 Assign user to one or more branches
- 3.2.3 Set primary branch for user
- 3.2.4 Activate/deactivate user accounts
- 3.2.5 User count limited by subscription plan
- 3.2.6 Deactivated users cannot log in but data is retained

#### 3.3 Permission Enforcement

**As a** system  
**I want to** enforce permissions on all API endpoints  
**So that** users only access authorized resources

**Acceptance Criteria:**

- 3.3.1 All API endpoints require authentication (except public routes)
- 3.3.2 Permission check middleware validates role permissions
- 3.3.3 Branch-scoped data filtered by user's assigned branches
- 3.3.4 Unauthorized access returns 403 Forbidden
- 3.3.5 Permission denied attempts logged

---

### Epic 4: Audit Logging

#### 4.1 Audit Trail

**As a** compliance officer  
**I want to** track all sensitive actions  
**So that** we have accountability and can investigate issues

**Acceptance Criteria:**

- 4.1.1 Log: user creation, update, deactivation
- 4.1.2 Log: role changes
- 4.1.3 Log: login attempts (success and failure)
- 4.1.4 Log: branch creation, update, deactivation
- 4.1.5 Each log entry includes: timestamp, user_id, action, entity_type, entity_id, old_values, new_values, IP address
- 4.1.6 Audit logs are immutable (no update/delete)
- 4.1.7 Audit logs retained for minimum 7 years

---

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new tenant + admin
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/request-otp` - Request OTP for login/reset
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/reset-password` - Reset password with OTP
- `POST /api/v1/auth/change-password` - Change password (authenticated)
- `GET /api/v1/auth/me` - Get current user profile

### Tenants

- `GET /api/v1/tenants/current` - Get current tenant details
- `PATCH /api/v1/tenants/current` - Update tenant details
- `POST /api/v1/tenants/current/logo` - Upload tenant logo

### Branches

- `GET /api/v1/branches` - List branches
- `POST /api/v1/branches` - Create branch
- `GET /api/v1/branches/:id` - Get branch details
- `PATCH /api/v1/branches/:id` - Update branch
- `DELETE /api/v1/branches/:id` - Deactivate branch

### Users

- `GET /api/v1/users` - List users (with filters)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Deactivate user
- `POST /api/v1/users/:id/branches` - Assign branches to user
- `DELETE /api/v1/users/:id/branches/:branchId` - Remove branch assignment

### Audit Logs

- `GET /api/v1/audit-logs` - List audit logs (admin only)

---

## Database Schema (Prisma)

Models required:

- `Tenant` - Multi-tenant organization
- `Branch` - Physical locations
- `User` - Staff members
- `UserBranch` - User-branch assignments
- `RefreshToken` - JWT refresh tokens
- `OtpCode` - OTP for verification
- `AuditLog` - Audit trail

---

## Security Requirements

- All passwords hashed with bcrypt (cost factor 12)
- JWT tokens signed with RS256 or HS256
- Rate limiting: 5 requests/second per IP for auth endpoints
- CORS configured for allowed origins only
- All sensitive data encrypted at rest
- Row-Level Security (RLS) enforced at database level

---

## Out of Scope (Phase 1)

- Custom permission sets
- ABDM/HFR integration
- Healthcare Professional Registry (HPR) linking
- Staff credentials and qualifications
- Attendance and shift management
- Payroll
- Two-factor authentication (deferred to Phase 1.1)

---

## Success Criteria

| Metric                      | Target                       |
| --------------------------- | ---------------------------- |
| Registration to first login | < 5 minutes                  |
| API response time (auth)    | < 200ms p95                  |
| Failed login lockout        | Working correctly            |
| Role permission enforcement | 100% coverage                |
| Audit log completeness      | All sensitive actions logged |
