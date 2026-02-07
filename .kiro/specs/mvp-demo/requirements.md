# MVP Demo - Frontend-Only "Wow Demo" for Clinic Owners

## Overview

Build a fully functional-looking demo of Hospital-Ops that showcases all advanced features with mocked data. The goal is to demonstrate the vision and differentiation to clinic owners, generating interest and validating product-market fit before investing in full backend development.

## Target Audience

- Small to medium clinic owners in India
- Decision makers evaluating clinic management software
- Demo will be shown in-person or via screen share

## Key Differentiators to Showcase

1. WhatsApp-first patient communication
2. AI ambient scribe for consultation documentation
3. Smart scheduling with no-show prediction
4. ABDM/ABHA integration readiness
5. Multi-branch support with shared patient data
6. Modern, intuitive UI (not legacy software feel)

## Technical Approach

- Frontend-only with localStorage/mock data
- No backend API calls (mock all responses)
- Realistic fake data that tells a story
- Smooth animations and transitions for "wow" moments
- Deployable to Vercel for easy sharing

---

## User Stories

### 1. Mock Data & Authentication

#### 1.1 Demo Login

As a demo presenter, I want to login with preset credentials so that I can quickly access the dashboard without real authentication.

**Acceptance Criteria:**

- Login works with hardcoded credentials (phone: 9876543210, password: demo123)
- Login bypasses API and uses mock auth store
- User sees realistic user profile after login
- Session persists in localStorage

#### 1.2 Mock Data Store

As a developer, I want a centralized mock data store so that all components show consistent, realistic data.

**Acceptance Criteria:**

- Mock data includes: 1 clinic, 2 branches, 3 doctors, 50+ patients, 100+ appointments
- Data relationships are consistent (appointments reference real patients/doctors)
- Data includes realistic Indian names, phone numbers, addresses
- Mock data is easily editable for demo customization

#### 1.3 Demo Reset

As a demo presenter, I want to reset the demo to initial state so that I can start fresh for each presentation.

**Acceptance Criteria:**

- Reset button in settings clears all localStorage changes
- Confirmation dialog before reset
- Demo returns to initial mock data state

---

### 2. Public Booking Portal

#### 2.1 Clinic Landing Page

As a patient, I want to see the clinic's booking page so that I can book an appointment online.

**Acceptance Criteria:**

- Shows clinic name, logo, address, contact info
- Displays list of doctors with photos, specializations, experience
- Shows clinic timings and available services
- Mobile-responsive design
- Professional, trustworthy appearance

#### 2.2 Doctor Selection

As a patient, I want to select a doctor so that I can book with my preferred physician.

**Acceptance Criteria:**

- Doctor cards show photo, name, specialization, experience, languages
- Shows next available slot for each doctor
- Filter by specialization
- Click to view doctor's full profile and availability

#### 2.3 Slot Selection

As a patient, I want to see available time slots so that I can pick a convenient time.

**Acceptance Criteria:**

- Calendar view showing next 7 days
- Time slots in 15/30 minute intervals (configurable per doctor)
- Clearly shows available vs booked slots
- Shows slot count remaining for busy days
- Smooth slot selection animation

#### 2.4 Patient Details Form

As a patient, I want to enter my details so that the clinic has my information.

**Acceptance Criteria:**

- Fields: Name, Phone, Email (optional), Gender, Age, Reason for visit
- Phone number validation (Indian format)
- Optional ABHA number field with "Verify" button
- Terms and conditions checkbox

#### 2.5 Booking Confirmation

As a patient, I want to see confirmation of my booking so that I know it's successful.

**Acceptance Criteria:**

- Success animation/confetti
- Booking details summary (doctor, date, time, token number)
- "Add to Calendar" button (generates .ics file)
- WhatsApp confirmation preview (simulated)
- Option to book another appointment

#### 2.6 WhatsApp Booking Simulation

As a demo presenter, I want to show WhatsApp booking flow so that clinic owners see the differentiation.

**Acceptance Criteria:**

- Simulated WhatsApp chat interface
- Shows patient sending "Book appointment"
- Bot responds with doctor options
- Patient selects and confirms
- Confirmation message with details
- All pre-scripted, plays like a demo video

---

### 3. Reception Dashboard

#### 3.1 Today's Queue View

As a receptionist, I want to see today's appointment queue so that I can manage patient flow.

**Acceptance Criteria:**

