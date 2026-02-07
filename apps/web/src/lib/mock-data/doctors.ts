/**
 * Mock doctors data with realistic Indian profiles
 */

import type { Doctor } from './types';

export const mockDoctors: Doctor[] = [
  {
    id: 'doc-001',
    tenantId: 'tenant-001',
    name: 'Dr. Priya Sharma',
    phone: '9876543211',
    email: 'priya.sharma@healthfirst.in',
    gender: 'female',
    photoUrl: '/images/doctors/doctor-female-1.jpg',
    specialization: 'General Physician',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 12,
    registrationNumber: 'DMC-45678',
    registrationCouncil: 'Delhi Medical Council',
    hprId: 'HP2710000001',
    languages: ['English', 'Hindi'],
    consultationFee: 500,
    followUpFee: 300,
    slotDuration: 15,
    branchIds: ['branch-001', 'branch-002'],
    availability: {
      monday: [
        { start: '10:00', end: '13:00' },
        { start: '17:00', end: '20:00' },
      ],
      tuesday: [
        { start: '10:00', end: '13:00' },
        { start: '17:00', end: '20:00' },
      ],
      wednesday: [
        { start: '10:00', end: '13:00' },
        { start: '17:00', end: '20:00' },
      ],
      thursday: [
        { start: '10:00', end: '13:00' },
        { start: '17:00', end: '20:00' },
      ],
      friday: [
        { start: '10:00', end: '13:00' },
        { start: '17:00', end: '20:00' },
      ],
      saturday: [{ start: '10:00', end: '14:00' }],
    },
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'doc-002',
    tenantId: 'tenant-001',
    name: 'Dr. Rajesh Kumar',
    phone: '9876543212',
    email: 'rajesh.kumar@healthfirst.in',
    gender: 'male',
    photoUrl: '/images/doctors/doctor-male-1.jpg',
    specialization: 'Pediatrician',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    experience: 15,
    registrationNumber: 'DMC-34567',
    registrationCouncil: 'Delhi Medical Council',
    hprId: 'HP2710000002',
    languages: ['English', 'Hindi', 'Punjabi'],
    consultationFee: 600,
    followUpFee: 400,
    slotDuration: 20,
    branchIds: ['branch-001'],
    availability: {
      monday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      tuesday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      wednesday: [{ start: '09:00', end: '13:00' }],
      thursday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      friday: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      saturday: [{ start: '09:00', end: '13:00' }],
    },
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'doc-003',
    tenantId: 'tenant-001',
    name: 'Dr. Anita Desai',
    phone: '9876543213',
    email: 'anita.desai@healthfirst.in',
    gender: 'female',
    photoUrl: '/images/doctors/doctor-female-2.jpg',
    specialization: 'Gynecologist & Obstetrician',
    qualification: 'MBBS, MS (OBG), DNB',
    experience: 18,
    registrationNumber: 'DMC-23456',
    registrationCouncil: 'Delhi Medical Council',
    hprId: 'HP2710000003',
    languages: ['English', 'Hindi', 'Gujarati'],
    consultationFee: 700,
    followUpFee: 500,
    slotDuration: 20,
    branchIds: ['branch-001', 'branch-002'],
    availability: {
      monday: [{ start: '11:00', end: '14:00' }],
      tuesday: [
        { start: '11:00', end: '14:00' },
        { start: '18:00', end: '20:00' },
      ],
      wednesday: [{ start: '11:00', end: '14:00' }],
      thursday: [
        { start: '11:00', end: '14:00' },
        { start: '18:00', end: '20:00' },
      ],
      friday: [{ start: '11:00', end: '14:00' }],
      saturday: [{ start: '11:00', end: '14:00' }],
    },
    isActive: true,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'doc-004',
    tenantId: 'tenant-001',
    name: 'Dr. Vikram Singh',
    phone: '9876543214',
    email: 'vikram.singh@healthfirst.in',
    gender: 'male',
    photoUrl: '/images/doctors/doctor-male-2.jpg',
    specialization: 'Orthopedic Surgeon',
    qualification: 'MBBS, MS (Ortho), Fellowship in Joint Replacement',
    experience: 20,
    registrationNumber: 'DMC-12345',
    registrationCouncil: 'Delhi Medical Council',
    hprId: 'HP2710000004',
    languages: ['English', 'Hindi'],
    consultationFee: 800,
    followUpFee: 500,
    slotDuration: 15,
    branchIds: ['branch-001'],
    availability: {
      monday: [{ start: '14:00', end: '17:00' }],
      wednesday: [{ start: '14:00', end: '17:00' }],
      friday: [{ start: '14:00', end: '17:00' }],
      saturday: [{ start: '10:00', end: '13:00' }],
    },
    isActive: true,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'doc-005',
    tenantId: 'tenant-001',
    name: 'Dr. Meera Patel',
    phone: '9876543215',
    email: 'meera.patel@healthfirst.in',
    gender: 'female',
    photoUrl: '/images/doctors/doctor-female-3.jpg',
    specialization: 'Dermatologist',
    qualification: 'MBBS, MD (Dermatology)',
    experience: 10,
    registrationNumber: 'GMC-56789',
    registrationCouncil: 'Gujarat Medical Council',
    hprId: 'HP2710000005',
    languages: ['English', 'Hindi', 'Gujarati'],
    consultationFee: 600,
    followUpFee: 400,
    slotDuration: 15,
    branchIds: ['branch-002'],
    availability: {
      tuesday: [{ start: '10:00', end: '14:00' }],
      thursday: [{ start: '10:00', end: '14:00' }],
      saturday: [{ start: '10:00', end: '13:00' }],
    },
    isActive: true,
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-04-01T10:00:00Z',
  },
];

// Helper functions
export function getDoctorById(doctorId: string): Doctor | undefined {
  return mockDoctors.find((d) => d.id === doctorId);
}

export function getDoctorsByBranch(branchId: string): Doctor[] {
  return mockDoctors.filter((d) => d.branchIds.includes(branchId) && d.isActive);
}

export function getDoctorsBySpecialization(specialization: string): Doctor[] {
  return mockDoctors.filter(
    (d) => d.specialization.toLowerCase().includes(specialization.toLowerCase()) && d.isActive
  );
}

export function getActiveDoctors(): Doctor[] {
  return mockDoctors.filter((d) => d.isActive);
}

// Get unique specializations for filtering
export function getSpecializations(): string[] {
  const specs = new Set(mockDoctors.map((d) => d.specialization));
  return Array.from(specs).sort();
}
