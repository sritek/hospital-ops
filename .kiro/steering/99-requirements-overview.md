# Hospital-Ops Requirements Overview

This document provides a high-level overview of all 15 modules in the Hospital & Clinic Management Software.

## System Overview

A multi-tenant SaaS platform enabling healthcare facilities to manage operations, patients, staff, and finances. Supports multi-branch facilities with shared patient data and ABDM compliance.

## Module Summaries

### Module 1: Tenant & Facility Management

Core multi-tenancy foundation with facility registration, branch management, and RBAC.

**Key Requirements:**

- Self-service registration with 30-day free trial
- Eight roles: super_admin, branch_admin, doctor, nurse, receptionist, pharmacist, lab_tech, accountant
- Each user has exactly one role per facility
- Staff can be assigned to multiple branches
- Health Facility Registry (HFR) integration for ABDM
- Two-factor authentication for admin roles

### Module 2: Patient Registration & Health Records

Patient profiles with ABHA integration, EHR, and consent management.

**Key Requirements:**

- ABHA verification via Aadhaar OTP, mobile OTP, or demographic match
- Patient demographics with photo capture
- Duplicate detection by phone/ABHA
- EHR with FHIR R4 format for ABDM interoperability
- Voice-to-text support for clinical notes
- Consent management for record sharing

### Module 3: Appointment Management

Scheduling system supporting online, phone, walk-in, and WhatsApp bookings.

**Key Requirements:**

- Booking via web portal, mobile app, or WhatsApp chatbot
- No double-booking - strict conflict prevention
- Slot locking during booking flow (5 minutes)
- Walk-in queue with token system
- Maximum 3 reschedules per appointment
- No-show policy: 1st warning, 2nd prepaid-only, 3rd blocked
- Reminders at 24 hours and 2 hours before

### Module 4: OPD Clinical Workflow

Consultations, prescriptions, and clinical documentation.

**Key Requirements:**

- Consultation screen with patient history, vitals, allergies
- ICD-10/ICD-11 diagnosis codes with search
- AI-powered ambient scribe for documentation
- Drug database with interaction alerts
- E-prescription in standard format
- Prescription templates for frequent medications
- Controlled substance tracking

### Module 5: IPD Management

Inpatient admissions, bed management, nursing, and discharge.

**Key Requirements:**

- Real-time bed availability dashboard by ward/room type
- Bed assignment with room type selection
- Nursing notes with shift handover
- Medication Administration Record (MAR)
- Discharge summary auto-generation
- DAMA (Discharge Against Medical Advice) workflow
- Post-discharge follow-up automation

### Module 6: Laboratory & Diagnostics

Lab orders, results, and external lab integration.

**Key Requirements:**

- Lab test catalog with panels/profiles
- Orders via HL7/FHIR to lab systems
- Sample tracking with barcode/QR
- Abnormal value highlighting
- Critical result notifications
- External lab integration with commission tracking
- Results linked to ABDM

### Module 7: Pharmacy & Inventory

Medication dispensing, stock management, and expiry tracking.

**Key Requirements:**

- Prescriptions appear in pharmacy queue
- FIFO for dispensing
- Generic substitutes for out-of-stock items
- Batch and expiry tracking
- Low stock and expiry alerts (90/60/30 days)
- ABC/VED analysis
- Inter-branch stock transfer
- Controlled substance verification

### Module 8: Billing & Financial Management

Invoicing, GST, insurance, and payment gateway.

**Key Requirements:**

- Auto-billing from consultations, procedures, labs, pharmacy
- GST calculations (CGST+SGST or IGST)
- Multiple payment modes (cash, card, UPI, insurance)
- Partial payments with balance tracking
- Insurance pre-authorization and claim submission
- TPA-specific formats (Vidal, Medi Assist)
- Day-end cash reconciliation
- 7-year billing audit retention

### Module 9: Staff Management

Attendance, shifts, credentials, and payroll.

**Key Requirements:**

- Staff profiles with qualifications and registration numbers
- Healthcare Professional Registry (HPR) linking
- Credential expiry alerts
- Clock in/out with geo-location
- Shift scheduling with rotation
- Leave management
- Attendance-based payroll
- TDS and statutory compliance (PF, ESI)

### Module 10: WhatsApp Communication Hub

