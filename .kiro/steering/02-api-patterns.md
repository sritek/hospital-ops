---
# API patterns - Fastify routes, validation, middleware, error handling
inclusion: fileMatch
fileMatchPattern: "apps/api/src/**/*.ts, apps/api/src/**/*.routes.ts, apps/api/src/**/*.controller.ts"
---

# API Patterns Guide

## Overview

This document defines the API patterns, conventions, and best practices for the Hospital-Ops Fastify backend.

---

## 1. Project Structure

```
apps/api/src/
├── modules/                    # Feature modules
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.routes.ts
│   │   └── auth.types.ts
│   ├── patients/
│   ├── appointments/
│   └── ...
├── common/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── guards/
│   │   ├── permission.guard.ts
│   │   └── branch.guard.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   └── error-handler.ts
│   └── utils/
├── lib/
│   ├── prisma.ts
│   ├── redis.ts
│   ├── cache.ts
│   └── queue/
├── plugins/
│   ├── auth.plugin.ts
│   ├── swagger.plugin.ts
│   └── cors.plugin.ts
└── config/
    ├── env.ts
    └── constants.ts
```

---

## 2. Route Registration

### Module Routes Pattern

```typescript
// modules/patients/patients.routes.ts
import { FastifyInstance } from "fastify";
import { PatientController } from "./patients.controller";
import { PatientService } from "./patients.service";
import { PatientRepository } from "./patients.repository";
import { authenticate } from "@/common/middleware/auth.middleware";
import { requirePermission } from "@/common/guards/permission.guard";
import {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema,
  getPatientSchema,
} from "./patients.schema";

export async function patientRoutes(fastify: FastifyInstance) {
  // Initialize dependencies
  const repository = new PatientRepository(fastify.prisma);
  const service = new PatientService(repository);
  const controller = new PatientController(service);

  // List patients
  fastify.get("/", {
    schema: listPatientsSchema,
    preHandler: [authenticate, requirePermission("patients:read")],
    handler: controller.list.bind(controller),
  });

  // Get single patient
  fastify.get("/:id", {
    schema: getPatientSchema,
    preHandler: [authenticate, requirePermission("patients:read")],
    handler: controller.getById.bind(controller),
  });

  // Create patient
  fastify.post("/", {
    schema: createPatientSchema,
    preHandler: [authenticate, requirePermission("patients:write")],
    handler: controller.create.bind(controller),
  });

  // Update patient
  fastify.patch("/:id", {
    schema: updatePatientSchema,
    preHandler: [authenticate, requirePermission("patients:write")],
    handler: controller.update.bind(controller),
  });

  // Soft delete patient
  fastify.delete("/:id", {
    preHandler: [authenticate, requirePermission("patients:delete")],
    handler: controller.delete.bind(controller),
  });

  // Nested routes
  fastify.get("/:id/appointments", {
    preHandler: [authenticate, requirePermission("appointments:read")],
    handler: controller.getAppointments.bind(controller),
  });

  fastify.get("/:id/prescriptions", {
    preHandler: [authenticate, requirePermission("prescriptions:read")],
    handler: controller.getPrescriptions.bind(controller),
  });
}
```

### App Registration

```typescript
// app.ts
import Fastify from "fastify";
import { patientRoutes } from "./modules/patients/patients.routes";
import { appointmentRoutes } from "./modules/appointments/appointments.routes";
import { authRoutes } from "./modules/auth/auth.routes";

export async function buildApp() {
  const fastify = Fastify({
    logger: true,
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "requestId",
  });

  // Register plugins
  await fastify.register(import("./plugins/cors.plugin"));
  await fastify.register(import("./plugins/swagger.plugin"));
  await fastify.register(import("./plugins/auth.plugin"));

  // Register routes with prefix
  await fastify.register(authRoutes, { prefix: "/v1/auth" });
  await fastify.register(patientRoutes, { prefix: "/v1/patients" });
  await fastify.register(appointmentRoutes, { prefix: "/v1/appointments" });

  return fastify;
}
```

---

## 3. Controller Pattern

### Standard Controller

