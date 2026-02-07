---
# Database schema patterns - Prisma models, migrations, and RLS
inclusion: fileMatch
fileMatchPattern: "apps/api/prisma/**/*.prisma, apps/api/prisma/**/*.ts, **/migrations/**/*"
---

# Database Schema Guide

## Overview

This document provides the complete Prisma schema definitions, migration patterns, and database design guidelines for Hospital-Ops.

---

## 1. Prisma Configuration

### Schema Organization

```
apps/api/prisma/
├── schema.prisma           # Main schema with datasource and generators
├── migrations/             # Generated migrations
├── seed.ts                 # Database seeding script
└── seed-data/              # Seed data files
    ├── roles.json
    ├── services.json
    └── drugs.json
```

### Main Schema Configuration

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearch"]
}

// Enable required PostgreSQL extensions
// Run: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
// Run: CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

---

## 2. Core Models

### Tenant (Healthcare Facility)

```prisma
model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @db.VarChar(255)
  slug      String   @unique @db.VarChar(100)
  legalName String?  @map("legal_name") @db.VarChar(255)
  email     String   @db.VarChar(255)
  phone     String?  @db.VarChar(20)
  logoUrl   String?  @map("logo_url") @db.VarChar(500)

  // ABDM Integration
  hfrId String? @map("hfr_id") @db.VarChar(50) // Health Facility Registry ID
  hipId String? @map("hip_id") @db.VarChar(50) // Health Information Provider ID

  // Address
  address String? @db.Text
  city    String? @db.VarChar(100)
  state   String? @db.VarChar(100)
  pincode String? @db.VarChar(10)

  // Settings
  settings Json @default("{}")

  // Subscription
  subscriptionPlan   String    @default("trial") @map("subscription_plan") @db.VarChar(50)
  subscriptionStatus String    @default("active") @map("subscription_status") @db.VarChar(20)
  trialEndsAt        DateTime? @map("trial_ends_at") @db.Timestamptz

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  branches     Branch[]
  users        User[]
  patients     Patient[]
  services     Service[]
  appointments Appointment[]
  auditLogs    AuditLog[]

  @@map("tenants")
}
```

### Branch

```prisma
model Branch {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  name     String @db.VarChar(255)
  code     String @db.VarChar(20)

  // Contact
  address String? @db.Text
  city    String? @db.VarChar(100)
  state   String? @db.VarChar(100)
  pincode String? @db.VarChar(10)
  phone   String? @db.VarChar(20)
  email   String? @db.VarChar(255)

  // Tax
  gstin String? @db.VarChar(20)

  // Operations
  timezone     String @default("Asia/Kolkata") @db.VarChar(50)
  currency     String @default("INR") @db.VarChar(3)
  workingHours Json?  @map("working_hours")

  // Settings
  settings Json    @default("{}")
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  userBranches    UserBranch[]
  appointments    Appointment[]
  consultations   Consultation[]
  beds            Bed[]
  inventoryItems  InventoryItem[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@map("branches")
}
```

### User (Staff)

```prisma
enum UserRole {
  super_admin
  branch_admin
  doctor
  nurse
  receptionist
  pharmacist
  lab_tech
  accountant
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  email        String?  @db.VarChar(255)
  phone        String   @db.VarChar(20)
  passwordHash String   @map("password_hash") @db.VarChar(255)

  // Profile
  name      String  @db.VarChar(255)
  gender    String? @db.VarChar(10)
  avatarUrl String? @map("avatar_url") @db.VarChar(500)

  // Role
  role UserRole

  // Professional (for doctors/nurses)
  registrationNumber  String? @map("registration_number") @db.VarChar(50)
  registrationCouncil String? @map("registration_council") @db.VarChar(100)
  specialization      String? @db.VarChar(100)
  qualification       String? @db.VarChar(255)
  hprId               String? @map("hpr_id") @db.VarChar(50) // Healthcare Professional Registry
  digitalSignatureUrl String? @map("digital_signature_url") @db.VarChar(500)
  consultationFee     Decimal? @map("consultation_fee") @db.Decimal(10, 2)

  // Status
  isActive    Boolean   @default(true) @map("is_active")
  lastLoginAt DateTime? @map("last_login_at") @db.Timestamptz

  // Settings
  settings Json @default("{}")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  tenant              Tenant              @relation(fields: [tenantId], references: [id])
  branches            UserBranch[]
  appointmentsAsDoctor Appointment[]      @relation("DoctorAppointments")
  consultations       Consultation[]
  prescriptions       Prescription[]
  refreshTokens       RefreshToken[]

  @@unique([tenantId, phone])
  @@index([tenantId])
  @@index([tenantId, role])
  @@map("users")
}

model UserBranch {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  branchId  String   @map("branch_id") @db.Uuid
  isPrimary Boolean  @default(false) @map("is_primary")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  user   User   @relation(fields: [userId], references: [id])
  branch Branch @relation(fields: [branchId], references: [id])

  @@unique([userId, branchId])
  @@map("user_branches")
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(500)
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  revokedAt DateTime? @map("revoked_at") @db.Timestamptz

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

### Patient

```prisma
enum BookingStatus {
  normal
  warning
  prepaid_only
  blocked
}

model Patient {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // ABHA Integration
  abhaNumber  String? @map("abha_number") @db.VarChar(20)
  abhaAddress String? @map("abha_address") @db.VarChar(100)

  // Identity
  phone       String    @db.VarChar(20)
  name        String    @db.VarChar(255)
  email       String?   @db.VarChar(255)
  gender      String?   @db.VarChar(10)
  dateOfBirth DateTime? @map("date_of_birth") @db.Date
  photoUrl    String?   @map("photo_url") @db.VarChar(500)

  // Address
  address String? @db.Text
  city    String? @db.VarChar(100)
  state   String? @db.VarChar(100)
  pincode String? @db.VarChar(10)

  // Emergency Contact
  emergencyContactName     String? @map("emergency_contact_name") @db.VarChar(255)
  emergencyContactPhone    String? @map("emergency_contact_phone") @db.VarChar(20)
  emergencyContactRelation String? @map("emergency_contact_relation") @db.VarChar(50)

  // Medical
  bloodGroup        String?  @map("blood_group") @db.VarChar(5)
  allergies         String[] @default([])
  chronicConditions String[] @default([]) @map("chronic_conditions")

  // Preferences
  preferredLanguage String  @default("en") @map("preferred_language") @db.VarChar(10)
  marketingConsent  Boolean @default(true) @map("marketing_consent")

  // Booking Status
  noShowCount   Int           @default(0) @map("no_show_count")
  bookingStatus BookingStatus @default(normal) @map("booking_status")

  // First Visit
  firstVisitBranchId String? @map("first_visit_branch_id") @db.Uuid

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  appointments  Appointment[]
  consultations Consultation[]
  prescriptions Prescription[]
  vitals        Vital[]
  labOrders     LabOrder[]
  admissions    Admission[]
  consents      PatientConsent[]
  bills         Bill[]

  @@unique([tenantId, phone])
  @@index([tenantId])
  @@index([tenantId, abhaNumber])
  @@map("patients")
}
```

---

## 3. Appointment & Queue Models

```prisma
enum AppointmentStatus {
  scheduled
  confirmed
  checked_in
  in_progress
  completed
  cancelled
  no_show
}

enum AppointmentType {
  walk_in
  phone
  online
  whatsapp
  follow_up
  telemedicine
}