- List of today's appointments sorted by time
- Shows: Token #, Patient name, Doctor, Time, Status
- Status badges: Scheduled, Checked-in, In Consultation, Completed, No-show
- Quick actions: Check-in, Mark no-show, Reschedule
- Real-time feel (status updates animate)

#### 3.2 Patient Check-in

As a receptionist, I want to check in a patient so that the doctor knows they've arrived.

**Acceptance Criteria:**

- One-click check-in from queue
- Shows check-in time
- Patient moves to "Waiting" section
- Estimated wait time displayed
- Option to collect vitals during check-in

#### 3.3 Walk-in Registration

As a receptionist, I want to register walk-in patients so that they can be added to the queue.

**Acceptance Criteria:**

- Quick registration form (minimal fields)
- Auto-generates token number
- Assigns to next available slot or adds to walk-in queue
- Option to search existing patient by phone

#### 3.4 Patient Search

As a receptionist, I want to search for patients so that I can find their records quickly.

**Acceptance Criteria:**

- Search by name, phone, or ABHA number
- Shows recent patients for quick access
- Search results show basic info and last visit
- Click to view full patient profile

#### 3.5 Smart Alerts Panel

As a receptionist, I want to see smart alerts so that I can proactively manage issues.

**Acceptance Criteria:**

- "High no-show risk" warning on certain appointments (mocked prediction)
- "Running late" indicator when doctor is behind schedule
- "VIP patient" badge for returning patients
- "First visit" badge for new patients
- Alerts are visually prominent but not intrusive

---

### 4. Doctor Consultation Screen

#### 4.1 Patient Queue for Doctor

As a doctor, I want to see my patient queue so that I know who's waiting.

**Acceptance Criteria:**

- Shows only patients assigned to logged-in doctor
- Sorted by check-in time
- Shows wait time for each patient
- One-click to start consultation

#### 4.2 Consultation View

As a doctor, I want to see patient details during consultation so that I have context.

**Acceptance Criteria:**

- Patient demographics and photo
- Visit history (last 5 visits with diagnoses)
- Active medications
- Allergies (prominently displayed if any)
- Chronic conditions
- Vitals from current visit

#### 4.3 AI Ambient Scribe Demo

As a demo presenter, I want to show AI scribe in action so that doctors see the time-saving potential.

**Acceptance Criteria:**

- "Start Recording" button with microphone animation
- Simulated transcription appearing in real-time (pre-scripted)
- Text appears word-by-word with typing effect
- Auto-generates SOAP notes from transcription
- "AI Generated" badge on notes
- Edit capability for generated notes
- This is the "wow moment" - must be polished

#### 4.4 Prescription Writing

As a doctor, I want to write prescriptions so that patients get their medications.

**Acceptance Criteria:**

- Drug search with autocomplete (mock drug database)
- Shows generic alternatives
- Drug interaction alerts (mocked - show warning for demo)
- Dosage, frequency, duration fields
- Common prescription templates
- Add multiple medications
- Preview prescription format

#### 4.5 Diagnosis Entry

As a doctor, I want to record diagnosis so that it's part of the patient record.

**Acceptance Criteria:**

- ICD-10 code search with autocomplete
- Common diagnoses quick-select
- Primary and secondary diagnosis
- Clinical notes field
- Links to prescription

#### 4.6 Lab Order

As a doctor, I want to order lab tests so that I can get diagnostic information.

**Acceptance Criteria:**

- Test search with common panels
- Quick-select for frequent tests (CBC, LFT, etc.)
- Urgency selection
- Special instructions field
- Shows estimated cost (mocked)

#### 4.7 Complete Consultation

As a doctor, I want to complete the consultation so that the patient can proceed to billing.

**Acceptance Criteria:**

- Summary of consultation (diagnosis, prescription, labs)
- Follow-up scheduling option
- One-click complete
- Patient moves to "Completed" status
- Auto-triggers billing (mocked)

---

### 5. WhatsApp Communication Hub

#### 5.1 Message Templates Gallery

As a demo presenter, I want to show message templates so that clinic owners see communication capabilities.

**Acceptance Criteria:**

- Gallery of pre-approved templates
- Categories: Appointments, Reminders, Results, Marketing
- Preview in WhatsApp style
- Hindi and English versions
- Shows variable placeholders

#### 5.2 Simulated Patient Conversations

As a demo presenter, I want to show patient conversations so that the WhatsApp integration feels real.

