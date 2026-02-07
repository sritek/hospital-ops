---
# Testing patterns - Unit, Integration, API, E2E tests
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts, **/*.spec.ts, **/tests/**/*.ts"
---

# Testing Patterns Guide

## Overview

This document covers testing patterns for Hospital-Ops including unit tests, integration tests, API tests, and end-to-end tests using Vitest, Supertest, and Playwright.

---

## 1. Testing Stack

| Tool       | Purpose                  |
| ---------- | ------------------------ |
| Vitest     | Unit & integration tests |
| Supertest  | API endpoint testing     |
| Playwright | E2E browser testing      |
| MSW        | API mocking              |
| Faker      | Test data generation     |
| fast-check | Property-based testing   |

---

## 2. Test Directory Structure

```
apps/api/
├── src/
│   └── modules/
│       └── patients/
│           ├── patients.service.ts
│           └── __tests__/
│               ├── patients.service.test.ts
│               └── patients.api.test.ts
└── tests/
    ├── setup.ts
    ├── helpers/
    │   ├── db.ts
    │   ├── auth.ts
    │   └── factories/
    │       ├── patient.factory.ts
    │       └── user.factory.ts
    └── integration/
        └── patient-flow.test.ts
```

apps/web/
├── src/
│ └── components/
│ └── forms/
│ └── **tests**/
│ └── patient-form.test.tsx
└── tests/
├── setup.ts
└── e2e/
├── auth.spec.ts
└── patients.spec.ts

````

---

