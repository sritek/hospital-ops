/**
 * Mock patients data with realistic Indian demographics
 * 50+ patients with varied profiles for demo
 */

import type { Patient, VisitHistory } from './types';

// Helper to generate dates
const today = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0] as string;
const daysAgo = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return formatDate(d);
};

export const mockPatients: Patient[] = [
  // VIP / Frequent patients
  {
    id: 'pat-001',
    tenantId: 'tenant-001',
    name: 'Amit Verma',
    phone: '9876500001',
    email: 'amit.verma@email.com',
    gender: 'male',
    dateOfBirth: '1985-03-15',
    age: 40,
    photoUrl: '/images/patients/male-1.jpg',
    address: '45, Sector 22',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    abhaNumber: '91-1234-5678-9012',
    abhaAddress: 'amit.verma@abdm',
    emergencyContact: {
      name: 'Sunita Verma',
      phone: '9876500002',
      relation: 'Spouse',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2023-06-15',
    lastVisitDate: daysAgo(15),
    totalVisits: 12,
    preferredLanguage: 'hi',
    marketingConsent: true,
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'pat-002',
    tenantId: 'tenant-001',
    name: 'Priya Gupta',
    phone: '9876500003',
    email: 'priya.gupta@email.com',
    gender: 'female',
    dateOfBirth: '1990-07-22',
    age: 35,
    photoUrl: '/images/patients/female-1.jpg',
    address: '78, Sector 15',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: ['Thyroid'],
    abhaNumber: '91-2345-6789-0123',
    emergencyContact: {
      name: 'Rahul Gupta',
      phone: '9876500004',
      relation: 'Spouse',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2023-08-10',
    lastVisitDate: daysAgo(7),
    totalVisits: 8,
    preferredLanguage: 'en',
    marketingConsent: true,
    createdAt: '2023-08-10T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'pat-003',
    tenantId: 'tenant-001',
    name: 'Rajesh Sharma',
    phone: '9876500005',
    email: 'rajesh.sharma@email.com',
    gender: 'male',
    dateOfBirth: '1975-11-08',
    age: 50,
    address: '23, Sector 44',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201303',
    bloodGroup: 'O+',
    allergies: ['Sulfa drugs', 'Aspirin'],
    chronicConditions: ['Hypertension', 'High Cholesterol'],
    emergencyContact: {
      name: 'Kavita Sharma',
      phone: '9876500006',
      relation: 'Spouse',
    },
    noShowCount: 1,
    bookingStatus: 'normal',
    firstVisitDate: '2022-03-20',
    lastVisitDate: daysAgo(30),
    totalVisits: 15,
    preferredLanguage: 'hi',
    marketingConsent: true,
    createdAt: '2022-03-20T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
  // New patient (first visit today)
  {
    id: 'pat-004',
    tenantId: 'tenant-001',
    name: 'Sneha Reddy',
    phone: '9876500007',
    gender: 'female',
    dateOfBirth: '1995-04-12',
    age: 30,
    address: '56, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    bloodGroup: 'AB+',
    allergies: [],
    chronicConditions: [],
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: formatDate(today),
    totalVisits: 0,
    preferredLanguage: 'en',
    marketingConsent: true,
    createdAt: daysAgo(2) + 'T10:00:00Z',
    updatedAt: daysAgo(2) + 'T10:00:00Z',
  },
  // High no-show risk patient
  {
    id: 'pat-005',
    tenantId: 'tenant-001',
    name: 'Vikram Malhotra',
    phone: '9876500008',
    gender: 'male',
    dateOfBirth: '1988-09-25',
    age: 37,
    address: '12, Sector 50',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201307',
    bloodGroup: 'B-',
    allergies: [],
    chronicConditions: [],
    noShowCount: 3,
    bookingStatus: 'warning',
    firstVisitDate: '2024-06-01',
    lastVisitDate: daysAgo(45),
    totalVisits: 2,
    preferredLanguage: 'en',
    marketingConsent: false,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-08-15T10:00:00Z',
  },
  // Pediatric patients
  {
    id: 'pat-006',
    tenantId: 'tenant-001',
    name: 'Arjun Singh',
    phone: '9876500009', // Parent's phone
    gender: 'male',
    dateOfBirth: '2019-02-14',
    age: 6,
    address: '89, Sector 27',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    bloodGroup: 'O+',
    allergies: ['Peanuts'],
    chronicConditions: [],
    emergencyContact: {
      name: 'Manpreet Singh',
      phone: '9876500010',
      relation: 'Father',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2023-01-10',
    lastVisitDate: daysAgo(60),
    totalVisits: 6,
    preferredLanguage: 'hi',
    marketingConsent: true,
    createdAt: '2023-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'pat-007',
    tenantId: 'tenant-001',
    name: 'Ananya Kapoor',
    phone: '9876500011',
    gender: 'female',
    dateOfBirth: '2021-08-30',
    age: 4,
    address: '34, Sector 19',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    bloodGroup: 'A-',
    allergies: [],
    chronicConditions: [],
    emergencyContact: {
      name: 'Neha Kapoor',
      phone: '9876500012',
      relation: 'Mother',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2023-09-15',
    lastVisitDate: daysAgo(20),
    totalVisits: 4,
    preferredLanguage: 'en',
    marketingConsent: true,
    createdAt: '2023-09-15T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  // Senior citizens
  {
    id: 'pat-008',
    tenantId: 'tenant-001',
    name: 'Kamla Devi',
    phone: '9876500013',
    gender: 'female',
    dateOfBirth: '1955-12-03',
    age: 70,
    address: '67, Sector 31',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    bloodGroup: 'B+',
    allergies: ['Ibuprofen'],
    chronicConditions: ['Diabetes', 'Arthritis', 'Hypertension'],
    emergencyContact: {
      name: 'Suresh Kumar',
      phone: '9876500014',
      relation: 'Son',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2021-05-20',
    lastVisitDate: daysAgo(10),
    totalVisits: 24,
    preferredLanguage: 'hi',
    marketingConsent: true,
    createdAt: '2021-05-20T10:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'pat-009',
    tenantId: 'tenant-001',
    name: 'Ramesh Agarwal',
    phone: '9876500015',
    email: 'ramesh.agarwal@email.com',
    gender: 'male',
    dateOfBirth: '1958-06-18',
    age: 67,
    address: '90, Sector 41',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201303',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: ['COPD', 'Hypertension'],
    abhaNumber: '91-3456-7890-1234',
    emergencyContact: {
      name: 'Meena Agarwal',
      phone: '9876500016',
      relation: 'Spouse',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2020-11-10',
    lastVisitDate: daysAgo(5),
    totalVisits: 30,
    preferredLanguage: 'hi',
    marketingConsent: true,
    createdAt: '2020-11-10T10:00:00Z',
    updatedAt: '2024-02-07T10:00:00Z',
  },
  // Pregnant patient
  {
    id: 'pat-010',
    tenantId: 'tenant-001',
    name: 'Deepika Joshi',
    phone: '9876500017',
    email: 'deepika.joshi@email.com',
    gender: 'female',
    dateOfBirth: '1992-01-25',
    age: 33,
    address: '45, Sector 37',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201303',
    bloodGroup: 'O+',
    allergies: [],
    chronicConditions: [],
    emergencyContact: {
      name: 'Arun Joshi',
      phone: '9876500018',
      relation: 'Spouse',
    },
    noShowCount: 0,
    bookingStatus: 'normal',
    firstVisitDate: '2025-10-01',
    lastVisitDate: daysAgo(14),
    totalVisits: 5,
    preferredLanguage: 'en',
    marketingConsent: true,
    createdAt: '2025-10-01T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
  },
];

// Generate more patients programmatically
const firstNames = {
  male: [
    'Aakash',
    'Bharat',
    'Chetan',
    'Dhruv',
    'Gaurav',
    'Harsh',
    'Ishaan',
    'Jai',
    'Karan',
    'Lakshay',
    'Mohit',
    'Nikhil',
    'Om',
    'Pranav',
    'Rohit',
    'Sahil',
    'Tanmay',
    'Uday',
    'Varun',
    'Yash',
  ],
  female: [
    'Aisha',
    'Bhavna',
    'Chhavi',
    'Diya',
    'Esha',
    'Fatima',
    'Garima',
    'Hina',
    'Isha',
    'Jyoti',
    'Kavya',
    'Lavanya',
    'Mansi',
    'Nisha',
    'Pooja',
    'Riya',
    'Sakshi',
    'Tanvi',
    'Uma',
    'Vidya',
  ],
};
const lastNames = [
  'Agarwal',
  'Bansal',
  'Choudhary',
  'Dubey',
  'Garg',
  'Jain',
  'Khanna',
  'Mehta',
  'Pandey',
  'Rastogi',
  'Saxena',
  'Tiwari',
  'Verma',
  'Yadav',
  'Mishra',
  'Srivastava',
  'Chauhan',
  'Nair',
  'Iyer',
  'Pillai',
];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const sectors = [
  '12',
  '15',
  '18',
  '22',
  '27',
  '31',
  '37',
  '41',
  '44',
  '50',
  '52',
  '62',
  '63',
  '76',
];

// Generate 40 more patients
for (let i = 11; i <= 50; i++) {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstNameArr = firstNames[gender];
  const firstName = firstNameArr[Math.floor(Math.random() * firstNameArr.length)] ?? 'Unknown';
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)] ?? 'Patient';
  const birthYear = 1960 + Math.floor(Math.random() * 50);
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const age = today.getFullYear() - birthYear;
  const sector = sectors[Math.floor(Math.random() * sectors.length)] ?? '12';
  const noShowCount = Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0;
  const totalVisits = Math.floor(Math.random() * 15) + 1;
  const firstVisitDaysAgo = Math.floor(Math.random() * 365) + 30;
  const lastVisitDaysAgo = Math.floor(Math.random() * 60) + 1;

  const allergies: string[] = [];
  if (Math.random() > 0.85) {
    const possibleAllergies = [
      'Penicillin',
      'Sulfa drugs',
      'Aspirin',
      'Ibuprofen',
      'Peanuts',
      'Shellfish',
      'Latex',
    ];
    const allergy = possibleAllergies[Math.floor(Math.random() * possibleAllergies.length)];
    if (allergy) allergies.push(allergy);
  }

  const chronicConditions: string[] = [];
  if (age > 40 && Math.random() > 0.6) {
    const conditions = [
      'Hypertension',
      'Type 2 Diabetes',
      'High Cholesterol',
      'Thyroid',
      'Arthritis',
    ];
    const condition1 = conditions[Math.floor(Math.random() * conditions.length)];
    if (condition1) chronicConditions.push(condition1);
    if (Math.random() > 0.7) {
      const condition2 = conditions[Math.floor(Math.random() * conditions.length)];
      if (condition2) chronicConditions.push(condition2);
    }
  }

  mockPatients.push({
    id: `pat-${String(i).padStart(3, '0')}`,
    tenantId: 'tenant-001',
    name: `${firstName} ${lastName}`,
    phone: `98765${String(i + 100).padStart(5, '0')}`,
    email:
      Math.random() > 0.3
        ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`
        : undefined,
    gender,
    dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
    age,
    address: `${Math.floor(Math.random() * 200) + 1}, Sector ${sector}`,
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: Math.random() > 0.5 ? '201301' : '201309',
    bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)] ?? 'O+',
    allergies,
    chronicConditions,
    abhaNumber:
      Math.random() > 0.7
        ? `91-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
        : undefined,
    noShowCount,
    bookingStatus: noShowCount >= 2 ? 'warning' : 'normal',
    firstVisitDate: daysAgo(firstVisitDaysAgo),
    lastVisitDate: totalVisits > 0 ? daysAgo(lastVisitDaysAgo) : undefined,
    totalVisits,
    preferredLanguage: Math.random() > 0.4 ? 'hi' : 'en',
    marketingConsent: Math.random() > 0.1,
    createdAt: daysAgo(firstVisitDaysAgo) + 'T10:00:00Z',
    updatedAt: daysAgo(lastVisitDaysAgo) + 'T10:00:00Z',
  });
}

// Mock visit history for key patients
export const mockVisitHistory: VisitHistory[] = [
  {
    id: 'visit-001',
    appointmentId: 'apt-old-001',
    patientId: 'pat-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Sharma',
    date: daysAgo(15),
    diagnosis: 'Type 2 Diabetes Mellitus - Controlled',
    diagnosisCode: 'E11.9',
    chiefComplaint: 'Routine follow-up for diabetes management',
    vitals: {
      bloodPressureSystolic: 128,
      bloodPressureDiastolic: 82,
      pulse: 76,
      temperature: 98.4,
      weight: 78,
      height: 172,
      spo2: 98,
      recordedAt: daysAgo(15) + 'T10:30:00Z',
      recordedBy: 'Nurse Rekha',
    },
    notes: 'HbA1c improved to 6.8%. Continue current medications. Advised dietary modifications.',
  },
  {
    id: 'visit-002',
    appointmentId: 'apt-old-002',
    patientId: 'pat-001',
    doctorId: 'doc-001',
    doctorName: 'Dr. Priya Sharma',
    date: daysAgo(45),
    diagnosis: 'Essential Hypertension',
    diagnosisCode: 'I10',
    chiefComplaint: 'BP monitoring and medication review',
    vitals: {
      bloodPressureSystolic: 142,
      bloodPressureDiastolic: 88,
      pulse: 80,
      weight: 79,
      spo2: 97,
      recordedAt: daysAgo(45) + 'T11:00:00Z',
      recordedBy: 'Nurse Rekha',
    },
    notes: 'BP slightly elevated. Increased Amlodipine dose. Review in 2 weeks.',
  },
  {
    id: 'visit-003',
    appointmentId: 'apt-old-003',
    patientId: 'pat-002',
    doctorId: 'doc-003',
    doctorName: 'Dr. Anita Desai',
    date: daysAgo(7),
    diagnosis: 'Routine antenatal checkup',
    diagnosisCode: 'Z34.0',
    chiefComplaint: 'Pregnancy follow-up - 24 weeks',
    vitals: {
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      pulse: 82,
      weight: 62,
      recordedAt: daysAgo(7) + 'T12:00:00Z',
      recordedBy: 'Nurse Sunita',
    },
    notes:
      'Fetal growth normal. All parameters within range. Continue iron and calcium supplements.',
  },
];

// Helper functions
export function getPatientById(patientId: string): Patient | undefined {
  return mockPatients.find((p) => p.id === patientId);
}

export function searchPatients(query: string): Patient[] {
  const lowerQuery = query.toLowerCase();
  return mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.phone.includes(query) ||
      p.abhaNumber?.includes(query)
  );
}

export function getPatientVisitHistory(patientId: string): VisitHistory[] {
  return mockVisitHistory.filter((v) => v.patientId === patientId);
}

export function getRecentPatients(limit: number = 10): Patient[] {
  return [...mockPatients]
    .filter((p) => p.lastVisitDate)
    .sort((a, b) => new Date(b.lastVisitDate!).getTime() - new Date(a.lastVisitDate!).getTime())
    .slice(0, limit);
}

export function getPatientsWithCondition(condition: string): Patient[] {
  return mockPatients.filter((p) =>
    p.chronicConditions.some((c) => c.toLowerCase().includes(condition.toLowerCase()))
  );
}
