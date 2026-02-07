# MVP Demo - Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App (apps/web)                   │
├─────────────────────────────────────────────────────────────┤
│  Pages/Routes                                               │
│  ├── (auth)/login                                          │
│  ├── (dashboard)/                                          │
│  │   ├── dashboard (overview)                              │
│  │   ├── appointments (queue management)                   │
│  │   ├── patients (patient list & profiles)                │
│  │   ├── consultation/[id] (doctor view)                   │
│  │   ├── whatsapp (communication hub)                      │
│  │   ├── analytics (charts & metrics)                      │
│  │   └── settings                                          │
│  └── booking/[tenant] (public booking - apps/booking)      │
├─────────────────────────────────────────────────────────────┤
│  State Management                                           │
│  ├── Zustand stores (auth, appointments, patients, etc.)   │
│  └── localStorage persistence                              │
├─────────────────────────────────────────────────────────────┤
│  Mock Data Layer                                            │
│  ├── /src/lib/mock-data/ (static data files)               │
│  ├── /src/lib/mock-api.ts (simulated API responses)        │
│  └── /src/lib/demo-utils.ts (demo helpers)                 │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx (update for mock auth)
│   ├── (dashboard)/
│   │   ├── layout.tsx (sidebar, header)
│   │   ├── dashboard/page.tsx (overview metrics)
│   │   ├── appointments/
│   │   │   └── page.tsx (queue management)
│   │   ├── patients/
│   │   │   ├── page.tsx (patient list)
│   │   │   └── [id]/page.tsx (patient profile)
│   │   ├── consultation/
│   │   │   └── [id]/page.tsx (doctor consultation view)
│   │   ├── whatsapp/
│   │   │   └── page.tsx (communication hub)
│   │   ├── analytics/
│   │   │   └── page.tsx (charts dashboard)
│   │   └── settings/
│   │       └── page.tsx (clinic settings)
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components - existing)
│   ├── dashboard/
│   │   ├── sidebar.tsx (update with new nav)
│   │   ├── header.tsx
│   │   └── demo-badge.tsx
│   ├── appointments/
│   │   ├── queue-list.tsx
│   │   ├── appointment-card.tsx
│   │   ├── check-in-dialog.tsx
│   │   └── walk-in-form.tsx
│   ├── patients/
│   │   ├── patient-list.tsx
│   │   ├── patient-card.tsx
│   │   ├── patient-profile.tsx
│   │   └── patient-search.tsx
│   ├── consultation/
│   │   ├── patient-summary.tsx
│   │   ├── ai-scribe.tsx (the wow feature)
│   │   ├── prescription-form.tsx
│   │   ├── diagnosis-form.tsx
│   │   └── lab-order-form.tsx
│   ├── whatsapp/
│   │   ├── chat-interface.tsx
│   │   ├── message-bubble.tsx
│   │   ├── template-gallery.tsx
│   │   └── campaign-form.tsx
│   ├── analytics/
│   │   ├── metric-card.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── appointment-chart.tsx
│   │   └── patient-chart.tsx
│   └── booking/
│       ├── doctor-card.tsx
│       ├── slot-picker.tsx
│       ├── booking-form.tsx
│       └── confirmation.tsx
├── lib/
│   ├── mock-data/
│   │   ├── clinic.ts
│   │   ├── doctors.ts
│   │   ├── patients.ts
│   │   ├── appointments.ts
│   │   ├── prescriptions.ts
│   │   ├── drugs.ts
│   │   └── whatsapp-templates.ts
│   ├── mock-api.ts
│   ├── demo-utils.ts
│   └── utils.ts (existing)
├── stores/
│   ├── auth.store.ts (update for mock)
│   ├── appointments.store.ts
│   ├── patients.store.ts
│   └── demo.store.ts
└── hooks/
    ├── use-auth.ts (update for mock)
    ├── use-appointments.ts
    ├── use-patients.ts
    └── use-demo.ts