## 3. Vitest Configuration

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests', '**/*.d.ts'],
    },
    poolOptions: {
      threads: {
        singleThread: true, // For database tests
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
````

---

## 4. Test Setup

### Database Setup for Tests

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
```

beforeAll(async () => {
// Ensure test database
if (!process.env.DATABASE_URL?.includes('\_test')) {
throw new Error('Tests must run against test database');
}
});

beforeEach(async () => {
// Clean database before each test
await cleanDatabase();
});

afterAll(async () => {
await prisma.$disconnect();
await redis.quit();
});

async function cleanDatabase() {
const tables = await prisma.$queryRaw<{ tablename: string }[]>`     SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

for (const { tablename } of tables) {
if (tablename !== '\_prisma_migrations') {
await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${tablename}" CASCADE`
);
}
}
}

````

### Test Helpers

```typescript
// tests/helpers/auth.ts
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export function generateTestToken(user: User, options?: { expired?: boolean }) {
  const payload = {
    sub: user.id,
    tenantId: user.tenantId,
    branchIds: [],
    role: user.role,
    permissions: getPermissionsForRole(user.role),
  };
````

const expiresIn = options?.expired ? '-1h' : '1h';

return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
}

export function getPermissionsForRole(role: string): string[] {
const permissions: Record<string, string[]> = {
super_admin: ['*'],
doctor: ['patients:read', 'patients:write', 'prescriptions:*'],
receptionist: ['patients:read', 'patients:write', 'appointments:*'],
};
return permissions[role] || [];
}

````

---

## 5. Test Factories

### Patient Factory

```typescript
// tests/helpers/factories/patient.factory.ts
import { faker } from '@faker-js/faker';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreatePatientOptions {
  tenantId: string;
  overrides?: Partial<Prisma.PatientCreateInput>;
}

export async function createPatient(options: CreatePatientOptions) {
  const { tenantId, overrides = {} } = options;

  return prisma.patient.create({
    data: {
      tenantId,
      phone: faker.phone.number('9#########'),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      gender: faker.helpers.arrayElement(['male', 'female']),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      bloodGroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+']),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: 'Rajasthan',
      pincode: faker.string.numeric(6),
      ...overrides,
    },
  });
}
````

export function buildPatientData(overrides: Partial<Prisma.PatientCreateInput> = {}) {
return {
phone: faker.phone.number('9#########'),
name: faker.person.fullName(),
email: faker.internet.email(),
gender: faker.helpers.arrayElement(['male', 'female']),
...overrides,
};
}

````

### User Factory

```typescript
// tests/helpers/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function createUser(options: {
  tenantId: string;
  role?: string;
  branchId?: string;
}) {
  const { tenantId, role = 'receptionist', branchId } = options;

  const user = await prisma.user.create({
    data: {
      tenantId,
      phone: faker.phone.number('9#########'),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash: await bcrypt.hash('Test@123', 10),
      role,
      isActive: true,
    },
  });

  if (branchId) {
    await prisma.userBranch.create({
      data: { userId: user.id, branchId, isPrimary: true },
    });
  }

  return user;
}
````

### Tenant Factory

```typescript
// tests/helpers/factories/tenant.factory.ts
import { faker } from "@faker-js/faker";
import { prisma } from "@/lib/prisma";
```

export async function createTenant() {
return prisma.tenant.create({
data: {
name: faker.company.name(),
slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
email: faker.internet.email(),
phone: faker.phone.number('9#########'),
subscriptionPlan: 'trial',
subscriptionStatus: 'active',
},
});
}

export async function createBranch(tenantId: string) {
return prisma.branch.create({
data: {
tenantId,
name: `${faker.location.city()} Branch`,
code: faker.string.alphanumeric(4).toUpperCase(),
city: faker.location.city(),
state: 'Rajasthan',
pincode: faker.string.numeric(6),
isActive: true,
},
});
}

````

---

## 6. Unit Test Patterns

### Service Unit Test

```typescript
// src/modules/patients/patients.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientService } from './patients.service';
import { PatientRepository } from './patients.repository';
import { AppError } from '@/common/errors';

describe('PatientService', () => {
  let service: PatientService;
  let mockRepository: Partial<PatientRepository>;

  beforeEach(() => {
    mockRepository = {
      findByPhone: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    };
    service = new PatientService(mockRepository as PatientRepository);
  });
````

describe('create', () => {
it('should create a patient successfully', async () => {
const input = {
tenantId: 'tenant-1',
phone: '9876543210',
name: 'John Doe',
createdBy: 'user-1',
};

      mockRepository.findByPhone = vi.fn().mockResolvedValue(null);
      mockRepository.create = vi.fn().mockResolvedValue({
        id: 'patient-1',
        ...input,
      });

      const result = await service.create(input);

      expect(result.id).toBe('patient-1');
      expect(mockRepository.findByPhone).toHaveBeenCalledWith('tenant-1', '9876543210');
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should throw error if patient already exists', async () => {
      mockRepository.findByPhone = vi.fn().mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          tenantId: 'tenant-1',
          phone: '9876543210',
          name: 'John Doe',
          createdBy: 'user-1',
        })
      ).rejects.toThrow(AppError);
    });

});

describe('findById', () => {
it('should return patient if found', async () => {
const patient = { id: 'patient-1', name: 'John Doe' };
mockRepository.findById = vi.fn().mockResolvedValue(patient);

      const result = await service.findById('tenant-1', 'patient-1');

      expect(result).toEqual(patient);
    });

    it('should throw NotFound if patient does not exist', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(null);

      await expect(
        service.findById('tenant-1', 'non-existent')
      ).rejects.toThrow('Patient not found');
    });

});
});

```

```

---

## 7. API Test Patterns

### API Test Setup

```typescript
// tests/helpers/api.ts
import { FastifyInstance } from "fastify";
import { buildApp } from "@/app";

let app: FastifyInstance;

export async function getTestApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp({ logger: false });
    await app.ready();
  }
  return app;
}

export async function closeTestApp() {
  if (app) {
    await app.close();
  }
}
```

### API Endpoint Test

```typescript
// src/modules/patients/patients.api.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestApp, closeTestApp } from '@tests/helpers/api';
import { createTenant, createBranch } from '@tests/helpers/factories/tenant.factory';
import { createUser } from '@tests/helpers/factories/user.factory';
import { createPatient, buildPatientData } from '@tests/helpers/factories/patient.factory';
import { generateTestToken } from '@tests/helpers/auth';
import { FastifyInstance } from 'fastify';

describe('Patients API', () => {
  let app: FastifyInstance;
  let tenant: any;
  let branch: any;
  let user: any;
  let token: string;
```

beforeAll(async () => {
app = await getTestApp();
});

afterAll(async () => {
await closeTestApp();
});

beforeEach(async () => {
tenant = await createTenant();
branch = await createBranch(tenant.id);
user = await createUser({ tenantId: tenant.id, branchId: branch.id, role: 'receptionist' });
token = generateTestToken(user);
});

describe('POST /v1/patients', () => {
it('should create a patient', async () => {
const patientData = buildPatientData();

      const response = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: { Authorization: `Bearer ${token}` },
        payload: patientData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.phone).toBe(patientData.phone);
      expect(body.data.name).toBe(patientData.name);
    });

    it('should return 400 for invalid phone', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: { Authorization: `Bearer ${token}` },
        payload: { phone: '123', name: 'Test' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate phone', async () => {
      const existingPatient = await createPatient({ tenantId: tenant.id });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: { Authorization: `Bearer ${token}` },
        payload: { phone: existingPatient.phone, name: 'Another Patient' },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 401 without auth token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        payload: buildPatientData(),
      });

      expect(response.statusCode).toBe(401);
    });

});

describe('GET /v1/patients', () => {
it('should list patients with pagination', async () => {
await createPatient({ tenantId: tenant.id });
await createPatient({ tenantId: tenant.id });

      const response = await app.inject({
        method: 'GET',
        url: '/v1/patients?page=1&limit=10',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
      expect(body.meta.total).toBe(2);
    });

    it('should filter patients by search', async () => {
      await createPatient({ tenantId: tenant.id, overrides: { name: 'John Doe' } });
      await createPatient({ tenantId: tenant.id, overrides: { name: 'Jane Smith' } });

      const response = await app.inject({
        method: 'GET',
        url: '/v1/patients?search=John',
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(response.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].name).toBe('John Doe');
    });

});

describe('GET /v1/patients/:id', () => {
it('should return patient by id', async () => {
const patient = await createPatient({ tenantId: tenant.id });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/patients/${patient.id}`,
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBe(patient.id);
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/patients/non-existent-id',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });

});
});

````

---

## 8. Property-Based Testing

### Using fast-check

```typescript
// src/modules/billing/billing.service.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateGST, calculateDiscount } from './billing.utils';

describe('Billing Calculations - Property Tests', () => {
  /**
   * **Validates: Requirements 8.2** - GST calculations
   */
  it('GST should always be non-negative', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 28, noNaN: true }),
        (amount, rate) => {
          const gst = calculateGST(amount, rate);
          return gst >= 0;
        }
      )
    );
  });