**Acceptance Criteria:**

- Chat interface mimicking WhatsApp Web
- 3-4 pre-scripted conversations showing different scenarios
- Appointment booking conversation
- Prescription reminder conversation
- Lab results notification
- Messages appear with realistic timestamps

#### 5.3 Broadcast Campaign Demo

As a demo presenter, I want to show broadcast campaigns so that clinic owners see marketing potential.

**Acceptance Criteria:**

- Campaign creation interface
- Patient segment selection (by condition, last visit, etc.)
- Template selection
- Schedule options
- Preview of reach and estimated delivery
- "Send" shows success animation (mocked)

---

### 6. Analytics Dashboard

#### 6.1 Overview Metrics

As a clinic owner, I want to see key metrics so that I understand my clinic's performance.

**Acceptance Criteria:**

- Today's appointments (completed/total)
- Today's revenue
- Patient footfall trend (7 days)
- Average wait time
- All numbers are realistic mocked data
- Animated counters on load

#### 6.2 Revenue Analytics

As a clinic owner, I want to see revenue breakdown so that I understand income sources.

**Acceptance Criteria:**

- Revenue by service type (consultation, pharmacy, lab)
- Revenue by doctor
- Daily/weekly/monthly toggle
- Beautiful charts (Recharts)
- Comparison with previous period

#### 6.3 Appointment Analytics

As a clinic owner, I want to see appointment patterns so that I can optimize scheduling.

**Acceptance Criteria:**

- Appointments by day of week
- Peak hours heatmap
- No-show rate with trend
- Cancellation reasons breakdown
- Slot utilization percentage

#### 6.4 Patient Analytics

As a clinic owner, I want to see patient demographics so that I understand my patient base.

**Acceptance Criteria:**

- New vs returning patients
- Age distribution
- Gender distribution
- Top conditions treated
- Patient acquisition source (walk-in, online, referral)

---

### 7. ABDM/ABHA Integration Demo

#### 7.1 ABHA Verification Flow

As a demo presenter, I want to show ABHA verification so that clinic owners see compliance readiness.

**Acceptance Criteria:**

- ABHA number input field
- "Verify" button triggers simulated API call
- Loading state with ABDM logo
- Success shows patient details from "ABDM" (mocked)
- Demonstrates future-proofing for government mandates

#### 7.2 Health Records Sharing

As a demo presenter, I want to show health record sharing so that interoperability is demonstrated.

**Acceptance Criteria:**

- "Share with ABDM" button on patient records
- Consent request simulation
- Shows FHIR format preview (technical credibility)
- Success confirmation

---

### 8. Settings & Configuration

#### 8.1 Clinic Profile

As a clinic admin, I want to see clinic settings so that configuration options are visible.

**Acceptance Criteria:**

- Clinic name, logo, contact info (editable in demo)
- Branch list with details
- Working hours configuration
- Service list with pricing

#### 8.2 User Management Preview

As a demo presenter, I want to show user management so that multi-user capability is clear.

**Acceptance Criteria:**

- List of staff members with roles
- Role badges (Doctor, Nurse, Receptionist, etc.)
- "Add User" button (shows form, doesn't save)
- Permission matrix preview

#### 8.3 Demo Mode Indicator

As a demo presenter, I want a clear demo mode indicator so that viewers know it's a demo.

**Acceptance Criteria:**

- Subtle "Demo Mode" badge in header
- Tooltip explaining mock data
- Link to reset demo
- Does not distract from main demo

---

## Non-Functional Requirements

### Performance

- Page load under 2 seconds
- Smooth animations (60fps)
- No loading spinners for mock data (instant feel)

### Design

- Modern, clean UI (not cluttered)
- Consistent with shadcn/ui components
- Mobile-responsive (tablet priority for clinic use)
- Professional color scheme (healthcare appropriate)

### Demo Experience

- Guided demo flow option (tooltips pointing to features)
- Keyboard shortcuts for quick navigation during demo
- No error states visible (everything works in demo)

---

## Out of Scope for MVP

- Real backend API integration
- Real WhatsApp Business API
- Real ABDM/ABHA API calls
- Payment processing
- Real AI/ML models
- Multi-tenant data isolation
- User authentication security
- Data persistence beyond localStorage
- Email notifications
- SMS integration
- Pharmacy inventory management
- Lab result entry
- IPD (inpatient) management
- Billing and invoicing details
- Report generation/export
