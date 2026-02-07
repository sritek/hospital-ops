# MVP Demo - Implementation Tasks

## Phase 1: Foundation & Mock Data (Days 1-2)

### 1. Mock Data Layer

- [x] 1.1 Create mock data directory structure (`apps/web/src/lib/mock-data/`)
- [x] 1.2 Create clinic and branches mock data (`clinic.ts`)
- [x] 1.3 Create doctors mock data with realistic profiles (`doctors.ts`)
- [x] 1.4 Create patients mock data (50+ patients with varied demographics) (`patients.ts`)
- [x] 1.5 Create appointments mock data for today and upcoming week (`appointments.ts`)
- [x] 1.6 Create drugs database mock (100+ common drugs) (`drugs.ts`)
- [x] 1.7 Create WhatsApp templates mock (`whatsapp-templates.ts`)
- [x] 1.8 Create mock API layer with simulated delays (`mock-api.ts`)

### 2. Auth & Demo Mode

- [x] 2.1 Update auth store for mock authentication
- [x] 2.2 Create demo store for tracking demo state
- [x] 2.3 Update login page to use mock auth (credentials: 9876543210/demo123)
- [x] 2.4 Add demo mode indicator badge to header
- [ ] 2.5 Implement demo reset functionality

### 3. Core Stores

- [x] 3.1 Create appointments store with CRUD operations
- [x] 3.2 Create patients store with search and filter
- [ ] 3.3 Create consultation store for active consultation state
- [ ] 3.4 Wire stores to localStorage persistence

---

## Phase 2: Dashboard & Queue Management (Days 3-4)

### 4. Dashboard Overview

- [x] 4.1 Update dashboard page with animated metric cards
- [x] 4.2 Add today's appointments summary widget
- [x] 4.3 Add recent activity feed (mock data)
- [x] 4.4 Add quick action buttons (new appointment, walk-in, etc.)

### 5. Appointments Queue

- [x] 5.1 Create appointments page layout
- [x] 5.2 Build queue list component with status badges
- [x] 5.3 Build appointment card component with patient info
- [x] 5.4 Implement check-in functionality with animation
- [x] 5.5 Implement status transitions (scheduled → checked-in → in-consultation → completed)
- [x] 5.6 Add smart alerts panel (no-show risk, VIP, first visit badges)
- [ ] 5.7 Build walk-in registration form
- [x] 5.8 Add patient search in queue view

### 6. Navigation & Layout

- [x] 6.1 Update sidebar with new navigation items
- [x] 6.2 Add role-based menu visibility (doctor vs receptionist view)
- [ ] 6.3 Implement branch selector in header
- [ ] 6.4 Add keyboard shortcuts for common actions

---

## Phase 3: Patient Management (Day 5)

### 7. Patient List

- [x] 7.1 Create patients list page with table/card view toggle
- [x] 7.2 Implement patient search (name, phone, ABHA)
- [ ] 7.3 Add filters (by condition, last visit, etc.)
- [x] 7.4 Build patient card component with key info

### 8. Patient Profile

- [x] 8.1 Create patient profile page layout
- [x] 8.2 Build demographics section
- [x] 8.3 Build visit history timeline
- [ ] 8.4 Build active medications section
- [x] 8.5 Build allergies and conditions section
- [ ] 8.6 Add ABHA verification demo flow

---

## Phase 4: Doctor Consultation (Days 6-7) - THE WOW FEATURES

### 9. Consultation View

- [x] 9.1 Create consultation page layout (split view: patient info | consultation form)
- [x] 9.2 Build patient summary sidebar (demographics, history, allergies)
- [x] 9.3 Build vitals entry section
- [x] 9.4 Build chief complaint and history section

### 10. AI Ambient Scribe (Key Differentiator)

- [x] 10.1 Build AI scribe component with microphone UI
- [x] 10.2 Implement recording animation (pulsing mic, waveform)
- [x] 10.3 Implement typing effect for transcription playback
- [x] 10.4 Build SOAP notes generation with "AI Generated" badge
- [x] 10.5 Make generated notes editable
- [x] 10.6 Add "wow" polish (smooth animations, professional feel)

### 11. Prescription Writing