````

/\*\*

- **Validates: Requirements 8.2** - Total = Base + GST
  _/
  it('total should equal base amount plus GST', () => {
  fc.assert(
  fc.property(
  fc.float({ min: 0.01, max: 100000, noNaN: true }),
  fc.float({ min: 0, max: 28, noNaN: true }),
  (amount, rate) => {
  const gst = calculateGST(amount, rate);
  const total = amount + gst;
  const expectedTotal = amount _ (1 + rate / 100);
  return Math.abs(total - expectedTotal) < 0.01;
  }
  )
  );
  });

/\*\*

- **Validates: Requirements 8.3** - Discount never exceeds amount
  \*/
  it('discount should never exceed original amount', () => {
  fc.assert(
  fc.property(
  fc.float({ min: 0, max: 100000, noNaN: true }),
  fc.float({ min: 0, max: 100, noNaN: true }),
  (amount, discountPercent) => {
  const discount = calculateDiscount(amount, discountPercent);
  return discount <= amount;
  }
  )
  );
  });

/\*\*

- **Validates: Requirements 8.3** - Final amount is non-negative
  \*/
  it('final amount after discount should be non-negative', () => {
  fc.assert(
  fc.property(
  fc.float({ min: 0, max: 100000, noNaN: true }),
  fc.float({ min: 0, max: 100, noNaN: true }),
  (amount, discountPercent) => {
  const discount = calculateDiscount(amount, discountPercent);
  return amount - discount >= 0;
  }
  )
  );
  });
  });

````

### Appointment Slot Property Tests