```typescript
// modules/patients/patients.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { PatientService } from "./patients.service";
import {
  CreatePatientInput,
  UpdatePatientInput,
  ListPatientsQuery,
} from "./patients.types";

export class PatientController {
  constructor(private service: PatientService) {}

  async list(
    request: FastifyRequest<{ Querystring: ListPatientsQuery }>,
    reply: FastifyReply,
  ) {
    const { tenantId, branchIds } = request.user;
    const { page = 1, limit = 20, search, status } = request.query;

    const result = await this.service.list({
      tenantId,
      branchIds,
      page,
      limit,
      search,
      status,
    });

    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { tenantId } = request.user;
    const { id } = request.params;

    const patient = await this.service.getById(tenantId, id);

    return reply.send({
      success: true,
      data: patient,
    });
  }

  async create(
    request: FastifyRequest<{ Body: CreatePatientInput }>,
    reply: FastifyReply,
  ) {
    const { tenantId, userId, branchIds } = request.user;
    const data = request.body;

    const patient = await this.service.create({
      ...data,
      tenantId,
      createdBy: userId,
      firstVisitBranchId: branchIds[0], // Primary branch
    });

    return reply.status(201).send({
      success: true,
      data: patient,
    });
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdatePatientInput;
    }>,
    reply: FastifyReply,
  ) {
    const { tenantId, userId } = request.user;
    const { id } = request.params;
    const data = request.body;

    const patient = await this.service.update(tenantId, id, {
      ...data,
      updatedBy: userId,
    });

    return reply.send({
      success: true,
      data: patient,
    });
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { tenantId, userId } = request.user;
    const { id } = request.params;

    await this.service.softDelete(tenantId, id, userId);

    return reply.status(204).send();
  }
}
```

---

## 4. Service Pattern

### Business Logic Layer

```typescript
// modules/patients/patients.service.ts
import { PatientRepository } from "./patients.repository";
import { AppError } from "@/common/errors/app-error";
import { queues } from "@/lib/queue";
import { auditLog } from "@/lib/audit";
import {
  CreatePatientDto,
  UpdatePatientDto,
  ListPatientsParams,
  PatientWithRelations,
} from "./patients.types";

export class PatientService {
  constructor(private repository: PatientRepository) {}

  async list(params: ListPatientsParams) {
    const { data, total } = await this.repository.findMany(params);

    return {
      data,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<PatientWithRelations> {
    const patient = await this.repository.findById(tenantId, id);

    if (!patient) {
      throw AppError.notFound("Patient");
    }

    return patient;
  }

  async create(data: CreatePatientDto) {
    // Check for duplicate phone
    const existing = await this.repository.findByPhone(
      data.tenantId,
      data.phone,
    );
    if (existing) {
      throw AppError.conflict("Patient with this phone number already exists");
    }

    // Check for duplicate ABHA (if provided)
    if (data.abhaNumber) {
      const existingAbha = await this.repository.findByAbha(
        data.tenantId,
        data.abhaNumber,
      );
      if (existingAbha) {
        throw AppError.conflict("Patient with this ABHA number already exists");
      }
    }

    // Create patient
    const patient = await this.repository.create(data);

    // Queue welcome message
    await queues.whatsappNotifications.add("patient-welcome", {
      tenantId: data.tenantId,
      patientId: patient.id,
      templateCode: "PATIENT_WELCOME",
    });

    // Audit log
    await auditLog({
      tenantId: data.tenantId,
      userId: data.createdBy,
      action: "create",
      entityType: "patient",
      entityId: patient.id,
      newValues: patient,
    });

    return patient;
  }

  async update(tenantId: string, id: string, data: UpdatePatientDto) {
    const existing = await this.getById(tenantId, id);

    // Check phone uniqueness if changing
    if (data.phone && data.phone !== existing.phone) {
      const duplicate = await this.repository.findByPhone(tenantId, data.phone);
      if (duplicate) {
        throw AppError.conflict("Phone number already in use");
      }
    }

    const updated = await this.repository.update(tenantId, id, data);

    // Audit log
    await auditLog({
      tenantId,
      userId: data.updatedBy,
      action: "update",
      entityType: "patient",
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, userId: string) {
    const existing = await this.getById(tenantId, id);

    await this.repository.softDelete(tenantId, id);

    // Audit log
    await auditLog({
      tenantId,
      userId,
      action: "delete",
      entityType: "patient",
      entityId: id,
      oldValues: existing,
    });
  }
}
```

---

## 5. Repository Pattern

### Database Access Layer