Business API integration, chatbot, and automated messaging.

**Key Requirements:**

- WhatsApp Business API with verified number
- Pre-approved message templates
- Two-way messaging with patient responses
- Chatbot for booking, rescheduling, cancellation
- Hindi and English language support
- Opt-in/opt-out management
- Message delivery tracking

### Module 11: AI & Clinical Intelligence

Decision support, ambient scribe, and predictive analytics.

**Key Requirements:**

- AI diagnosis suggestions based on symptoms
- Drug interaction alerts (AI-enhanced)
- Ambient scribe for consultation documentation
- SOAP notes generation from voice
- Readmission risk prediction
- No-show prediction
- Demand forecasting for staffing/inventory
- AI suggestions marked as assistive, not prescriptive

### Module 12: Reports & Analytics

Dashboards, operational metrics, and compliance reports.

**Key Requirements:**

- Daily/weekly/monthly patient footfall trends
- Revenue analytics by service, doctor, department
- Appointment utilization and no-show rates
- Wait time analytics
- Bed occupancy and turnover rates
- GST reports (GSTR-1, GSTR-3B)
- ABDM compliance dashboard
- Export to PDF and Excel

### Module 13: Telemedicine

Video consultations and e-prescriptions.

**Key Requirements:**

- Video consultation booking like regular appointments
- Secure video link via WhatsApp
- EHR access during video consultation
- Adaptive video quality
- Patient identity verification
- NMC 2020 telemedicine guidelines compliance
- Telemedicine-marked prescriptions
- Optional consultation recording with consent

### Module 14: Marketing & Engagement

Campaigns, health reminders, and patient engagement.

**Key Requirements:**

- Patient segmentation by demographics, conditions
- Campaign types: one-time, recurring, trigger-based
- WhatsApp primary, SMS fallback
- Throttling: daily and weekly limits
- Birthday and anniversary greetings
- Annual health checkup reminders
- Vaccination reminders
- Medication refill reminders

### Module 15: Online Booking Portal

Public booking page with prepayment and fraud protection.

**Key Requirements:**

- Unique booking URL per facility
- Real-time availability sync
- Doctor profiles with specialization
- Slot locking during booking (5 minutes)
- Prepayment modes: none, optional, required
- Mandatory prepayment for no-show flagged patients
- Rate limiting and blacklist for fraud
- Lead capture for abandoned bookings

---

## Cross-Cutting Concerns

### ABDM Integration

- ABHA ID verification and creation
- Health Facility Registry (HFR) registration
- Healthcare Professional Registry (HPR) linking
- Health Information Provider (HIP) certification
- Consent management per ABDM protocols
- FHIR R4 data format

### Multi-Language (i18n)

- English (en-IN) and Hindi (hi-IN) supported
- Message templates in both languages
- Indian date format: DD/MM/YYYY
- Indian currency format: ₹X,XX,XXX
- 12-hour time with AM/PM

### Security & Isolation

- Row-Level Security (RLS) for tenant isolation
- Branch-level scoping where applicable
- Soft deletes with tenant scope
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- Two-factor authentication for admins

### Audit & Compliance

- All sensitive actions logged
- Price changes, discounts, refunds tracked
- Audit logs retained minimum 7 years (medical)
- Audit logs are read-only
- DPDP Act 2023 compliance

---

## Key Business Rules

### Patients

- Phone number is unique identifier per tenant
- ABHA number unique per tenant (if provided)
- Guest registration allowed for emergencies
- Consent required before sharing records

### Appointments

- No double-booking ever
- Buffer time between appointments (configurable)
- Walk-ins get token numbers
- No-show impacts future booking ability

### Prescriptions

- Drug interaction alerts mandatory
- Controlled substances flagged and logged
- Prescription linked to patient EHR
- E-prescription format compliance

### Billing

- Full or partial payment supported
- GST calculated based on branch config
- Insurance claims follow TPA formats
- Credit notes for refunds (GST compliance)

### Inventory

- FIFO always for dispensing
- Stock deducted at dispensing, not prescription
- Expired stock blocked from dispensing
- Batch tracking mandatory

### Clinical

- ICD-10/ICD-11 codes for diagnosis
- Vitals captured pre-consultation
- AI suggestions are assistive only
- Doctor reviews all AI-generated content
