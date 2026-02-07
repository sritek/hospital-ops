# Phase 1: Foundation - Implementation Tasks

## Task Overview

This document outlines the implementation tasks for Phase 1: Foundation.

## Tasks

### 1. Database Schema & Migrations

- [x] 1.1 Update Prisma schema with RefreshToken and OtpCode models
- [x] 1.2 Add password history tracking to User model
- [x] 1.3 Create initial migration
- [x] 1.4 Create seed script for development data
- [x] 1.5 Set up RLS policies for tenant isolation

### 2. Shared Package Updates

- [x] 2.1 Add auth-related types to @hospital-ops/shared
- [x] 2.2 Add auth validation schemas (login, register, etc.)
- [x] 2.3 Add permission constants and helper functions
- [x] 2.4 Build and verify shared package exports

### 3. Auth Module - Core

- [x] 3.1 Create auth module folder structure
- [x] 3.2 Implement password hashing utilities
- [x] 3.3 Implement JWT token generation and validation
- [x] 3.4 Implement OTP generation and verification service
- [x] 3.5 Create auth repository for database operations
- [x] 3.6 Create auth service with business logic

### 4. Auth Module - Routes

- [x] 4.1 Implement POST /auth/register endpoint
- [x] 4.2 Implement POST /auth/login endpoint
- [x] 4.3 Implement POST /auth/logout endpoint
- [x] 4.4 Implement POST /auth/refresh endpoint
- [x] 4.5 Implement POST /auth/request-otp endpoint
- [x] 4.6 Implement POST /auth/verify-otp endpoint
- [x] 4.7 Implement POST /auth/reset-password endpoint
- [x] 4.8 Implement POST /auth/change-password endpoint
- [x] 4.9 Implement GET /auth/me endpoint

### 5. Middleware & Guards

- [x] 5.1 Update auth middleware with JWT validation
- [x] 5.2 Implement tenant context middleware (RLS setup)
- [x] 5.3 Update permission guard with role checking
- [x] 5.4 Implement rate limiting for auth endpoints
- [x] 5.5 Implement login attempt tracking and lockout

### 6. Tenants Module

- [x] 6.1 Create tenants module folder structure
- [x] 6.2 Implement tenants repository
- [x] 6.3 Implement tenants service
- [x] 6.4 Implement GET /tenants/current endpoint
- [x] 6.5 Implement PATCH /tenants/current endpoint
- [x] 6.6 Implement POST /tenants/current/logo endpoint (file upload)

### 7. Branches Module

- [x] 7.1 Create branches module folder structure
- [x] 7.2 Implement branches repository
- [x] 7.3 Implement branches service
- [x] 7.4 Implement GET /branches endpoint (list)
- [x] 7.5 Implement POST /branches endpoint (create)
- [x] 7.6 Implement GET /branches/:id endpoint
- [x] 7.7 Implement PATCH /branches/:id endpoint
- [x] 7.8 Implement DELETE /branches/:id endpoint (soft delete)

### 8. Users Module

- [x] 8.1 Create users module folder structure
- [x] 8.2 Implement users repository
- [x] 8.3 Implement users service
- [x] 8.4 Implement GET /users endpoint (list with filters)
- [x] 8.5 Implement POST /users endpoint (create)
- [x] 8.6 Implement GET /users/:id endpoint
- [x] 8.7 Implement PATCH /users/:id endpoint
- [x] 8.8 Implement DELETE /users/:id endpoint (soft delete)
- [x] 8.9 Implement POST /users/:id/branches endpoint
- [x] 8.10 Implement DELETE /users/:id/branches/:branchId endpoint

### 9. Audit Logging

- [x] 9.1 Create audit service
- [x] 9.2 Integrate audit logging into auth module
- [x] 9.3 Integrate audit logging into users module
- [x] 9.4 Integrate audit logging into branches module
- [x] 9.5 Implement GET /audit-logs endpoint (admin only)

### 10. Testing

- [x] 10.1 Write unit tests for password utilities
- [x] 10.2 Write unit tests for JWT utilities
- [x] 10.3 Write unit tests for permission helpers
- [ ] 10.4 Write integration tests for auth endpoints
- [ ] 10.5 Write integration tests for users endpoints
- [ ] 10.6 Write integration tests for branches endpoints
- [ ] 10.7 Write property-based tests for tenant isolation
- [ ] 10.8 Write property-based tests for permission enforcement

### 11. Frontend - Auth Pages

- [x] 11.1 Create login page UI
- [x] 11.2 Create registration page UI
- [x] 11.3 Create forgot password page UI
- [x] 11.4 Create OTP verification component
- [x] 11.5 Implement auth API client hooks
- [x] 11.6 Implement auth state management (Zustand)
- [x] 11.7 Create protected route wrapper

### 12. Frontend - Dashboard Shell

- [x] 12.1 Create dashboard layout with sidebar
- [x] 12.2 Create header with user menu
- [x] 12.3 Create navigation based on user role
- [x] 12.4 Implement branch selector (for multi-branch users)

### 13. Frontend - Settings Pages

- [x] 13.1 Create facility settings page
- [x] 13.2 Create branch management page
- [x] 13.3 Create user management page
- [x] 13.4 Create profile settings page

### 14. Documentation & Cleanup

- [ ] 14.1 Update API documentation (Swagger)
- [ ] 14.2 Update README with setup instructions
- [ ] 14.3 Code review and refactoring
- [ ] 14.4 Performance testing and optimization

## Dependencies

```
Task 2 → Task 3 (shared types needed for auth)
Task 1 → Task 3 (database schema needed)
Task 3 → Task 4 (auth service needed for routes)
Task 5 → Task 6, 7, 8 (middleware needed for protected routes)
Task 4 → Task 11 (auth API needed for frontend)
Task 6, 7, 8 → Task 13 (API needed for settings pages)
```

## Estimated Effort

| Task Group              | Estimated Hours |
| ----------------------- | --------------- |
| Database (1)            | 4               |
| Shared Package (2)      | 2               |
| Auth Module (3, 4)      | 12              |
| Middleware (5)          | 4               |
| Tenants Module (6)      | 4               |
| Branches Module (7)     | 6               |
| Users Module (8)        | 8               |
| Audit Logging (9)       | 4               |
| Testing (10)            | 12              |
| Frontend Auth (11)      | 8               |
| Frontend Dashboard (12) | 6               |
| Frontend Settings (13)  | 8               |
| Documentation (14)      | 4               |
| **Total**               | **82 hours**    |