```typescript
// modules/patients/patients.repository.ts
import { PrismaClient, Patient, Prisma } from "@prisma/client";
import {
  ListPatientsParams,
  CreatePatientDto,
  UpdatePatientDto,
} from "./patients.types";

export class PatientRepository {
  constructor(private prisma: PrismaClient) {}

  async findMany(params: ListPatientsParams) {
    const { tenantId, branchIds, page, limit, search, status } = params;

    const where: Prisma.PatientWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { abhaNumber: { contains: search } },
        ],
      }),
      ...(status && { bookingStatus: status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { appointments: true },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.patient.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        appointments: {
          take: 5,
          orderBy: { appointmentDate: "desc" },
        },
        vitals: {
          take: 1,
          orderBy: { recordedAt: "desc" },
        },
      },
    });
  }

  async findByPhone(tenantId: string, phone: string) {
    return this.prisma.patient.findFirst({
      where: { tenantId, phone, deletedAt: null },
    });
  }

  async findByAbha(tenantId: string, abhaNumber: string) {
    return this.prisma.patient.findFirst({
      where: { tenantId, abhaNumber, deletedAt: null },
    });
  }

  async create(data: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        tenantId: data.tenantId,
        phone: data.phone,
        name: data.name,
        email: data.email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        abhaNumber: data.abhaNumber,
        abhaAddress: data.abhaAddress,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        bloodGroup: data.bloodGroup,
        allergies: data.allergies || [],
        chronicConditions: data.chronicConditions || [],
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        preferredLanguage: data.preferredLanguage || "en",
        marketingConsent: data.marketingConsent ?? true,
        firstVisitBranchId: data.firstVisitBranchId,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdatePatientDto) {
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(tenantId: string, id: string) {
    return this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

---

## 6. Validation with Zod

### Schema Definitions

```typescript
// modules/patients/patients.schema.ts
import { z } from "zod";
import { FastifySchema } from "fastify";

// Reusable schemas
const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number");
const abhaSchema = z
  .string()
  .regex(/^\d{14}$/, "Invalid ABHA number")
  .optional();

// Create patient input
export const createPatientInputSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2).max(255),
  email: z.string().email().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().datetime().optional(),
  abhaNumber: abhaSchema,
  abhaAddress: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Invalid pincode")
    .optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactPhone: phoneSchema.optional(),
  emergencyContactRelation: z.string().max(50).optional(),
  preferredLanguage: z.enum(["en", "hi"]).default("en"),
  marketingConsent: z.boolean().default(true),
});

// Update patient input (all fields optional)
export const updatePatientInputSchema = createPatientInputSchema.partial();

// List query params
export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["normal", "warning", "prepaid_only", "blocked"]).optional(),
  sortBy: z.enum(["name", "createdAt", "lastVisit"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Fastify schema for Swagger docs
export const createPatientSchema: FastifySchema = {
  tags: ["Patients"],
  summary: "Create a new patient",
  body: {
    type: "object",
    required: ["phone", "name"],
    properties: {
      phone: { type: "string", pattern: "^[6-9]\\d{9}$" },
      name: { type: "string", minLength: 2, maxLength: 255 },
      email: { type: "string", format: "email" },
      gender: { type: "string", enum: ["male", "female", "other"] },
      dateOfBirth: { type: "string", format: "date" },
      abhaNumber: { type: "string", pattern: "^\\d{14}$" },
      // ... other properties
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { $ref: "Patient#" },
      },
    },
  },
};

export const listPatientsSchema: FastifySchema = {
  tags: ["Patients"],
  summary: "List patients with pagination",
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      search: { type: "string" },
      status: {
        type: "string",
        enum: ["normal", "warning", "prepaid_only", "blocked"],
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: { $ref: "Patient#" } },
        meta: { $ref: "PaginationMeta#" },
      },
    },
  },
};

// Type exports
export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
```

### Validation Plugin

```typescript
// plugins/validation.plugin.ts
import { FastifyInstance } from 'fastify';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '@/common/errors/app-error';

export function zodValidate<T>(schema: ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Invalid input data',
          400,
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }
      throw error;
    }
  };
}