model Appointment {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  branchId  String @map("branch_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  doctorId  String @map("doctor_id") @db.Uuid

  // Scheduling
  appointmentDate DateTime          @map("appointment_date") @db.Date
  startTime       String            @map("start_time") @db.VarChar(5) // HH:MM
  endTime         String            @map("end_time") @db.VarChar(5)
  duration        Int               // minutes
  status          AppointmentStatus @default(scheduled)
  type            AppointmentType   @default(phone)

  // Queue
  tokenNumber Int?    @map("token_number")
  queuePosition Int?  @map("queue_position")
  checkedInAt DateTime? @map("checked_in_at") @db.Timestamptz
  startedAt   DateTime? @map("started_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz

  // Booking Details
  chiefComplaint String? @map("chief_complaint") @db.Text
  notes          String? @db.Text

  // Reschedule Tracking
  rescheduleCount    Int       @default(0) @map("reschedule_count")
  originalDate       DateTime? @map("original_date") @db.Date
  rescheduledFrom    String?   @map("rescheduled_from") @db.Uuid
  cancellationReason String?   @map("cancellation_reason") @db.Text

  // Prepayment
  prepaidAmount Decimal? @map("prepaid_amount") @db.Decimal(10, 2)
  prepaidAt     DateTime? @map("prepaid_at") @db.Timestamptz

  // Reminders
  reminder24hSent Boolean @default(false) @map("reminder_24h_sent")
  reminder2hSent  Boolean @default(false) @map("reminder_2h_sent")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  createdBy String?   @map("created_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  branch       Branch        @relation(fields: [branchId], references: [id])
  patient      Patient       @relation(fields: [patientId], references: [id])
  doctor       User          @relation("DoctorAppointments", fields: [doctorId], references: [id])
  consultation Consultation?
  bill         Bill?

  @@index([tenantId, branchId, appointmentDate])
  @@index([tenantId, doctorId, appointmentDate])
  @@index([tenantId, patientId])
  @@index([tenantId, status])
  @@map("appointments")
}

model DoctorSchedule {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid
  doctorId String @map("doctor_id") @db.Uuid

  // Schedule
  dayOfWeek    Int      // 0-6 (Sunday-Saturday)
  startTime    String   @map("start_time") @db.VarChar(5)
  endTime      String   @map("end_time") @db.VarChar(5)
  slotDuration Int      @default(15) @map("slot_duration") // minutes
  maxPatients  Int?     @map("max_patients")
  isActive     Boolean  @default(true) @map("is_active")

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([tenantId, branchId, doctorId, dayOfWeek])
  @@map("doctor_schedules")
}

model DoctorLeave {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  doctorId String @map("doctor_id") @db.Uuid

  // Leave Period
  startDate DateTime @map("start_date") @db.Date
  endDate   DateTime @map("end_date") @db.Date
  reason    String?  @db.Text
  isFullDay Boolean  @default(true) @map("is_full_day")
  startTime String?  @map("start_time") @db.VarChar(5)
  endTime   String?  @map("end_time") @db.VarChar(5)

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  createdBy String?  @map("created_by") @db.Uuid

  @@index([tenantId, doctorId, startDate, endDate])
  @@map("doctor_leaves")
}
```

---

## 4. Clinical Models

### Consultation & Vitals

```prisma
model Consultation {
  id            String @id @default(uuid()) @db.Uuid
  tenantId      String @map("tenant_id") @db.Uuid
  branchId      String @map("branch_id") @db.Uuid
  appointmentId String @unique @map("appointment_id") @db.Uuid
  patientId     String @map("patient_id") @db.Uuid
  doctorId      String @map("doctor_id") @db.Uuid

  // Clinical Notes
  chiefComplaints   String?  @map("chief_complaints") @db.Text
  historyOfIllness  String?  @map("history_of_illness") @db.Text
  examination       String?  @db.Text
  assessment        String?  @db.Text
  plan              String?  @db.Text

  // Diagnosis (ICD-10/11)
  diagnoses Json @default("[]") // [{code, description, type: primary|secondary}]

  // AI Documentation
  aiGeneratedNotes String?  @map("ai_generated_notes") @db.Text
  audioRecordingUrl String? @map("audio_recording_url") @db.VarChar(500)

  // Follow-up
  followUpRequired Boolean   @default(false) @map("follow_up_required")
  followUpDays     Int?      @map("follow_up_days")
  followUpNotes    String?   @map("follow_up_notes") @db.Text

  // Timing
  startedAt   DateTime? @map("started_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  duration    Int?      // minutes

  // Telemedicine
  isTelemedicine Boolean @default(false) @map("is_telemedicine")
  videoSessionId String? @map("video_session_id") @db.VarChar(100)

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  branch       Branch        @relation(fields: [branchId], references: [id])
  appointment  Appointment   @relation(fields: [appointmentId], references: [id])
  patient      Patient       @relation(fields: [patientId], references: [id])
  doctor       User          @relation(fields: [doctorId], references: [id])
  prescriptions Prescription[]
  labOrders    LabOrder[]

  @@index([tenantId, branchId])
  @@index([tenantId, patientId])
  @@index([tenantId, doctorId])
  @@map("consultations")
}

model Vital {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid
  branchId  String @map("branch_id") @db.Uuid

  // Measurements
  temperature     Decimal? @db.Decimal(4, 1) // Celsius
  bloodPressureSystolic  Int? @map("bp_systolic")
  bloodPressureDiastolic Int? @map("bp_diastolic")
  pulseRate       Int?     @map("pulse_rate")
  respiratoryRate Int?     @map("respiratory_rate")
  oxygenSaturation Int?    @map("oxygen_saturation") // SpO2 %
  weight          Decimal? @db.Decimal(5, 2) // kg
  height          Decimal? @db.Decimal(5, 2) // cm
  bmi             Decimal? @db.Decimal(4, 1)
  bloodSugar      Int?     @map("blood_sugar") // mg/dL

  // Context
  notes String? @db.Text

  // Audit
  recordedAt DateTime @default(now()) @map("recorded_at") @db.Timestamptz
  recordedBy String   @map("recorded_by") @db.Uuid

  // Relations
  patient Patient @relation(fields: [patientId], references: [id])

  @@index([tenantId, patientId, recordedAt])
  @@map("vitals")
}
```

### Prescription

```prisma
model Prescription {
  id             String @id @default(uuid()) @db.Uuid
  tenantId       String @map("tenant_id") @db.Uuid
  consultationId String @map("consultation_id") @db.Uuid
  patientId      String @map("patient_id") @db.Uuid
  doctorId       String @map("doctor_id") @db.Uuid

  // Prescription Details
  prescriptionNumber String   @unique @map("prescription_number") @db.VarChar(50)
  prescriptionDate   DateTime @default(now()) @map("prescription_date") @db.Date
  validUntil         DateTime @map("valid_until") @db.Date

  // Clinical Context
  diagnosis String? @db.Text
  notes     String? @db.Text

  // Telemedicine Flag
  isTelemedicine Boolean @default(false) @map("is_telemedicine")

  // Status
  status String @default("active") @db.VarChar(20) // active, dispensed, expired, cancelled

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  consultation Consultation       @relation(fields: [consultationId], references: [id])
  patient      Patient            @relation(fields: [patientId], references: [id])
  doctor       User               @relation(fields: [doctorId], references: [id])
  items        PrescriptionItem[]
  dispensings  Dispensing[]

  @@index([tenantId, patientId])
  @@index([tenantId, prescriptionNumber])
  @@map("prescriptions")
}

model PrescriptionItem {
  id             String @id @default(uuid()) @db.Uuid
  prescriptionId String @map("prescription_id") @db.Uuid
  drugId         String @map("drug_id") @db.Uuid

  // Drug Details (snapshot at prescription time)
  drugName     String @map("drug_name") @db.VarChar(255)
  drugGeneric  String? @map("drug_generic") @db.VarChar(255)
  drugStrength String? @map("drug_strength") @db.VarChar(100)
  drugForm     String? @map("drug_form") @db.VarChar(50) // tablet, capsule, syrup, injection

  // Dosage
  dosage       String  @db.VarChar(100) // e.g., "1-0-1", "500mg"
  frequency    String  @db.VarChar(100) // e.g., "twice daily", "every 8 hours"
  duration     Int     // days
  durationUnit String  @default("days") @map("duration_unit") @db.VarChar(20)
  quantity     Int
  route        String? @db.VarChar(50) // oral, IV, IM, topical

  // Instructions
  instructions    String? @db.Text // e.g., "Take after meals"
  beforeAfterFood String? @map("before_after_food") @db.VarChar(20) // before, after, with

  // Flags
  isControlled Boolean @default(false) @map("is_controlled")
  isSOS        Boolean @default(false) @map("is_sos") // as needed

  // Dispensing Status
  quantityDispensed Int @default(0) @map("quantity_dispensed")

  // Relations
  prescription Prescription @relation(fields: [prescriptionId], references: [id])
  drug         Drug         @relation(fields: [drugId], references: [id])

  @@map("prescription_items")
}

model Drug {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Drug Identity
  name        String  @db.VarChar(255)
  genericName String? @map("generic_name") @db.VarChar(255)
  brandName   String? @map("brand_name") @db.VarChar(255)
  manufacturer String? @db.VarChar(255)

  // Classification
  category    String? @db.VarChar(100) // Antibiotic, Analgesic, etc.
  drugClass   String? @map("drug_class") @db.VarChar(100)
  schedule    String? @db.VarChar(10) // H, H1, X (controlled substance schedule)

  // Form & Strength
  form     String  @db.VarChar(50) // tablet, capsule, syrup, injection
  strength String? @db.VarChar(100)
  unit     String? @db.VarChar(20) // mg, ml, etc.

  // Pricing
  mrp          Decimal @db.Decimal(10, 2)
  purchaseRate Decimal? @map("purchase_rate") @db.Decimal(10, 2)
  sellingRate  Decimal? @map("selling_rate") @db.Decimal(10, 2)

  // Tax
  gstRate Decimal @default(12) @map("gst_rate") @db.Decimal(4, 2)
  hsnCode String? @map("hsn_code") @db.VarChar(20)

  // Inventory
  reorderLevel Int @default(10) @map("reorder_level")
  isActive     Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  prescriptionItems PrescriptionItem[]
  inventoryItems    InventoryItem[]
  drugInteractions  DrugInteraction[]  @relation("DrugA")
  interactsWith     DrugInteraction[]  @relation("DrugB")

  @@index([tenantId, name])
  @@index([tenantId, genericName])
  @@map("drugs")
}

model DrugInteraction {
  id      String @id @default(uuid()) @db.Uuid
  drugAId String @map("drug_a_id") @db.Uuid
  drugBId String @map("drug_b_id") @db.Uuid

  // Interaction Details
  severity    String @db.VarChar(20) // mild, moderate, severe, contraindicated
  description String @db.Text
  mechanism   String? @db.Text
  management  String? @db.Text

  // Relations
  drugA Drug @relation("DrugA", fields: [drugAId], references: [id])
  drugB Drug @relation("DrugB", fields: [drugBId], references: [id])

  @@unique([drugAId, drugBId])
  @@map("drug_interactions")
}
```

---

## 5. Laboratory Models

```prisma
enum LabOrderStatus {
  ordered
  sample_collected
  processing
  completed
  cancelled
}

model LabOrder {
  id             String @id @default(uuid()) @db.Uuid
  tenantId       String @map("tenant_id") @db.Uuid
  branchId       String @map("branch_id") @db.Uuid
  patientId      String @map("patient_id") @db.Uuid
  consultationId String? @map("consultation_id") @db.Uuid
  orderedBy      String @map("ordered_by") @db.Uuid

  // Order Details
  orderNumber String         @unique @map("order_number") @db.VarChar(50)
  orderDate   DateTime       @default(now()) @map("order_date") @db.Timestamptz
  status      LabOrderStatus @default(ordered)
  priority    String         @default("routine") @db.VarChar(20) // routine, urgent, stat

  // Clinical Context
  clinicalNotes String? @map("clinical_notes") @db.Text
  diagnosis     String? @db.Text

  // External Lab
  isExternal     Boolean @default(false) @map("is_external")
  externalLabId  String? @map("external_lab_id") @db.Uuid
  externalLabRef String? @map("external_lab_ref") @db.VarChar(100)

  // Timing
  expectedAt  DateTime? @map("expected_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  patient      Patient       @relation(fields: [patientId], references: [id])
  consultation Consultation? @relation(fields: [consultationId], references: [id])
  tests        LabOrderTest[]
  samples      Sample[]
  bill         Bill?

  @@index([tenantId, branchId, orderDate])
  @@index([tenantId, patientId])
  @@index([tenantId, status])
  @@map("lab_orders")
}

model LabTest {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Test Details
  code        String @db.VarChar(50)
  name        String @db.VarChar(255)
  description String? @db.Text
  category    String? @db.VarChar(100) // Hematology, Biochemistry, Microbiology

  // Sample Requirements
  sampleType     String  @map("sample_type") @db.VarChar(50) // blood, urine, stool, swab
  sampleVolume   String? @map("sample_volume") @db.VarChar(50)
  containerType  String? @map("container_type") @db.VarChar(50)
  fastingRequired Boolean @default(false) @map("fasting_required")

  // Turnaround
  turnaroundHours Int @default(24) @map("turnaround_hours")

  // Pricing
  price   Decimal @db.Decimal(10, 2)
  gstRate Decimal @default(18) @map("gst_rate") @db.Decimal(4, 2)

  // Reference Ranges (JSON for flexibility)
  referenceRanges Json @default("[]") @map("reference_ranges")
  // [{gender: "male", ageMin: 18, ageMax: 60, min: 4.5, max: 5.5, unit: "million/mcL"}]

  // Status
  isActive Boolean @default(true) @map("is_active")
  isPanel  Boolean @default(false) @map("is_panel") // true if this is a panel/profile

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  orderTests   LabOrderTest[]
  panelTests   LabTestPanel[] @relation("PanelTest")
  includedIn   LabTestPanel[] @relation("IncludedTest")

  @@unique([tenantId, code])
  @@index([tenantId, category])
  @@map("lab_tests")
}

model LabTestPanel {
  id          String @id @default(uuid()) @db.Uuid
  panelId     String @map("panel_id") @db.Uuid
  testId      String @map("test_id") @db.Uuid
  displayOrder Int   @default(0) @map("display_order")

  // Relations
  panel LabTest @relation("PanelTest", fields: [panelId], references: [id])
  test  LabTest @relation("IncludedTest", fields: [testId], references: [id])

  @@unique([panelId, testId])
  @@map("lab_test_panels")
}

model LabOrderTest {
  id         String @id @default(uuid()) @db.Uuid
  labOrderId String @map("lab_order_id") @db.Uuid
  labTestId  String @map("lab_test_id") @db.Uuid

  // Status
  status String @default("pending") @db.VarChar(20) // pending, processing, completed

  // Results
  results LabResult[]

  // Pricing (snapshot)
  price   Decimal @db.Decimal(10, 2)
  gstRate Decimal @map("gst_rate") @db.Decimal(4, 2)

  // Relations
  labOrder LabOrder @relation(fields: [labOrderId], references: [id])
  labTest  LabTest  @relation(fields: [labTestId], references: [id])

  @@unique([labOrderId, labTestId])
  @@map("lab_order_tests")
}

model LabResult {
  id            String @id @default(uuid()) @db.Uuid
  labOrderTestId String @map("lab_order_test_id") @db.Uuid

  // Result Details
  parameterName String  @map("parameter_name") @db.VarChar(255)
  value         String  @db.VarChar(255)
  unit          String? @db.VarChar(50)
  referenceMin  String? @map("reference_min") @db.VarChar(50)
  referenceMax  String? @map("reference_max") @db.VarChar(50)
  referenceText String? @map("reference_text") @db.VarChar(255)

  // Flags
  isAbnormal Boolean @default(false) @map("is_abnormal")
  isCritical Boolean @default(false) @map("is_critical")
  flag       String? @db.VarChar(10) // H (high), L (low), HH (critical high), LL (critical low)

  // Interpretation
  interpretation String? @db.Text
  comments       String? @db.Text

  // Audit
  enteredAt DateTime @default(now()) @map("entered_at") @db.Timestamptz
  enteredBy String   @map("entered_by") @db.Uuid
  verifiedAt DateTime? @map("verified_at") @db.Timestamptz
  verifiedBy String?   @map("verified_by") @db.Uuid

  // Relations
  labOrderTest LabOrderTest @relation(fields: [labOrderTestId], references: [id])

  @@map("lab_results")
}

model Sample {
  id         String @id @default(uuid()) @db.Uuid
  labOrderId String @map("lab_order_id") @db.Uuid

  // Sample Details
  sampleNumber String   @unique @map("sample_number") @db.VarChar(50)
  sampleType   String   @map("sample_type") @db.VarChar(50)
  barcode      String?  @unique @db.VarChar(100)

  // Collection
  collectedAt DateTime? @map("collected_at") @db.Timestamptz
  collectedBy String?   @map("collected_by") @db.Uuid

  // Processing
  receivedAt  DateTime? @map("received_at") @db.Timestamptz
  processedAt DateTime? @map("processed_at") @db.Timestamptz

  // Status
  status String @default("pending") @db.VarChar(20) // pending, collected, received, processing, completed, rejected

  // Rejection
  rejectedAt     DateTime? @map("rejected_at") @db.Timestamptz
  rejectionReason String?  @map("rejection_reason") @db.Text

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  labOrder LabOrder @relation(fields: [labOrderId], references: [id])

  @@index([labOrderId])
  @@map("samples")
}
```

---

## 6. Pharmacy & Inventory Models

```prisma
model InventoryItem {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid
  drugId   String @map("drug_id") @db.Uuid

  // Batch Details
  batchNumber    String   @map("batch_number") @db.VarChar(100)
  expiryDate     DateTime @map("expiry_date") @db.Date
  manufacturingDate DateTime? @map("manufacturing_date") @db.Date

  // Quantity
  quantity         Int
  reservedQuantity Int @default(0) @map("reserved_quantity")
  availableQuantity Int @default(0) @map("available_quantity") // computed: quantity - reserved

  // Pricing
  purchaseRate Decimal @map("purchase_rate") @db.Decimal(10, 2)
  sellingRate  Decimal @map("selling_rate") @db.Decimal(10, 2)
  mrp          Decimal @db.Decimal(10, 2)

  // Purchase Reference
  purchaseOrderId String? @map("purchase_order_id") @db.Uuid
  goodsReceiptId  String? @map("goods_receipt_id") @db.Uuid

  // Status
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  branch Branch @relation(fields: [branchId], references: [id])
  drug   Drug   @relation(fields: [drugId], references: [id])

  @@unique([branchId, drugId, batchNumber])
  @@index([tenantId, branchId])
  @@index([tenantId, branchId, expiryDate])
  @@map("inventory_items")
}

model PurchaseOrder {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid

  // Order Details
  orderNumber String   @unique @map("order_number") @db.VarChar(50)
  orderDate   DateTime @default(now()) @map("order_date") @db.Date
  supplierId  String   @map("supplier_id") @db.Uuid

  // Status
  status String @default("draft") @db.VarChar(20) // draft, submitted, approved, received, cancelled

  // Totals
  subtotal   Decimal @db.Decimal(12, 2)
  taxAmount  Decimal @map("tax_amount") @db.Decimal(10, 2)
  totalAmount Decimal @map("total_amount") @db.Decimal(12, 2)

  // Notes
  notes String? @db.Text

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  createdBy String    @map("created_by") @db.Uuid
  approvedAt DateTime? @map("approved_at") @db.Timestamptz
  approvedBy String?   @map("approved_by") @db.Uuid

  // Relations
  supplier      Supplier            @relation(fields: [supplierId], references: [id])
  items         PurchaseOrderItem[]
  goodsReceipts GoodsReceipt[]

  @@index([tenantId, branchId])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id              String @id @default(uuid()) @db.Uuid
  purchaseOrderId String @map("purchase_order_id") @db.Uuid
  drugId          String @map("drug_id") @db.Uuid

  // Quantity
  orderedQuantity  Int @map("ordered_quantity")
  receivedQuantity Int @default(0) @map("received_quantity")

  // Pricing
  unitPrice  Decimal @map("unit_price") @db.Decimal(10, 2)
  gstRate    Decimal @map("gst_rate") @db.Decimal(4, 2)
  totalPrice Decimal @map("total_price") @db.Decimal(10, 2)

  // Relations
  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])

  @@map("purchase_order_items")
}

model GoodsReceipt {
  id              String @id @default(uuid()) @db.Uuid
  tenantId        String @map("tenant_id") @db.Uuid
  branchId        String @map("branch_id") @db.Uuid
  purchaseOrderId String @map("purchase_order_id") @db.Uuid

  // Receipt Details
  receiptNumber String   @unique @map("receipt_number") @db.VarChar(50)
  receiptDate   DateTime @default(now()) @map("receipt_date") @db.Date
  invoiceNumber String?  @map("invoice_number") @db.VarChar(100)
  invoiceDate   DateTime? @map("invoice_date") @db.Date

  // Status
  status String @default("pending") @db.VarChar(20) // pending, verified, posted

  // Notes
  notes String? @db.Text

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  createdBy String    @map("created_by") @db.Uuid
  verifiedAt DateTime? @map("verified_at") @db.Timestamptz
  verifiedBy String?   @map("verified_by") @db.Uuid

  // Relations
  purchaseOrder PurchaseOrder       @relation(fields: [purchaseOrderId], references: [id])
  items         GoodsReceiptItem[]

  @@index([tenantId, branchId])
  @@map("goods_receipts")
}

model GoodsReceiptItem {
  id             String @id @default(uuid()) @db.Uuid
  goodsReceiptId String @map("goods_receipt_id") @db.Uuid
  drugId         String @map("drug_id") @db.Uuid

  // Batch Details
  batchNumber    String   @map("batch_number") @db.VarChar(100)
  expiryDate     DateTime @map("expiry_date") @db.Date
  manufacturingDate DateTime? @map("manufacturing_date") @db.Date

  // Quantity
  receivedQuantity Int @map("received_quantity")
  acceptedQuantity Int @map("accepted_quantity")
  rejectedQuantity Int @default(0) @map("rejected_quantity")

  // Pricing
  purchaseRate Decimal @map("purchase_rate") @db.Decimal(10, 2)
  mrp          Decimal @db.Decimal(10, 2)

  // Rejection
  rejectionReason String? @map("rejection_reason") @db.Text

  // Relations
  goodsReceipt GoodsReceipt @relation(fields: [goodsReceiptId], references: [id])

  @@map("goods_receipt_items")
}

model Supplier {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Supplier Details
  name        String @db.VarChar(255)
  contactName String? @map("contact_name") @db.VarChar(255)
  email       String? @db.VarChar(255)
  phone       String? @db.VarChar(20)

  // Address
  address String? @db.Text
  city    String? @db.VarChar(100)
  state   String? @db.VarChar(100)
  pincode String? @db.VarChar(10)

  // Tax
  gstin     String? @db.VarChar(20)
  drugLicense String? @map("drug_license") @db.VarChar(50)

  // Payment Terms
  paymentTerms Int @default(30) @map("payment_terms") // days
  creditLimit  Decimal? @map("credit_limit") @db.Decimal(12, 2)

  // Status
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  purchaseOrders PurchaseOrder[]

  @@index([tenantId])
  @@map("suppliers")
}

model Dispensing {
  id             String @id @default(uuid()) @db.Uuid
  tenantId       String @map("tenant_id") @db.Uuid
  branchId       String @map("branch_id") @db.Uuid
  prescriptionId String @map("prescription_id") @db.Uuid
  patientId      String @map("patient_id") @db.Uuid

  // Dispensing Details
  dispensingNumber String   @unique @map("dispensing_number") @db.VarChar(50)
  dispensedAt      DateTime @default(now()) @map("dispensed_at") @db.Timestamptz
  dispensedBy      String   @map("dispensed_by") @db.Uuid

  // Verification (for controlled substances)
  verifiedBy String? @map("verified_by") @db.Uuid
  verifiedAt DateTime? @map("verified_at") @db.Timestamptz

  // Notes
  notes String? @db.Text

  // Relations
  prescription Prescription     @relation(fields: [prescriptionId], references: [id])
  items        DispensingItem[]
  bill         Bill?

  @@index([tenantId, branchId])
  @@index([tenantId, prescriptionId])
  @@map("dispensings")
}

model DispensingItem {
  id           String @id @default(uuid()) @db.Uuid
  dispensingId String @map("dispensing_id") @db.Uuid
  drugId       String @map("drug_id") @db.Uuid

  // Quantity
  quantity Int

  // Batch (FIFO tracking)
  batchNumber String   @map("batch_number") @db.VarChar(100)
  expiryDate  DateTime @map("expiry_date") @db.Date

  // Pricing
  unitPrice  Decimal @map("unit_price") @db.Decimal(10, 2)
  totalPrice Decimal @map("total_price") @db.Decimal(10, 2)

  // Substitution
  isSubstitute   Boolean @default(false) @map("is_substitute")
  originalDrugId String? @map("original_drug_id") @db.Uuid

  // Relations
  dispensing Dispensing @relation(fields: [dispensingId], references: [id])

  @@map("dispensing_items")
}

model StockTransfer {
  id           String @id @default(uuid()) @db.Uuid
  tenantId     String @map("tenant_id") @db.Uuid
  fromBranchId String @map("from_branch_id") @db.Uuid
  toBranchId   String @map("to_branch_id") @db.Uuid

  // Transfer Details
  transferNumber String   @unique @map("transfer_number") @db.VarChar(50)
  transferDate   DateTime @default(now()) @map("transfer_date") @db.Date

  // Status
  status String @default("pending") @db.VarChar(20) // pending, approved, in_transit, received, cancelled

  // Notes
  notes String? @db.Text

  // Audit
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz
  createdBy  String    @map("created_by") @db.Uuid
  approvedAt DateTime? @map("approved_at") @db.Timestamptz
  approvedBy String?   @map("approved_by") @db.Uuid
  receivedAt DateTime? @map("received_at") @db.Timestamptz
  receivedBy String?   @map("received_by") @db.Uuid

  // Relations
  items StockTransferItem[]

  @@index([tenantId])
  @@map("stock_transfers")
}

model StockTransferItem {
  id              String @id @default(uuid()) @db.Uuid
  stockTransferId String @map("stock_transfer_id") @db.Uuid
  drugId          String @map("drug_id") @db.Uuid

  // Batch
  batchNumber String   @map("batch_number") @db.VarChar(100)
  expiryDate  DateTime @map("expiry_date") @db.Date

  // Quantity
  requestedQuantity Int @map("requested_quantity")
  sentQuantity      Int @default(0) @map("sent_quantity")
  receivedQuantity  Int @default(0) @map("received_quantity")

  // Relations
  stockTransfer StockTransfer @relation(fields: [stockTransferId], references: [id])

  @@map("stock_transfer_items")
}
```

---

## 7. IPD (Inpatient) Models

```prisma
enum AdmissionStatus {
  admitted
  discharged
  transferred
  dama // Discharge Against Medical Advice
  expired
}

model Admission {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  branchId  String @map("branch_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid

  // Admission Details
  admissionNumber String          @unique @map("admission_number") @db.VarChar(50)
  admissionDate   DateTime        @default(now()) @map("admission_date") @db.Timestamptz
  status          AdmissionStatus @default(admitted)

  // Attending
  attendingDoctorId String @map("attending_doctor_id") @db.Uuid
  referredBy        String? @map("referred_by") @db.VarChar(255)

  // Clinical
  admissionReason   String  @map("admission_reason") @db.Text
  provisionalDiagnosis String? @map("provisional_diagnosis") @db.Text
  finalDiagnosis    String? @map("final_diagnosis") @db.Text

  // Bed Assignment
  currentBedId String? @map("current_bed_id") @db.Uuid

  // Emergency Contact
  attendantName  String? @map("attendant_name") @db.VarChar(255)
  attendantPhone String? @map("attendant_phone") @db.VarChar(20)
  attendantRelation String? @map("attendant_relation") @db.VarChar(50)

  // Discharge
  dischargeDate    DateTime? @map("discharge_date") @db.Timestamptz
  dischargeType    String?   @map("discharge_type") @db.VarChar(50) // normal, dama, transfer, expired
  dischargeSummary String?   @map("discharge_summary") @db.Text
  dischargedBy     String?   @map("discharged_by") @db.Uuid

  // Follow-up
  followUpDate  DateTime? @map("follow_up_date") @db.Date
  followUpNotes String?   @map("follow_up_notes") @db.Text

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  createdBy String    @map("created_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  patient       Patient          @relation(fields: [patientId], references: [id])
  currentBed    Bed?             @relation("CurrentBed", fields: [currentBedId], references: [id])
  bedAssignments BedAssignment[]
  nursingNotes  NursingNote[]
  medicationAdmins MedicationAdmin[]
  bills         Bill[]

  @@index([tenantId, branchId])
  @@index([tenantId, patientId])
  @@index([tenantId, status])
  @@map("admissions")
}

model Ward {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid

  // Ward Details
  name        String @db.VarChar(100)
  code        String @db.VarChar(20)
  description String? @db.Text
  floor       Int?

  // Type
  wardType String @map("ward_type") @db.VarChar(50) // general, semi_private, private, icu, nicu, picu

  // Capacity
  totalBeds Int @default(0) @map("total_beds")

  // Pricing
  dailyRate Decimal @map("daily_rate") @db.Decimal(10, 2)

  // Status
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  beds Bed[]

  @@unique([tenantId, branchId, code])
  @@index([tenantId, branchId])
  @@map("wards")
}

model Bed {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid
  wardId   String @map("ward_id") @db.Uuid

  // Bed Details
  bedNumber String @map("bed_number") @db.VarChar(20)
  roomNumber String? @map("room_number") @db.VarChar(20)

  // Status
  status   String  @default("available") @db.VarChar(20) // available, occupied, maintenance, reserved
  isActive Boolean @default(true) @map("is_active")

  // Features
  hasOxygen    Boolean @default(false) @map("has_oxygen")
  hasMonitor   Boolean @default(false) @map("has_monitor")
  hasVentilator Boolean @default(false) @map("has_ventilator")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  ward           Ward            @relation(fields: [wardId], references: [id])
  branch         Branch          @relation(fields: [branchId], references: [id])
  currentAdmission Admission?    @relation("CurrentBed")
  assignments    BedAssignment[]

  @@unique([tenantId, branchId, wardId, bedNumber])
  @@index([tenantId, branchId, status])
  @@map("beds")
}

model BedAssignment {
  id          String @id @default(uuid()) @db.Uuid
  admissionId String @map("admission_id") @db.Uuid
  bedId       String @map("bed_id") @db.Uuid

  // Assignment Period
  assignedAt  DateTime  @default(now()) @map("assigned_at") @db.Timestamptz
  releasedAt  DateTime? @map("released_at") @db.Timestamptz

  // Reason for change
  transferReason String? @map("transfer_reason") @db.Text

  // Audit
  assignedBy String @map("assigned_by") @db.Uuid

  // Relations
  admission Admission @relation(fields: [admissionId], references: [id])
  bed       Bed       @relation(fields: [bedId], references: [id])

  @@index([admissionId])
  @@index([bedId])
  @@map("bed_assignments")
}

model NursingNote {
  id          String @id @default(uuid()) @db.Uuid
  tenantId    String @map("tenant_id") @db.Uuid
  admissionId String @map("admission_id") @db.Uuid

  // Note Details
  noteType String @map("note_type") @db.VarChar(50) // assessment, progress, handover, incident
  content  String @db.Text

  // Shift
  shift String? @db.VarChar(20) // morning, afternoon, night

  // Vitals (optional, can be linked)
  vitalId String? @map("vital_id") @db.Uuid

  // Audit
  recordedAt DateTime @default(now()) @map("recorded_at") @db.Timestamptz
  recordedBy String   @map("recorded_by") @db.Uuid

  // Relations
  admission Admission @relation(fields: [admissionId], references: [id])

  @@index([tenantId, admissionId])
  @@map("nursing_notes")
}

model MedicationAdmin {
  id          String @id @default(uuid()) @db.Uuid
  tenantId    String @map("tenant_id") @db.Uuid
  admissionId String @map("admission_id") @db.Uuid
  drugId      String @map("drug_id") @db.Uuid

  // Medication Details
  drugName String @map("drug_name") @db.VarChar(255)
  dosage   String @db.VarChar(100)
  route    String @db.VarChar(50) // oral, IV, IM, SC

  // Schedule
  scheduledAt DateTime @map("scheduled_at") @db.Timestamptz

  // Administration
  administeredAt DateTime? @map("administered_at") @db.Timestamptz
  administeredBy String?   @map("administered_by") @db.Uuid
  status         String    @default("scheduled") @db.VarChar(20) // scheduled, administered, missed, held, refused

  // Notes
  notes String? @db.Text

  // If not administered
  reasonNotGiven String? @map("reason_not_given") @db.Text

  // Relations
  admission Admission @relation(fields: [admissionId], references: [id])

  @@index([tenantId, admissionId])
  @@index([tenantId, scheduledAt])
  @@map("medication_admins")
}
```

---

## 8. Billing Models

```prisma
enum BillStatus {
  draft
  pending
  partial
  paid
  cancelled
  refunded
}

enum BillType {
  opd
  ipd
  pharmacy
  lab
  procedure
}

model Bill {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  branchId  String @map("branch_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid

  // Bill Details
  billNumber String     @unique @map("bill_number") @db.VarChar(50)
  billDate   DateTime   @default(now()) @map("bill_date") @db.Timestamptz
  billType   BillType   @map("bill_type")
  status     BillStatus @default(draft)

  // References
  appointmentId String? @unique @map("appointment_id") @db.Uuid
  admissionId   String? @map("admission_id") @db.Uuid
  labOrderId    String? @unique @map("lab_order_id") @db.Uuid
  dispensingId  String? @unique @map("dispensing_id") @db.Uuid

  // Amounts
  subtotal      Decimal @db.Decimal(12, 2)
  discountAmount Decimal @default(0) @map("discount_amount") @db.Decimal(10, 2)
  discountPercent Decimal? @map("discount_percent") @db.Decimal(5, 2)
  discountReason String?  @map("discount_reason") @db.Text

  // Tax
  taxableAmount Decimal @map("taxable_amount") @db.Decimal(12, 2)
  cgstAmount    Decimal @default(0) @map("cgst_amount") @db.Decimal(10, 2)
  sgstAmount    Decimal @default(0) @map("sgst_amount") @db.Decimal(10, 2)
  igstAmount    Decimal @default(0) @map("igst_amount") @db.Decimal(10, 2)
  totalTax      Decimal @map("total_tax") @db.Decimal(10, 2)

  // Final
  totalAmount   Decimal @map("total_amount") @db.Decimal(12, 2)
  paidAmount    Decimal @default(0) @map("paid_amount") @db.Decimal(12, 2)
  balanceAmount Decimal @default(0) @map("balance_amount") @db.Decimal(12, 2)

  // Insurance
  insuranceClaimId String? @map("insurance_claim_id") @db.Uuid
  insuranceAmount  Decimal? @map("insurance_amount") @db.Decimal(10, 2)

  // Notes
  notes String? @db.Text

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  createdBy String    @map("created_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz
  version   Int       @default(1)

  // Relations
  patient       Patient        @relation(fields: [patientId], references: [id])
  appointment   Appointment?   @relation(fields: [appointmentId], references: [id])
  admission     Admission?     @relation(fields: [admissionId], references: [id])
  labOrder      LabOrder?      @relation(fields: [labOrderId], references: [id])
  dispensing    Dispensing?    @relation(fields: [dispensingId], references: [id])
  items         BillItem[]
  payments      Payment[]
  creditNotes   CreditNote[]
  insuranceClaim InsuranceClaim? @relation(fields: [insuranceClaimId], references: [id])

  @@index([tenantId, branchId, billDate])
  @@index([tenantId, patientId])
  @@index([tenantId, status])
  @@map("bills")
}

model BillItem {
  id     String @id @default(uuid()) @db.Uuid
  billId String @map("bill_id") @db.Uuid

  // Item Details
  itemType    String @map("item_type") @db.VarChar(50) // consultation, service, drug, lab_test, bed_charge, procedure
  itemId      String? @map("item_id") @db.Uuid
  description String @db.VarChar(500)
  hsnSacCode  String? @map("hsn_sac_code") @db.VarChar(20)

  // Quantity & Pricing
  quantity  Int
  unitPrice Decimal @map("unit_price") @db.Decimal(10, 2)
  amount    Decimal @db.Decimal(10, 2)

  // Discount
  discountAmount  Decimal @default(0) @map("discount_amount") @db.Decimal(10, 2)
  discountPercent Decimal? @map("discount_percent") @db.Decimal(5, 2)

  // Tax
  gstRate    Decimal @map("gst_rate") @db.Decimal(4, 2)
  cgstAmount Decimal @default(0) @map("cgst_amount") @db.Decimal(10, 2)
  sgstAmount Decimal @default(0) @map("sgst_amount") @db.Decimal(10, 2)
  igstAmount Decimal @default(0) @map("igst_amount") @db.Decimal(10, 2)

  // Final
  totalAmount Decimal @map("total_amount") @db.Decimal(10, 2)

  // Relations
  bill Bill @relation(fields: [billId], references: [id])

  @@map("bill_items")
}

model Payment {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid
  billId   String @map("bill_id") @db.Uuid

  // Payment Details
  paymentNumber String   @unique @map("payment_number") @db.VarChar(50)
  paymentDate   DateTime @default(now()) @map("payment_date") @db.Timestamptz
  amount        Decimal  @db.Decimal(12, 2)

  // Method
  paymentMethod String @map("payment_method") @db.VarChar(50) // cash, card, upi, netbanking, insurance, wallet

  // Reference
  transactionRef String? @map("transaction_ref") @db.VarChar(100)
  cardLast4      String? @map("card_last_4") @db.VarChar(4)
  upiId          String? @map("upi_id") @db.VarChar(100)

  // Status
  status String @default("completed") @db.VarChar(20) // pending, completed, failed, refunded

  // Notes
  notes String? @db.Text

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  createdBy String   @map("created_by") @db.Uuid

  // Relations
  bill Bill @relation(fields: [billId], references: [id])

  @@index([tenantId, branchId, paymentDate])
  @@index([tenantId, billId])
  @@map("payments")
}

model CreditNote {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid
  billId   String @map("bill_id") @db.Uuid

  // Credit Note Details
  creditNoteNumber String   @unique @map("credit_note_number") @db.VarChar(50)
  creditNoteDate   DateTime @default(now()) @map("credit_note_date") @db.Timestamptz

  // Amounts
  amount     Decimal @db.Decimal(12, 2)
  cgstAmount Decimal @default(0) @map("cgst_amount") @db.Decimal(10, 2)
  sgstAmount Decimal @default(0) @map("sgst_amount") @db.Decimal(10, 2)
  igstAmount Decimal @default(0) @map("igst_amount") @db.Decimal(10, 2)
  totalAmount Decimal @map("total_amount") @db.Decimal(12, 2)

  // Reason
  reason String @db.Text

  // Refund
  refundMethod String?   @map("refund_method") @db.VarChar(50)
  refundedAt   DateTime? @map("refunded_at") @db.Timestamptz
  refundRef    String?   @map("refund_ref") @db.VarChar(100)

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  createdBy String   @map("created_by") @db.Uuid
  approvedAt DateTime? @map("approved_at") @db.Timestamptz
  approvedBy String?   @map("approved_by") @db.Uuid

  // Relations
  bill Bill @relation(fields: [billId], references: [id])

  @@index([tenantId, branchId])
  @@map("credit_notes")
}

model InsuranceClaim {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid

  // Claim Details
  claimNumber String   @unique @map("claim_number") @db.VarChar(50)
  claimDate   DateTime @default(now()) @map("claim_date") @db.Timestamptz

  // Insurance Details
  insuranceCompany String @map("insurance_company") @db.VarChar(255)
  policyNumber     String @map("policy_number") @db.VarChar(100)
  tpaName          String? @map("tpa_name") @db.VarChar(255)

  // Pre-authorization
  preAuthNumber String?   @map("pre_auth_number") @db.VarChar(100)
  preAuthAmount Decimal?  @map("pre_auth_amount") @db.Decimal(12, 2)
  preAuthDate   DateTime? @map("pre_auth_date") @db.Timestamptz

  // Claim Amounts
  claimedAmount  Decimal @map("claimed_amount") @db.Decimal(12, 2)
  approvedAmount Decimal? @map("approved_amount") @db.Decimal(12, 2)
  settledAmount  Decimal? @map("settled_amount") @db.Decimal(12, 2)
  deductionAmount Decimal? @map("deduction_amount") @db.Decimal(12, 2)
  deductionReason String?  @map("deduction_reason") @db.Text

  // Status
  status String @default("submitted") @db.VarChar(20) // draft, submitted, under_review, approved, rejected, settled

  // Documents
  documents Json @default("[]") // [{name, url, type}]

  // Notes
  notes String? @db.Text

  // Audit
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  submittedAt DateTime? @map("submitted_at") @db.Timestamptz
  settledAt  DateTime? @map("settled_at") @db.Timestamptz

  // Relations
  bills Bill[]

  @@index([tenantId, branchId])
  @@index([tenantId, status])
  @@map("insurance_claims")
}

model DayClosure {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String @map("branch_id") @db.Uuid

  // Closure Details
  closureDate DateTime @map("closure_date") @db.Date

  // Cash Summary
  openingCash    Decimal @map("opening_cash") @db.Decimal(12, 2)
  cashCollection Decimal @map("cash_collection") @db.Decimal(12, 2)
  cashExpenses   Decimal @map("cash_expenses") @db.Decimal(12, 2)
  expectedCash   Decimal @map("expected_cash") @db.Decimal(12, 2)
  actualCash     Decimal @map("actual_cash") @db.Decimal(12, 2)
  variance       Decimal @db.Decimal(12, 2)
  varianceReason String? @map("variance_reason") @db.Text

  // Other Collections
  cardCollection Decimal @default(0) @map("card_collection") @db.Decimal(12, 2)
  upiCollection  Decimal @default(0) @map("upi_collection") @db.Decimal(12, 2)
  otherCollection Decimal @default(0) @map("other_collection") @db.Decimal(12, 2)
  totalCollection Decimal @map("total_collection") @db.Decimal(12, 2)

  // Status
  status String @default("open") @db.VarChar(20) // open, closed, verified

  // Audit
  closedAt   DateTime? @map("closed_at") @db.Timestamptz
  closedBy   String?   @map("closed_by") @db.Uuid
  verifiedAt DateTime? @map("verified_at") @db.Timestamptz
  verifiedBy String?   @map("verified_by") @db.Uuid

  @@unique([tenantId, branchId, closureDate])
  @@index([tenantId, branchId])
  @@map("day_closures")
}
```

---

## 9. ABDM & Consent Models

```prisma
model PatientConsent {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid

  // Consent Details
  consentId     String   @unique @map("consent_id") @db.VarChar(100) // ABDM consent artifact ID
  consentType   String   @map("consent_type") @db.VarChar(50) // data_sharing, treatment, marketing
  purpose       String   @db.VarChar(100) // care_management, disease_specific, etc.

  // Requester
  requesterName String @map("requester_name") @db.VarChar(255)
  requesterId   String @map("requester_id") @db.VarChar(100) // HIP/HIU ID

  // Validity
  grantedAt DateTime  @default(now()) @map("granted_at") @db.Timestamptz
  expiresAt DateTime  @map("expires_at") @db.Timestamptz
  revokedAt DateTime? @map("revoked_at") @db.Timestamptz

  // Data Range
  dataFromDate DateTime? @map("data_from_date") @db.Date
  dataToDate   DateTime? @map("data_to_date") @db.Date

  // Health Information Types
  hiTypes String[] @default([]) @map("hi_types") // DiagnosticReport, Prescription, etc.

  // Status
  status String @default("active") @db.VarChar(20) // requested, active, expired, revoked, denied

  // ABDM Artifact
  consentArtifact Json? @map("consent_artifact")

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  patient Patient @relation(fields: [patientId], references: [id])

  @@index([tenantId, patientId])
  @@index([tenantId, status])
  @@map("patient_consents")
}

model HealthRecord {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  patientId String @map("patient_id") @db.Uuid

  // Record Details
  recordType String @map("record_type") @db.VarChar(50) // DiagnosticReport, Prescription, DischargeSummary, etc.
  recordId   String @map("record_id") @db.Uuid // Reference to actual record

  // FHIR Bundle
  fhirBundle Json @map("fhir_bundle")

  // ABDM Linking
  careContextId String? @map("care_context_id") @db.VarChar(100)
  linkedToAbdm  Boolean @default(false) @map("linked_to_abdm")
  linkedAt      DateTime? @map("linked_at") @db.Timestamptz

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, patientId])
  @@index([tenantId, recordType])
  @@map("health_records")
}

model AbdmTransaction {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Transaction Details
  transactionId String @unique @map("transaction_id") @db.VarChar(100)
  transactionType String @map("transaction_type") @db.VarChar(50) // consent_request, data_push, data_fetch

  // Request/Response
  requestPayload  Json? @map("request_payload")
  responsePayload Json? @map("response_payload")

  // Status
  status       String    @default("initiated") @db.VarChar(20) // initiated, processing, completed, failed
  errorCode    String?   @map("error_code") @db.VarChar(50)
  errorMessage String?   @map("error_message") @db.Text

  // Timing
  initiatedAt DateTime @default(now()) @map("initiated_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz

  @@index([tenantId, transactionType])
  @@index([tenantId, status])
  @@map("abdm_transactions")
}
```

---

## 10. Services & Procedures

```prisma
model Service {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Service Details
  code        String @db.VarChar(50)
  name        String @db.VarChar(255)
  description String? @db.Text
  category    String? @db.VarChar(100) // Consultation, Procedure, Diagnostic, etc.

  // Pricing
  basePrice Decimal @map("base_price") @db.Decimal(10, 2)
  gstRate   Decimal @default(18) @map("gst_rate") @db.Decimal(4, 2)
  sacCode   String? @map("sac_code") @db.VarChar(20)

  // Duration
  durationMinutes Int @default(30) @map("duration_minutes")

  // Department
  departmentId String? @map("department_id") @db.Uuid

  // Status
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  tenant        Tenant          @relation(fields: [tenantId], references: [id])
  branchPrices  ServiceBranchPrice[]

  @@unique([tenantId, code])
  @@index([tenantId, category])
  @@map("services")
}

model ServiceBranchPrice {
  id        String @id @default(uuid()) @db.Uuid
  serviceId String @map("service_id") @db.Uuid
  branchId  String @map("branch_id") @db.Uuid

  // Override Price
  price   Decimal @db.Decimal(10, 2)
  gstRate Decimal? @map("gst_rate") @db.Decimal(4, 2)

  // Status
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  service Service @relation(fields: [serviceId], references: [id])

  @@unique([serviceId, branchId])
  @@map("service_branch_prices")
}
```

---

## 11. Marketing & Communication

```prisma
model MessageTemplate {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Template Details
  code        String @db.VarChar(100)
  name        String @db.VarChar(255)
  description String? @db.Text
  category    String @db.VarChar(50) // appointment, billing, marketing, transactional

  // Channel
  channel String @db.VarChar(20) // whatsapp, sms, email

  // Content
  contentEn String @map("content_en") @db.Text
  contentHi String? @map("content_hi") @db.Text

  // Variables
  variables String[] @default([])

  // WhatsApp Template
  whatsappTemplateId String? @map("whatsapp_template_id") @db.VarChar(100)
  whatsappStatus     String? @map("whatsapp_status") @db.VarChar(20) // pending, approved, rejected

  // Status
  isActive Boolean @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz

  @@unique([tenantId, code])
  @@index([tenantId, category])
  @@map("message_templates")
}

model MessageLog {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String? @map("branch_id") @db.Uuid

  // Recipient
  recipientType String @map("recipient_type") @db.VarChar(20) // patient, staff
  recipientId   String @map("recipient_id") @db.Uuid
  recipientPhone String @map("recipient_phone") @db.VarChar(20)

  // Message Details
  channel    String @db.VarChar(20) // whatsapp, sms, email
  templateId String? @map("template_id") @db.Uuid
  content    String @db.Text

  // Status
  status       String    @default("queued") @db.VarChar(20) // queued, sent, delivered, read, failed
  sentAt       DateTime? @map("sent_at") @db.Timestamptz
  deliveredAt  DateTime? @map("delivered_at") @db.Timestamptz
  readAt       DateTime? @map("read_at") @db.Timestamptz
  failedAt     DateTime? @map("failed_at") @db.Timestamptz
  failureReason String?  @map("failure_reason") @db.Text

  // Provider Reference
  providerMessageId String? @map("provider_message_id") @db.VarChar(100)

  // Cost
  cost Decimal? @db.Decimal(6, 4)

  // Audit
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([tenantId, recipientId])
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
  @@map("message_logs")
}

model Campaign {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid

  // Campaign Details
  name        String @db.VarChar(255)
  description String? @db.Text
  type        String @db.VarChar(50) // one_time, recurring, trigger

  // Targeting
  segmentRules Json @default("{}") @map("segment_rules")
  targetCount  Int? @map("target_count")

  // Content
  templateId String @map("template_id") @db.Uuid
  channel    String @db.VarChar(20)

  // Schedule
  scheduledAt DateTime? @map("scheduled_at") @db.Timestamptz
  recurringSchedule Json? @map("recurring_schedule") // cron expression or schedule config

  // Trigger (for trigger campaigns)
  triggerEvent String? @map("trigger_event") @db.VarChar(50) // post_visit, birthday, no_show

  // Status
  status String @default("draft") @db.VarChar(20) // draft, scheduled, running, paused, completed, cancelled

  // Metrics
  sentCount      Int @default(0) @map("sent_count")
  deliveredCount Int @default(0) @map("delivered_count")
  readCount      Int @default(0) @map("read_count")
  failedCount    Int @default(0) @map("failed_count")

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  startedAt   DateTime? @map("started_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  createdBy   String    @map("created_by") @db.Uuid

  @@index([tenantId, status])
  @@map("campaigns")
}
```

---

## 12. Audit Log Model

```prisma
model AuditLog {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  branchId String? @map("branch_id") @db.Uuid
  userId   String? @map("user_id") @db.Uuid

  // Action Details
  action     String @db.VarChar(100) // create, update, delete, view, login, etc.
  entityType String @map("entity_type") @db.VarChar(50) // patient, bill, prescription, etc.
  entityId   String? @map("entity_id") @db.Uuid

  // Change Tracking
  oldValues Json? @map("old_values")
  newValues Json? @map("new_values")

  // Request Context
  ipAddress  String? @map("ip_address") @db.VarChar(45)
  userAgent  String? @map("user_agent") @db.Text
  requestId  String? @map("request_id") @db.VarChar(50)

  // Timestamp (immutable)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id])

  // Note: No updatedAt or deletedAt - audit logs are immutable

  @@index([tenantId, createdAt])
  @@index([tenantId, entityType, entityId])
  @@index([tenantId, userId, createdAt])
  @@index([tenantId, action])
  @@map("audit_logs")
}
```

---

## 13. Migration Patterns

### Initial Migration Setup

```bash
# Generate initial migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Best Practices

1. **Always use descriptive names**

```bash
npx prisma migrate dev --name add_patient_abha_fields
npx prisma migrate dev --name create_lab_orders_table
```

2. **Handle data migrations separately**

```typescript
// prisma/migrations/20260205_backfill_patient_status.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Backfill booking_status for existing patients
  await prisma.$executeRaw`
    UPDATE patients 
    SET booking_status = 'normal' 
    WHERE booking_status IS NULL
  `;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

3. **Add indexes for performance**

```prisma
// Always add indexes for:
// - Foreign keys
// - Frequently queried columns
// - Composite queries

@@index([tenantId, branchId, appointmentDate])
@@index([tenantId, status])
```

4. **Use transactions for complex migrations**

```sql
-- In migration SQL file
BEGIN;

ALTER TABLE patients ADD COLUMN booking_status VARCHAR(20);
UPDATE patients SET booking_status = 'normal';
ALTER TABLE patients ALTER COLUMN booking_status SET NOT NULL;

COMMIT;
```

### RLS Policy Migrations

```sql
-- migrations/20260205_enable_rls.sql

-- Enable RLS on all tenant-scoped tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_patients ON patients
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_appointments ON appointments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Branch-level policies where needed
CREATE POLICY branch_isolation_appointments ON appointments
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      current_setting('app.current_branch_id', true) IS NULL
      OR branch_id = current_setting('app.current_branch_id')::uuid
    )
  );
```

---

## 14. Seeding Patterns

### Seed Script Structure

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { seedRoles } from "./seed-data/roles";
import { seedDrugs } from "./seed-data/drugs";
import { seedLabTests } from "./seed-data/lab-tests";
import { seedServices } from "./seed-data/services";
import { seedMessageTemplates } from "./seed-data/templates";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Seed in order of dependencies
  await seedRoles(prisma);
  await seedDrugs(prisma);
  await seedLabTests(prisma);
  await seedServices(prisma);
  await seedMessageTemplates(prisma);

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### Example Seed Data

```typescript
// prisma/seed-data/drugs.ts
import { PrismaClient } from "@prisma/client";

export async function seedDrugs(prisma: PrismaClient) {
  const commonDrugs = [
    {
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      form: "tablet",
      strength: "500mg",
      category: "Analgesic",
      mrp: 25.0,
      gstRate: 12,
    },
    {
      name: "Amoxicillin 500mg",
      genericName: "Amoxicillin",
      form: "capsule",
      strength: "500mg",
      category: "Antibiotic",
      schedule: "H",
      mrp: 85.0,
      gstRate: 12,
    },
    // ... more drugs
  ];

  for (const drug of commonDrugs) {
    await prisma.drug.upsert({
      where: {
        tenantId_name: {
          tenantId: "system", // System-level drugs
          name: drug.name,
        },
      },
      update: drug,
      create: { ...drug, tenantId: "system" },
    });
  }

  console.log(`  ✓ Seeded ${commonDrugs.length} drugs`);
}
```

### Lab Tests Seed

```typescript
// prisma/seed-data/lab-tests.ts
export async function seedLabTests(prisma: PrismaClient) {
  const labTests = [
    {
      code: "CBC",
      name: "Complete Blood Count",
      category: "Hematology",
      sampleType: "blood",
      sampleVolume: "3ml",
      containerType: "EDTA",
      turnaroundHours: 4,
      price: 350,
      referenceRanges: [
        {
          parameter: "Hemoglobin",
          gender: "male",
          min: 13.5,
          max: 17.5,
          unit: "g/dL",
        },
        {
          parameter: "Hemoglobin",
          gender: "female",
          min: 12.0,
          max: 16.0,
          unit: "g/dL",
        },
        { parameter: "WBC", min: 4000, max: 11000, unit: "/mcL" },
        { parameter: "Platelets", min: 150000, max: 400000, unit: "/mcL" },
      ],
    },
    {
      code: "LFT",
      name: "Liver Function Test",
      category: "Biochemistry",
      sampleType: "blood",
      sampleVolume: "5ml",
      containerType: "Plain",
      turnaroundHours: 6,
      price: 650,
      isPanel: true,
    },
    // ... more tests
  ];

  // Seed logic...
}
```

### Message Templates Seed

```typescript
// prisma/seed-data/templates.ts
export async function seedMessageTemplates(prisma: PrismaClient) {
  const templates = [
    {
      code: "APPOINTMENT_REMINDER_24H",
      name: "Appointment Reminder (24 hours)",
      category: "appointment",
      channel: "whatsapp",
      contentEn:
        "Hi {{patient_name}}, this is a reminder for your appointment with Dr. {{doctor_name}} tomorrow at {{time}}. Reply YES to confirm or call us to reschedule.",
      contentHi:
        "नमस्ते {{patient_name}}, यह आपकी कल {{time}} बजे डॉ. {{doctor_name}} के साथ अपॉइंटमेंट की याद दिलाने के लिए है। पुष्टि के लिए YES लिखें या रीशेड्यूल के लिए कॉल करें।",
      variables: ["patient_name", "doctor_name", "time"],
    },
    {
      code: "LAB_RESULTS_READY",
      name: "Lab Results Ready",
      category: "transactional",
      channel: "whatsapp",
      contentEn:
        "Hi {{patient_name}}, your lab results for {{test_name}} are ready. You can view them in your patient portal or visit us to collect the report.",
      contentHi:
        "नमस्ते {{patient_name}}, आपकी {{test_name}} की रिपोर्ट तैयार है। आप इसे पेशेंट पोर्टल पर देख सकते हैं या रिपोर्ट लेने आ सकते हैं।",
      variables: ["patient_name", "test_name"],
    },
    // ... more templates
  ];

  // Seed logic...
}
```

---

## 15. Prisma Client Extensions

### Soft Delete Extension

```typescript
// lib/prisma-extensions.ts
import { Prisma, PrismaClient } from "@prisma/client";

export const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",
  model: {
    $allModels: {
      async softDelete<T>(this: T, where: Prisma.Args<T, "update">["where"]) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where,
          data: { deletedAt: new Date() },
        });
      },
      async findManyActive<T>(this: T, args?: Prisma.Args<T, "findMany">) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findMany({
          ...args,
          where: {
            ...args?.where,
            deletedAt: null,
          },
        });
      },
    },
  },
});
```

### Audit Extension

```typescript
// lib/prisma-audit.ts
export const auditExtension = Prisma.defineExtension({
  name: "audit",
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        const result = await query(args);

        // Log creation
        await auditLog({
          action: "create",
          entityType: model,
          entityId: result.id,
          newValues: result,
        });

        return result;
      },
      async update({ model, operation, args, query }) {
        // Get old values first
        const oldRecord = await (prisma as any)[model].findUnique({
          where: args.where,
        });

        const result = await query(args);

        // Log update
        await auditLog({
          action: "update",
          entityType: model,
          entityId: result.id,
          oldValues: oldRecord,
          newValues: result,
        });

        return result;
      },
    },
  },
});
```

### Usage

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { softDeleteExtension } from "./prisma-extensions";
import { auditExtension } from "./prisma-audit";

const basePrisma = new PrismaClient();

export const prisma = basePrisma
  .$extends(softDeleteExtension)
  .$extends(auditExtension);

export type ExtendedPrismaClient = typeof prisma;
```

---

## Summary

This database schema guide covers:

1. **Core Models**: Tenant, Branch, User, Patient
2. **Appointment & Queue**: Scheduling, doctor availability, walk-in queue
3. **Clinical**: Consultation, Vitals, Prescription, Drug interactions
4. **Laboratory**: Orders, Tests, Results, Samples
5. **Pharmacy & Inventory**: Stock, Purchase Orders, Dispensing, Transfers
6. **IPD**: Admissions, Wards, Beds, Nursing, Medication Administration
7. **Billing**: Bills, Payments, Credit Notes, Insurance Claims
8. **ABDM Integration**: Consent, Health Records, Transactions
9. **Services**: Service catalog with branch-level pricing
10. **Marketing**: Templates, Message Logs, Campaigns
11. **Audit**: Immutable audit logs for compliance

Key patterns:

- UUID primary keys
- Tenant/Branch scoping with RLS
- Soft deletes
- Optimistic locking
- Comprehensive indexing
- FHIR-ready health records