```

## Mock Data Schema

### Clinic Data

```typescript
// lib/mock-data/clinic.ts
export const mockClinic = {
  id: 'clinic-001',
  name: 'HealthFirst Multi-Specialty Clinic',
  slug: 'healthfirst',
  logo: '/images/clinic-logo.png',
  email: 'contact@healthfirst.in',
  phone: '011-4567890',
  address: '123, MG Road, Sector 18',
  city: 'Noida',
  state: 'Uttar Pradesh',
  pincode: '201301',
  gstin: '09AAACH1234A1Z5',
  hfrId: 'IN2710000001', // Mock ABDM HFR ID
  workingHours: {
    monday: { open: '09:00', close: '21:00' },
    // ... other days
  },
  branches: [
    {
      id: 'branch-001',
      name: 'Main Branch - Sector 18',
      code: 'HF-S18',
      address: '123, MG Road, Sector 18, Noida',
      phone: '011-4567890',
      isActive: true,
    },
    {
      id: 'branch-002',
      name: 'Sector 62 Branch',
      code: 'HF-S62',
      address: '456, Institutional Area, Sector 62, Noida',
      phone: '011-4567891',
      isActive: true,
    },
  ],
};
```

### Doctors Data

```typescript
// lib/mock-data/doctors.ts
export const mockDoctors = [
  {
    id: 'doc-001',
    name: 'Dr. Priya Sharma',
    phone: '9876543211',
    email: 'priya.sharma@healthfirst.in',
    gender: 'female',
    photo: '/images/doctors/priya-sharma.jpg',
    specialization: 'General Physician',
    qualification: 'MBBS, MD (Medicine)',
    experience: 12,
    registrationNumber: 'DMC-12345',
    registrationCouncil: 'Delhi Medical Council',
    hprId: 'HP2710000001',
    languages: ['English', 'Hindi'],
    consultationFee: 500,
    slotDuration: 15, // minutes
    branchIds: ['branch-001', 'branch-002'],
    availability: {
      monday: [
        { start: '10:00', end: '14:00' },
        { start: '17:00', end: '20:00' },
      ],
      // ... other days
    },
  },
  {
    id: 'doc-002',
    name: 'Dr. Rajesh Kumar',
    specialization: 'Pediatrician',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    experience: 15,
    consultationFee: 600,
    // ... similar structure
  },
  {
    id: 'doc-003',
    name: 'Dr. Anita Desai',
    specialization: 'Gynecologist',
    qualification: 'MBBS, MS (OBG), DNB',
    experience: 18,
    consultationFee: 700,
    // ... similar structure
  },
];
```

### Patients Data

```typescript
// lib/mock-data/patients.ts
export const mockPatients = [
  {
    id: 'pat-001',
    name: 'Amit Verma',
    phone: '9876500001',
    email: 'amit.verma@email.com',
    gender: 'male',
    dateOfBirth: '1985-03-15',
    age: 40,
    photo: '/images/patients/male-1.jpg',
    address: '45, Sector 22, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    abhaNumber: '91-1234-5678-9012',
    emergencyContact: {
      name: 'Sunita Verma',
      phone: '9876500002',
      relation: 'Spouse',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2023-06-15',
    lastVisitDate: '2025-02-01',
    totalVisits: 12,
    preferredLanguage: 'hi',
  },
  // ... 50+ more patients with varied data
];
```

### Appointments Data

```typescript
// lib/mock-data/appointments.ts
export const mockAppointments = [
  {
    id: 'apt-001',
    patientId: 'pat-001',
    doctorId: 'doc-001',
    branchId: 'branch-001',
    date: '2026-02-07', // Today
    time: '10:00',
    endTime: '10:15',
    tokenNumber: 1,
    type: 'scheduled', // scheduled, walk-in, follow-up
    status: 'checked-in', // scheduled, checked-in, in-consultation, completed, no-show, cancelled
    checkedInAt: '2026-02-07T09:45:00',
    reason: 'Follow-up for diabetes management',
    noShowRisk: 'low', // low, medium, high (AI prediction mock)
    isFirstVisit: false,
    isVip: true, // returning patient
    source: 'online', // online, walk-in, phone, whatsapp
    createdAt: '2026-02-05T14:30:00',
  },
  // ... more appointments for today and upcoming days
];
```

### Drugs Database (Mock)

```typescript
// lib/mock-data/drugs.ts
export const mockDrugs = [
  {
    id: 'drug-001',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    brand: 'Glycomet',
    manufacturer: 'USV',
    category: 'Antidiabetic',
    forms: ['Tablet'],
    strengths: ['500mg', '850mg', '1000mg'],
    schedule: 'H', // H, H1, X
    interactions: ['drug-010'], // IDs of interacting drugs
    contraindications: ['Renal impairment', 'Hepatic impairment'],
  },
  // ... 100+ common drugs
];

export const mockDrugInteractions = [
  {
    drug1Id: 'drug-001',
    drug2Id: 'drug-010',
    severity: 'moderate', // mild, moderate, severe
    description: 'May increase risk of lactic acidosis when combined with contrast agents',
  },
];
```

### WhatsApp Templates

```typescript
// lib/mock-data/whatsapp-templates.ts
export const mockWhatsAppTemplates = [
  {
    id: 'tpl-001',
    name: 'appointment_confirmation',
    category: 'appointments',
    contentEn:
      'Hi {{patient_name}}, your appointment with {{doctor_name}} is confirmed for {{date}} at {{time}}. Token: {{token}}. Reply CANCEL to cancel.',
    contentHi:
      'नमस्ते {{patient_name}}, {{doctor_name}} के साथ आपकी अपॉइंटमेंट {{date}} को {{time}} पर कन्फर्म है। टोकन: {{token}}। रद्द करने के लिए CANCEL लिखें।',
    variables: ['patient_name', 'doctor_name', 'date', 'time', 'token'],
  },
  {
    id: 'tpl-002',
    name: 'appointment_reminder_24h',
    category: 'reminders',
    contentEn:
      'Reminder: Your appointment with {{doctor_name}} is tomorrow at {{time}}. Please arrive 15 mins early. Reply RESCHEDULE to change.',
    contentHi:
      'रिमाइंडर: {{doctor_name}} के साथ आपकी अपॉइंटमेंट कल {{time}} पर है। कृपया 15 मिनट पहले पहुंचें।',
    variables: ['doctor_name', 'time'],
  },
  // ... more templates
];
```

## Component Specifications

### AI Scribe Component (The Wow Feature)

```typescript
// components/consultation/ai-scribe.tsx
interface AIScribeProps {
  onNotesGenerated: (notes: SOAPNotes) => void;
}

interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

// Pre-scripted demo transcription
const DEMO_TRANSCRIPTION = `
Patient reports persistent headache for the past 3 days, 
mainly in the frontal region. Pain is throbbing in nature, 
intensity 6 out of 10. Associated with mild nausea but no vomiting. 
No visual disturbances. Sleep has been disturbed due to pain. 
Taking paracetamol with partial relief. No history of head injury. 
Blood pressure today is 130/85. Let me examine... 
No neck stiffness, pupils equal and reactive. 
I think this is a tension-type headache, possibly stress-related. 
Let's start with a muscle relaxant and analgesic combination. 
I'll also recommend some lifestyle modifications.
`;

const DEMO_SOAP_NOTES: SOAPNotes = {
  subjective:
    'Patient complains of frontal headache x 3 days. Throbbing, 6/10 intensity. Associated nausea, no vomiting. Disturbed sleep. Partial relief with paracetamol. No head injury.',
  objective: 'BP: 130/85 mmHg. No neck stiffness. Pupils PERL. No focal neurological deficit.',
  assessment: 'Tension-type headache, likely stress-related',
  plan: '1. Tab. Flexon MR 1 BD x 5 days\n2. Tab. Paracetamol 650mg SOS\n3. Stress management counseling\n4. Follow-up in 1 week if no improvement',
};
```

**Behavior:**

1. Click "Start Recording" → microphone animation starts
2. After 2 seconds, transcription starts appearing word-by-word
3. Typing effect at ~50ms per word
4. After transcription complete, "Generating notes..." appears
5. SOAP notes fade in with "AI Generated" badge
6. Notes are editable

### WhatsApp Chat Simulation

```typescript
// components/whatsapp/chat-interface.tsx
interface ChatMessage {
  id: string;
  sender: 'patient' | 'clinic' | 'bot';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

// Pre-scripted conversation for booking demo
const BOOKING_CONVERSATION: ChatMessage[] = [
  { sender: 'patient', content: 'Hi, I want to book an appointment', timestamp: '10:30 AM' },
  {
    sender: 'bot',
    content:
      'Welcome to HealthFirst Clinic! 🏥\n\nPlease select a doctor:\n1. Dr. Priya Sharma (General)\n2. Dr. Rajesh Kumar (Pediatrics)\n3. Dr. Anita Desai (Gynecology)\n\nReply with number',
    timestamp: '10:30 AM',
  },
  { sender: 'patient', content: '1', timestamp: '10:31 AM' },
  {
    sender: 'bot',
    content:
      'Dr. Priya Sharma - General Physician\n\nAvailable slots for tomorrow:\n1. 10:00 AM\n2. 10:30 AM\n3. 11:00 AM\n4. 5:00 PM\n5. 5:30 PM\n\nReply with slot number',
    timestamp: '10:31 AM',
  },
  { sender: 'patient', content: '2', timestamp: '10:32 AM' },
  {
    sender: 'bot',
    content:
      '✅ Appointment Confirmed!\n\n👨‍⚕️ Dr. Priya Sharma\n📅 Tomorrow, 10:30 AM\n🎫 Token: #12\n📍 HealthFirst Clinic, Sector 18\n\nReply CANCEL to cancel\nReply RESCHEDULE to change',
    timestamp: '10:32 AM',
  },
];
```

### Slot Picker Component

```typescript
// components/booking/slot-picker.tsx
interface SlotPickerProps {
  doctorId: string;
  onSlotSelect: (date: string, time: string) => void;
}

// Shows 7-day calendar with available slots
// Slots are color-coded: available (green), few left (yellow), full (gray)
// Click slot → selection animation → proceed to form
```

## State Management

### Demo Store

```typescript
// stores/demo.store.ts
interface DemoState {
  isDemo: boolean;
  demoStartedAt: string | null;

  // Track modifications for reset
  modifiedPatients: string[];
  modifiedAppointments: string[];

  // Demo controls
  resetDemo: () => void;
  setDemoMode: (enabled: boolean) => void;
}
```

### Appointments Store

```typescript
// stores/appointments.store.ts
interface AppointmentsState {
  appointments: Appointment[];
  todayQueue: Appointment[];

  // Actions
  checkIn: (appointmentId: string) => void;
  startConsultation: (appointmentId: string) => void;
  completeConsultation: (appointmentId: string) => void;
  markNoShow: (appointmentId: string) => void;
  addWalkIn: (patient: Patient, doctorId: string) => void;

  // Filters
  filterByDoctor: (doctorId: string) => Appointment[];
  filterByStatus: (status: AppointmentStatus) => Appointment[];
}
```

## Mock API Layer

```typescript
// lib/mock-api.ts
export const mockApi = {
  // Auth
  login: async (phone: string, password: string) => {
    await delay(500); // Simulate network
    if (phone === '9876543210' && password === 'demo123') {
      return { user: mockUsers[0], accessToken: 'mock-token' };
    }
    throw new Error('Invalid credentials');
  },

  // Patients
  patients: {
    list: async (filters?: PatientFilters) => {
      await delay(300);
      return filterPatients(mockPatients, filters);
    },
    get: async (id: string) => {
      await delay(200);
      return mockPatients.find((p) => p.id === id);
    },
    search: async (query: string) => {
      await delay(300);
      return mockPatients.filter(
        (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query)
      );
    },
  },

  // Appointments
  appointments: {
    today: async (branchId?: string) => {
      await delay(300);
      const today = new Date().toISOString().split('T')[0];
      return mockAppointments.filter(
        (a) => a.date === today && (!branchId || a.branchId === branchId)
      );
    },
    checkIn: async (id: string) => {
      await delay(200);
      // Update in store
      return { success: true };
    },
  },

  // ABHA Verification (Mock)
  abha: {
    verify: async (abhaNumber: string) => {
      await delay(1500); // Longer delay for "API call" feel
      // Return mock ABDM response
      return {
        verified: true,
        name: 'Verified Patient Name',
        gender: 'M',
        yearOfBirth: '1985',
        mobile: '9876543210',
      };
    },
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## Routing Structure

```typescript
// App routes
/login                          // Demo login
/dashboard                      // Overview with metrics
/dashboard/appointments         // Today's queue
/dashboard/patients             // Patient list
/dashboard/patients/[id]        // Patient profile
/dashboard/consultation/[id]    // Doctor consultation view
/dashboard/whatsapp             // Communication hub
/dashboard/analytics            // Charts and reports
/dashboard/settings             // Clinic settings

// Public booking (apps/booking)
/[tenant]                       // Clinic booking page
/[tenant]/doctor/[id]           // Doctor profile & slots
/[tenant]/confirm               // Booking confirmation
```

## UI/UX Guidelines

### Color Palette

- Primary: Blue (#2563eb) - Trust, healthcare
- Success: Green (#16a34a) - Confirmations, available
- Warning: Amber (#d97706) - Alerts, few slots
- Danger: Red (#dc2626) - Errors, no-show risk
- Neutral: Slate grays for text and backgrounds

### Animation Guidelines

- Page transitions: 200ms fade
- Card hover: 150ms scale(1.02)
- Button click: 100ms scale(0.98)
- Loading states: Skeleton shimmer
- Success: Confetti for bookings, checkmark animation for actions
- AI Scribe: Typing effect, pulse on microphone

### Responsive Breakpoints

- Mobile: < 640px (booking portal priority)
- Tablet: 640px - 1024px (dashboard priority)
- Desktop: > 1024px (full experience)

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm turbo build --filter=web --filter=booking",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

### Environment Variables

```env
# .env.local (for demo)
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_CLINIC_NAME=HealthFirst Clinic
```

## Testing Strategy

For MVP demo, focus on:

1. Manual testing of all demo flows
2. Cross-browser testing (Chrome, Safari, Firefox)
3. Mobile responsiveness testing
4. Demo script walkthrough

No automated tests needed for MVP - speed over coverage.

---

## Correctness Properties

### P1: Mock Data Consistency

All mock data relationships must be valid - appointments reference existing patients and doctors, prescriptions reference existing drugs.

### P2: Demo State Isolation

Demo modifications (check-ins, status changes) must persist in localStorage but not affect the base mock data. Reset must restore original state.

### P3: Realistic Data Patterns

Mock data must reflect realistic Indian healthcare patterns - appointment times during working hours, realistic patient demographics, common Indian names.

### P4: UI Responsiveness

All interactive elements must provide immediate visual feedback. No action should appear "stuck" - use optimistic updates.

### P5: Demo Flow Completeness

Every demo flow must be completable end-to-end without errors. No dead ends or broken states.