// Usage in controller
async create(request: FastifyRequest, reply: FastifyReply) {
  const data = zodValidate(createPatientInputSchema)(request.body);
  // data is now typed and validated
}
```

---

## 7. Error Handling

### AppError Class

```typescript
// common/errors/app-error.ts
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    details?: unknown,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods
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

  static tooManyRequests(message = "Too many requests") {
    return new AppError("TOO_MANY_REQUESTS", message, 429);
  }

  static internal(message = "Internal server error") {
    return new AppError("INTERNAL_ERROR", message, 500);
  }

  // Domain-specific errors
  static slotNotAvailable() {
    return new AppError(
      "SLOT_NOT_AVAILABLE",
      "The selected time slot is not available",
      409,
    );
  }

  static patientBlocked() {
    return new AppError(
      "PATIENT_BLOCKED",
      "Patient is blocked from booking",
      403,
    );
  }

  static insufficientStock(drugName: string) {
    return new AppError(
      "INSUFFICIENT_STOCK",
      `Insufficient stock for ${drugName}`,
      400,
    );
  }

  static prescriptionExpired() {
    return new AppError(
      "PRESCRIPTION_EXPIRED",
      "Prescription has expired",
      400,
    );
  }

  static consentRequired() {
    return new AppError(
      "CONSENT_REQUIRED",
      "Patient consent is required for this action",
      403,
    );
  }
}
```

### Global Error Handler

```typescript
// common/errors/error-handler.ts
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./app-error";
import { logger } from "@/lib/logger";

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Log error
  logger.error({
    requestId: request.id,
    tenantId: request.user?.tenantId,
    userId: request.user?.userId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });

  // Handle AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Fastify validation errors
  if ("validation" in error && error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: error.validation,
      },
    });
  }

  // Handle Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;

    if (prismaError.code === "P2002") {
      return reply.status(409).send({
        success: false,
        error: {
          code: "DUPLICATE_ENTRY",
          message: "A record with this value already exists",
          details: { fields: prismaError.meta?.target },
        },
      });
    }

    if (prismaError.code === "P2025") {
      return reply.status(404).send({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Record not found",
        },
      });
    }
  }

  // Default to internal error
  return reply.status(500).send({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}

// Register in app
fastify.setErrorHandler(errorHandler);
```

---

## 8. Middleware

### Authentication Middleware

```typescript
// common/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "@/lib/jwt";
import { AppError } from "@/common/errors/app-error";
import { redis } from "@/lib/redis";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);

  try {
    // Verify token
    const payload = verifyAccessToken(token);

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw AppError.unauthorized("Token has been revoked");
    }

    // Attach user to request
    request.user = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      branchIds: payload.branchIds,
      role: payload.role,
      permissions: payload.permissions,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized("Invalid or expired token");
  }
}
```

### Tenant Context Middleware

```typescript
// common/middleware/tenant.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma";

export async function setTenantContext(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) return;

  const { tenantId, branchIds, userId } = request.user;

  // Set PostgreSQL session variables for RLS
  await prisma.$executeRaw`
    SELECT 
      set_config('app.current_tenant_id', ${tenantId}::text, true),
      set_config('app.current_branch_id', ${branchIds[0] || ""}::text, true),
      set_config('app.current_user_id', ${userId}::text, true)
  `;
}
```

### Rate Limiting

```typescript
// common/middleware/rate-limit.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { redis } from "@/lib/redis";
import { AppError } from "@/common/errors/app-error";

interface RateLimitConfig {
  max: number;
  windowMs: number;
  keyPrefix?: string;
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = `${config.keyPrefix || "ratelimit"}:${request.user?.userId || request.ip}`;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.pexpire(key, config.windowMs);
    }

    // Set rate limit headers
    reply.header("X-RateLimit-Limit", config.max);
    reply.header("X-RateLimit-Remaining", Math.max(0, config.max - current));

    if (current > config.max) {
      throw AppError.tooManyRequests();
    }
  };
}

// Usage
fastify.post("/auth/login", {
  preHandler: [rateLimit({ max: 5, windowMs: 60000, keyPrefix: "login" })],
  handler: authController.login,
});
```

---

## 9. Permission Guards

### Permission Guard

```typescript
// common/guards/permission.guard.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "@/common/errors/app-error";

export function requirePermission(...requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userPermissions = request.user?.permissions || [];

    // Super admin has all permissions
    if (userPermissions.includes("*")) return;

    const hasPermission = requiredPermissions.some((required) => {
      // Exact match
      if (userPermissions.includes(required)) return true;

      // Wildcard match (e.g., 'patients:*' matches 'patients:read')
      const [resource, action] = required.split(":");
      if (userPermissions.includes(`${resource}:*`)) return true;

      // Check :own suffix (e.g., 'appointments:write:own')
      if (action?.includes(":own")) {
        const baseAction = action.replace(":own", "");
        return userPermissions.includes(`${resource}:${baseAction}:own`);
      }

      return false;
    });

    if (!hasPermission) {
      throw AppError.forbidden("Insufficient permissions");
    }
  };
}

// Usage examples
fastify.get("/patients", {
  preHandler: [authenticate, requirePermission("patients:read")],
});

fastify.post("/prescriptions", {
  preHandler: [authenticate, requirePermission("prescriptions:write")],
});