```typescript
// src/modules/appointments/slots.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSlots, isSlotAvailable } from './slots.utils';
````

describe('Appointment Slots - Property Tests', () => {
const timeArbitrary = fc.record({
hour: fc.integer({ min: 0, max: 23 }),
minute: fc.integer({ min: 0, max: 59 }),
});

/\*\*

- **Validates: Requirements 3.1** - No overlapping slots
  \*/
  it('generated slots should never overlap', () => {
  fc.assert(
  fc.property(
  timeArbitrary,
  timeArbitrary,
  fc.integer({ min: 15, max: 60 }),
  (startTime, endTime, duration) => {
  if (startTime.hour > endTime.hour) return true; // Skip invalid ranges
  const slots = generateSlots(
  `${startTime.hour}:${startTime.minute}`,
  `${endTime.hour}:${endTime.minute}`,
  duration
  );

          for (let i = 0; i < slots.length - 1; i++) {
            const currentEnd = new Date(slots[i].endTime);
            const nextStart = new Date(slots[i + 1].startTime);
            if (currentEnd > nextStart) return false;
          }
          return true;
        }
      )

  );
  });

/\*\*

- **Validates: Requirements 3.2** - Slot duration consistency
  \*/
  it('all slots should have consistent duration', () => {
  fc.assert(
  fc.property(
  fc.integer({ min: 15, max: 60 }),
  (duration) => {
  const slots = generateSlots('09:00', '17:00', duration);
  return slots.every(slot => {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const slotDuration = (end.getTime() - start.getTime()) / 60000;
  return slotDuration === duration;
  });
  }
  )
  );
  });
  });

````

---

## 9. Integration Test Patterns

### Patient Flow Integration Test

```typescript
// tests/integration/patient-flow.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestApp, closeTestApp } from '@tests/helpers/api';
import { createTenant, createBranch } from '@tests/helpers/factories/tenant.factory';
import { createUser } from '@tests/helpers/factories/user.factory';
import { generateTestToken } from '@tests/helpers/auth';
````

describe('Patient Registration to Appointment Flow', () => {
let app: any;
let tenant: any;
let branch: any;
let receptionist: any;
let doctor: any;
let receptionistToken: string;
let doctorToken: string;

beforeAll(async () => {
app = await getTestApp();
});

afterAll(async () => {
await closeTestApp();
});

beforeEach(async () => {
tenant = await createTenant();
branch = await createBranch(tenant.id);
receptionist = await createUser({ tenantId: tenant.id, branchId: branch.id, role: 'receptionist' });
doctor = await createUser({ tenantId: tenant.id, branchId: branch.id, role: 'doctor' });
receptionistToken = generateTestToken(receptionist);
doctorToken = generateTestToken(doctor);
});

it('should complete full patient registration to appointment flow', async () => {
// Step 1: Register patient
const patientResponse = await app.inject({
method: 'POST',
url: '/v1/patients',
headers: { Authorization: `Bearer ${receptionistToken}` },
payload: {
phone: '9876543210',
name: 'Test Patient',
gender: 'male',
dateOfBirth: '1990-01-15',
},
});

    expect(patientResponse.statusCode).toBe(201);
    const patient = JSON.parse(patientResponse.body).data;

    // Step 2: Get available slots
    const today = new Date().toISOString().split('T')[0];
    const slotsResponse = await app.inject({
      method: 'GET',
      url: `/v1/appointments/slots?doctorId=${doctor.id}&date=${today}`,
      headers: { Authorization: `Bearer ${receptionistToken}` },
    });

    expect(slotsResponse.statusCode).toBe(200);
    const slots = JSON.parse(slotsResponse.body).data;
    expect(slots.length).toBeGreaterThan(0);

    // Step 3: Book appointment
    const appointmentResponse = await app.inject({
      method: 'POST',
      url: '/v1/appointments',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      payload: {
        patientId: patient.id,
        doctorId: doctor.id,
        branchId: branch.id,
        date: today,
        startTime: slots[0].startTime,
        type: 'consultation',
        notes: 'General checkup',
      },
    });

    expect(appointmentResponse.statusCode).toBe(201);
    const appointment = JSON.parse(appointmentResponse.body).data;
    expect(appointment.status).toBe('booked');

    // Step 4: Verify slot is no longer available
    const updatedSlotsResponse = await app.inject({
      method: 'GET',
      url: `/v1/appointments/slots?doctorId=${doctor.id}&date=${today}`,
      headers: { Authorization: `Bearer ${receptionistToken}` },
    });

    const updatedSlots = JSON.parse(updatedSlotsResponse.body).data;
    const bookedSlot = updatedSlots.find((s: any) => s.startTime === slots[0].startTime);
    expect(bookedSlot.available).toBe(false);

    // Step 5: Doctor can view appointment
    const doctorAppointmentsResponse = await app.inject({
      method: 'GET',
      url: `/v1/appointments?doctorId=${doctor.id}&date=${today}`,
      headers: { Authorization: `Bearer ${doctorToken}` },
    });

    expect(doctorAppointmentsResponse.statusCode).toBe(200);
    const doctorAppointments = JSON.parse(doctorAppointmentsResponse.body).data;
    expect(doctorAppointments.some((a: any) => a.id === appointment.id)).toBe(true);

});
});