- [x] 11.1 Build prescription form with drug search
- [x] 11.2 Implement drug autocomplete from mock database
- [x] 11.3 Add drug interaction alert demo (show warning for specific combo)
- [x] 11.4 Build dosage/frequency/duration inputs
- [x] 11.5 Add prescription templates quick-select
- [x] 11.6 Build prescription preview

### 12. Diagnosis & Lab Orders

- [x] 12.1 Build diagnosis form with ICD-10 search
- [x] 12.2 Add common diagnoses quick-select
- [x] 12.3 Build lab order form with test search
- [x] 12.4 Add common panels quick-select (CBC, LFT, etc.)

### 13. Consultation Completion

- [x] 13.1 Build consultation summary view
- [x] 13.2 Add follow-up scheduling option
- [x] 13.3 Implement complete consultation flow
- [x] 13.4 Show success animation on completion

---

## Phase 5: WhatsApp Hub (Day 8)

### 14. WhatsApp Communication

- [x] 14.1 Create WhatsApp hub page layout
- [x] 14.2 Build chat interface component (WhatsApp-style)
- [x] 14.3 Build message bubble component
- [x] 14.4 Implement pre-scripted booking conversation demo
- [x] 14.5 Implement pre-scripted reminder conversation demo
- [x] 14.6 Build template gallery with preview
- [x] 14.7 Build campaign creation form (mock)
- [x] 14.8 Add Hindi/English toggle for templates

---

## Phase 6: Public Booking Portal (Day 9)

### 15. Booking Landing Page

- [x] 15.1 Update booking app landing page with clinic branding
- [x] 15.2 Build doctor cards with photo, specialization, next available
- [x] 15.3 Add specialization filter
- [x] 15.4 Make mobile-responsive

### 16. Slot Selection

- [x] 16.1 Build doctor profile page with full details
- [x] 16.2 Build 7-day calendar slot picker
- [x] 16.3 Implement slot availability visualization
- [x] 16.4 Add slot selection animation

### 17. Booking Flow

- [x] 17.1 Build patient details form
- [x] 17.2 Add ABHA number field with verify button (mock)
- [x] 17.3 Build booking confirmation page with confetti
- [x] 17.4 Add "Add to Calendar" functionality
- [x] 17.5 Show WhatsApp confirmation preview

---

## Phase 7: Analytics & Settings (Day 10)

### 18. Analytics Dashboard

- [x] 18.1 Create analytics page layout
- [x] 18.2 Build animated metric cards
- [x] 18.3 Build revenue chart (by service, by doctor)
- [x] 18.4 Build appointment analytics (by day, peak hours heatmap)
- [x] 18.5 Build patient demographics charts
- [x] 18.6 Add date range selector

### 19. Settings

- [x] 19.1 Build clinic profile settings page
- [x] 19.2 Build user management preview (list of staff)
- [x] 19.3 Add demo reset button with confirmation
- [x] 19.4 Add branch management preview

---

## Phase 8: Polish & Deploy (Days 11-12)

### 20. UI Polish

- [x] 20.1 Review and fix responsive issues
- [x] 20.2 Add loading skeletons where needed
- [x] 20.3 Ensure consistent animations throughout
- [x] 20.4 Add empty states for all lists
- [x] 20.5 Review color consistency and accessibility

### 21. Demo Experience

- [x] 21.1 Create demo script document
- [ ] 21.2 Add guided tour tooltips (optional)
- [x] 21.3 Test complete demo flow end-to-end
- [x] 21.4 Fix any broken flows or dead ends

### 22. Deployment

- [ ] 22.1 Configure Vercel deployment
- [ ] 22.2 Set up environment variables
- [ ] 22.3 Deploy and test on production URL
- [ ] 22.4 Test on mobile devices
- [ ] 22.5 Share demo URL for feedback

---

## Optional Enhancements (If Time Permits)

### 23. Extra Polish

- [ ]\* 23.1 Add dark mode toggle
- [ ]\* 23.2 Add sound effects for key actions
- [ ]\* 23.3 Add more WhatsApp conversation scenarios
- [ ]\* 23.4 Add print prescription functionality
- [ ]\* 23.5 Add more detailed patient history mock data