// Multiple permissions (OR logic)
fastify.get("/reports/revenue", {
  preHandler: [
    authenticate,
    requirePermission("reports:read", "reports:read:financial"),
  ],
});
```

### Role Guard

```typescript
// common/guards/role.guard.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "@/common/errors/app-error";

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw AppError.forbidden("Role not authorized for this action");
    }
  };
}

// Usage
fastify.post("/users", {
  preHandler: [authenticate, requireRole("super_admin", "branch_admin")],
});
```

### Branch Guard

```typescript
// common/guards/branch.guard.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "@/common/errors/app-error";

export function requireBranchAccess(branchIdParam = "branchId") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userBranchIds = request.user?.branchIds || [];
    const requestedBranchId =
      (request.params as any)[branchIdParam] ||
      (request.body as any)?.branchId ||
      (request.query as any)?.branchId;

    if (!requestedBranchId) return; // No branch specified

    // Super admin can access all branches
    if (request.user?.role === "super_admin") return;

    if (!userBranchIds.includes(requestedBranchId)) {
      throw AppError.forbidden("Access denied to this branch");
    }
  };
}
```

---

## 10. Response Formatting

### Standard Response Types

```typescript
// common/types/response.types.ts
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### Response Helpers

```typescript
// common/utils/response.utils.ts
import { FastifyReply } from "fastify";
import { PaginationMeta } from "@/common/types/response.types";

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
) {
  return reply.status(statusCode).send({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function sendCreated<T>(reply: FastifyReply, data: T) {
  return sendSuccess(reply, data, 201);
}

export function sendNoContent(reply: FastifyReply) {
  return reply.status(204).send();
}

export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  page: number,
  limit: number,
  total: number,
) {
  return sendSuccess(reply, data, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
```

---

## 11. Swagger/OpenAPI Documentation

### Swagger Plugin

```typescript
// plugins/swagger.plugin.ts
import { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export default async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Hospital-Ops API",
        description: "Hospital & Clinic Management System API",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:3000", description: "Development" },
        { url: "https://api.hospitalops.in", description: "Production" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Patients", description: "Patient management" },
        { name: "Appointments", description: "Appointment scheduling" },
        { name: "Consultations", description: "OPD consultations" },
        { name: "Prescriptions", description: "Prescription management" },
        { name: "Laboratory", description: "Lab orders and results" },
        { name: "Pharmacy", description: "Pharmacy and dispensing" },
        { name: "Billing", description: "Billing and payments" },
        { name: "IPD", description: "Inpatient management" },
        { name: "Staff", description: "Staff management" },
        { name: "Reports", description: "Reports and analytics" },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  // Add shared schemas
  fastify.addSchema({
    $id: "Patient",
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      phone: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
      gender: { type: "string" },
      dateOfBirth: { type: "string", format: "date" },
      abhaNumber: { type: "string" },
      bookingStatus: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  });

  fastify.addSchema({
    $id: "PaginationMeta",
    type: "object",
    properties: {
      page: { type: "integer" },
      limit: { type: "integer" },
      total: { type: "integer" },
      totalPages: { type: "integer" },
    },
  });
}
```

---

## 12. Health Checks

```typescript
// modules/health/health.routes.ts
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get("/health", async (request, reply) => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
    };
  });

  // Detailed health check
  fastify.get("/health/ready", async (request, reply) => {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "healthy";
    } catch {
      checks.database = "unhealthy";
    }

    // Redis check
    try {
      await redis.ping();
      checks.redis = "healthy";
    } catch {
      checks.redis = "unhealthy";
    }

    const isHealthy = Object.values(checks).every((s) => s === "healthy");

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // Liveness probe (for k8s)
  fastify.get("/health/live", async () => {
    return { status: "alive" };
  });
}
```

---

## Summary

This API patterns guide covers:

1. **Project Structure**: Module-based organization
2. **Route Registration**: Fastify route patterns
3. **Controller Pattern**: Request handling
4. **Service Pattern**: Business logic layer
5. **Repository Pattern**: Database access
6. **Validation**: Zod schemas and Fastify validation
7. **Error Handling**: AppError class and global handler
8. **Middleware**: Auth, tenant context, rate limiting
9. **Permission Guards**: RBAC implementation
10. **Response Formatting**: Standard response types
11. **Swagger Documentation**: OpenAPI setup
12. **Health Checks**: Readiness and liveness probes

Key principles:

- Separation of concerns (Controller → Service → Repository)
- Type-safe validation with Zod
- Consistent error handling
- Permission-based access control
- Comprehensive API documentation