````

---

## 10. E2E Test Patterns (Playwright)

### Playwright Configuration

```typescript
// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
````

### E2E Test Example

```typescript
// apps/web/tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="phone"]', "9876543210");
    await page.fill('input[name="password"]', "Test@123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Welcome")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="phone"]', "9876543210");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="phone"]', "9876543210");
    await page.fill('input[name="password"]', "Test@123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click("text=Logout");

    await expect(page).toHaveURL("/login");
  });
});
```

### Patient E2E Test

```typescript
// apps/web/tests/e2e/patients.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });
```

test('should create a new patient', async ({ page }) => {
await page.goto('/patients/new');

    await page.fill('input[name="phone"]', '9123456789');
    await page.fill('input[name="name"]', 'E2E Test Patient');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="dateOfBirth"]', '1990-05-15');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Patient created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/patients\/[\w-]+/);

});

test('should search for patients', async ({ page }) => {
await page.goto('/patients');

    await page.fill('input[placeholder="Search patients..."]', 'E2E Test');
    await page.waitForTimeout(500); // Debounce

    await expect(page.locator('text=E2E Test Patient')).toBeVisible();

});

test('should view patient details', async ({ page }) => {
await page.goto('/patients');
await page.click('text=E2E Test Patient');

    await expect(page.locator('h1:has-text("E2E Test Patient")')).toBeVisible();
    await expect(page.locator('text=9123456789')).toBeVisible();

});
});

````

---

## 11. Test Coverage Requirements

### Minimum Coverage Targets

| Category | Target |
|----------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Critical Paths (100% Coverage Required)

- Authentication flows
- Billing calculations
- GST calculations
- Appointment slot logic
- Prescription drug interactions
- ABDM consent flows

---

## 12. CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - uses: codecov/codecov-action@v3
````

api-tests:
runs-on: ubuntu-latest
services:
postgres:
image: postgres:16
env:
POSTGRES_USER: test
POSTGRES_PASSWORD: test
POSTGRES_DB: hospital_ops_test
ports: - 5432:5432
redis:
image: redis:7
ports: - 6379:6379
steps: - uses: actions/checkout@v4 - uses: pnpm/action-setup@v2 - uses: actions/setup-node@v4
with:
node-version: '22'
cache: 'pnpm' - run: pnpm install - run: pnpm db:migrate:test - run: pnpm test:api
env:
DATABASE_URL: postgresql://test:test@localhost:5432/hospital_ops_test
REDIS_URL: redis://localhost:6379

e2e-tests:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4 - uses: pnpm/action-setup@v2 - uses: actions/setup-node@v4
with:
node-version: '22'
cache: 'pnpm' - run: pnpm install - run: pnpm exec playwright install --with-deps - run: pnpm test:e2e - uses: actions/upload-artifact@v3
if: failure()
with:
name: playwright-report
path: apps/web/playwright-report/

```

---

## 13. Best Practices

### Do's
- Write tests before or alongside code (TDD/BDD)
- Use descriptive test names that explain the scenario
- Keep tests independent and isolated
- Use factories for test data generation
- Test edge cases and error scenarios
- Use property-based tests for calculations

### Don'ts
- Don't test implementation details
- Don't share state between tests
- Don't use production database for tests
- Don't skip tests without good reason
- Don't mock everything - prefer integration tests
- Don't write flaky tests
```
