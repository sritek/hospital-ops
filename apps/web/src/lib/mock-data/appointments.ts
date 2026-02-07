/**
 * Mock appointments data for today and upcoming week
 */

import type { Appointment } from './types';
import { mockPatients } from './patients';
import { mockDoctors } from './doctors';

// Helper to generate dates
const today = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0] as string;

const addDays = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

const todayStr: string = formatDate(today);

// Generate realistic appointments for today
export const mockAppointments: Appointment[] = [
  // Today's appointments - various statuses for demo
  {
    id: 'apt-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-001',
    doctorId: 'doc-001',
    date: todayStr,
    time: '10:00',
    endTime: '10:15',
    tokenNumber: 1,
    type: 'follow-up',
    status: 'completed',
    source: 'phone',
    reason: 'Diabetes follow-up',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: true,
    checkedInAt: `${todayStr}T09:45:00Z`,
    consultationStartedAt: `${todayStr}T10:02:00Z`,
    completedAt: `${todayStr}T10:18:00Z`,
    createdAt: `${addDays(-3)}T14:30:00Z`,
    updatedAt: `${todayStr}T10:18:00Z`,
  },
  {
    id: 'apt-002',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-002',
    doctorId: 'doc-001',
    date: todayStr,
    time: '10:15',
    endTime: '10:30',
    tokenNumber: 2,
    type: 'scheduled',
    status: 'completed',
    source: 'online',
    reason: 'General checkup',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: true,
    checkedInAt: `${todayStr}T10:05:00Z`,
    consultationStartedAt: `${todayStr}T10:20:00Z`,
    completedAt: `${todayStr}T10:35:00Z`,
    createdAt: `${addDays(-5)}T11:00:00Z`,
    updatedAt: `${todayStr}T10:35:00Z`,
  },
  {
    id: 'apt-003',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-003',
    doctorId: 'doc-001',
    date: todayStr,
    time: '10:30',
    endTime: '10:45',
    tokenNumber: 3,
    type: 'scheduled',
    status: 'in-consultation',
    source: 'whatsapp',
    reason: 'Headache and fatigue',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: false,
    checkedInAt: `${todayStr}T10:20:00Z`,
    consultationStartedAt: `${todayStr}T10:38:00Z`,
    createdAt: `${addDays(-2)}T09:00:00Z`,
    updatedAt: `${todayStr}T10:38:00Z`,
  },
  {
    id: 'apt-004',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-004',
    doctorId: 'doc-001',
    date: todayStr,
    time: '10:45',
    endTime: '11:00',
    tokenNumber: 4,
    type: 'scheduled',
    status: 'checked-in',
    source: 'online',
    reason: 'Persistent cough',
    noShowRisk: 'low',
    isFirstVisit: true,
    isVip: false,
    checkedInAt: `${todayStr}T10:30:00Z`,
    createdAt: `${addDays(-1)}T16:00:00Z`,
    updatedAt: `${todayStr}T10:30:00Z`,
  },
  {
    id: 'apt-005',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-005',
    doctorId: 'doc-001',
    date: todayStr,
    time: '11:00',
    endTime: '11:15',
    tokenNumber: 5,
    type: 'scheduled',
    status: 'checked-in',
    source: 'phone',
    reason: 'Back pain',
    noShowRisk: 'high', // High risk due to past no-shows
    isFirstVisit: false,
    isVip: false,
    checkedInAt: `${todayStr}T10:50:00Z`,
    createdAt: `${addDays(-4)}T10:00:00Z`,
    updatedAt: `${todayStr}T10:50:00Z`,
  },
  {
    id: 'apt-006',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-008',
    doctorId: 'doc-001',
    date: todayStr,
    time: '11:15',
    endTime: '11:30',
    tokenNumber: 6,
    type: 'follow-up',
    status: 'scheduled',
    source: 'phone',
    reason: 'Diabetes and BP review',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: true,
    createdAt: `${addDays(-7)}T11:00:00Z`,
    updatedAt: `${addDays(-7)}T11:00:00Z`,
  },
  {
    id: 'apt-007',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-009',
    doctorId: 'doc-001',
    date: todayStr,
    time: '11:30',
    endTime: '11:45',
    tokenNumber: 7,
    type: 'scheduled',
    status: 'scheduled',
    source: 'online',
    reason: 'Breathing difficulty',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: true,
    createdAt: `${addDays(-2)}T15:00:00Z`,
    updatedAt: `${addDays(-2)}T15:00:00Z`,
  },
  // Walk-in patient
  {
    id: 'apt-008',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-011',
    doctorId: 'doc-001',
    date: todayStr,
    time: '11:45',
    endTime: '12:00',
    tokenNumber: 8,
    type: 'walk-in',
    status: 'checked-in',
    source: 'walk-in',
    reason: 'Fever and body ache',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: false,
    checkedInAt: `${todayStr}T11:00:00Z`,
    createdAt: `${todayStr}T11:00:00Z`,
    updatedAt: `${todayStr}T11:00:00Z`,
  },
  // Afternoon appointments
  {
    id: 'apt-009',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-012',
    doctorId: 'doc-001',
    date: todayStr,
    time: '17:00',
    endTime: '17:15',
    tokenNumber: 9,
    type: 'scheduled',
    status: 'scheduled',
    source: 'online',
    reason: 'Skin rash',
    noShowRisk: 'medium',
    isFirstVisit: true,
    isVip: false,
    createdAt: `${addDays(-1)}T20:00:00Z`,
    updatedAt: `${addDays(-1)}T20:00:00Z`,
  },
  {
    id: 'apt-010',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-013',
    doctorId: 'doc-001',
    date: todayStr,
    time: '17:15',
    endTime: '17:30',
    tokenNumber: 10,
    type: 'scheduled',
    status: 'scheduled',
    source: 'whatsapp',
    reason: 'Joint pain',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: false,
    createdAt: `${addDays(-3)}T18:00:00Z`,
    updatedAt: `${addDays(-3)}T18:00:00Z`,
  },
  // Pediatrician appointments
  {
    id: 'apt-011',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-006',
    doctorId: 'doc-002',
    date: todayStr,
    time: '09:00',
    endTime: '09:20',
    tokenNumber: 1,
    type: 'scheduled',
    status: 'completed',
    source: 'phone',
    reason: 'Vaccination',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: false,
    checkedInAt: `${todayStr}T08:50:00Z`,
    consultationStartedAt: `${todayStr}T09:05:00Z`,
    completedAt: `${todayStr}T09:22:00Z`,
    createdAt: `${addDays(-7)}T10:00:00Z`,
    updatedAt: `${todayStr}T09:22:00Z`,
  },
  {
    id: 'apt-012',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-007',
    doctorId: 'doc-002',
    date: todayStr,
    time: '09:20',
    endTime: '09:40',
    tokenNumber: 2,
    type: 'scheduled',
    status: 'in-consultation',
    source: 'online',
    reason: 'Cold and cough',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: false,
    checkedInAt: `${todayStr}T09:10:00Z`,
    consultationStartedAt: `${todayStr}T09:25:00Z`,
    createdAt: `${addDays(-2)}T14:00:00Z`,
    updatedAt: `${todayStr}T09:25:00Z`,
  },
  // Gynecologist appointments
  {
    id: 'apt-013',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    patientId: 'pat-010',
    doctorId: 'doc-003',
    date: todayStr,
    time: '11:00',
    endTime: '11:20',
    tokenNumber: 1,
    type: 'follow-up',
    status: 'checked-in',
    source: 'phone',
    reason: 'Antenatal checkup - 28 weeks',
    noShowRisk: 'low',
    isFirstVisit: false,
    isVip: true,
    checkedInAt: `${todayStr}T10:45:00Z`,
    createdAt: `${addDays(-14)}T11:00:00Z`,
    updatedAt: `${todayStr}T10:45:00Z`,
  },
];

// Generate upcoming appointments for the week
const upcomingPatientIds = mockPatients.slice(15, 40).map((p) => p.id);
const times = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '17:00',
  '17:30',
  '18:00',
];

for (let day = 1; day <= 6; day++) {
  const date = addDays(day);
  const appointmentsPerDay = Math.floor(Math.random() * 8) + 5;

  for (let i = 0; i < appointmentsPerDay; i++) {
    const patientId =
      upcomingPatientIds[Math.floor(Math.random() * upcomingPatientIds.length)] ?? 'pat-015';
    const doctor = mockDoctors[Math.floor(Math.random() * mockDoctors.length)];
    const doctorId = doctor?.id ?? 'doc-001';
    const time = times[Math.floor(Math.random() * times.length)] ?? '10:00';
    const timeParts = time.split(':');
    const hours = Number(timeParts[0]) || 10;
    const mins = Number(timeParts[1]) || 0;
    const endTime = `${String(hours).padStart(2, '0')}:${String(mins + 15).padStart(2, '0')}`;

    const sources: Appointment['source'][] = ['online', 'phone', 'whatsapp'];
    const reasons = ['General checkup', 'Follow-up', 'Fever', 'Cough', 'Pain', 'Consultation'];

    mockAppointments.push({
      id: `apt-future-${day}-${i}`,
      tenantId: 'tenant-001',
      branchId: Math.random() > 0.3 ? 'branch-001' : 'branch-002',
      patientId,
      doctorId,
      date,
      time,
      endTime,
      tokenNumber: i + 1,
      type: Math.random() > 0.7 ? 'follow-up' : 'scheduled',
      status: 'scheduled',
      source: sources[Math.floor(Math.random() * 3)] ?? 'online',
      reason: reasons[Math.floor(Math.random() * 6)] ?? 'General checkup',
      noShowRisk: Math.random() > 0.85 ? 'high' : Math.random() > 0.7 ? 'medium' : 'low',
      isFirstVisit: Math.random() > 0.8,
      isVip: Math.random() > 0.7,
      createdAt: `${addDays(-Math.floor(Math.random() * 7))}T${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:00:00Z`,
      updatedAt: `${addDays(-Math.floor(Math.random() * 7))}T${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:00:00Z`,
    });
  }
}

// Helper functions
export function getAppointmentById(appointmentId: string): Appointment | undefined {
  return mockAppointments.find((a) => a.id === appointmentId);
}

export function getTodayAppointments(branchId?: string, doctorId?: string): Appointment[] {
  return mockAppointments
    .filter((a) => {
      if (a.date !== todayStr) return false;
      if (branchId && a.branchId !== branchId) return false;
      if (doctorId && a.doctorId !== doctorId) return false;
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getAppointmentsByDate(date: string, branchId?: string): Appointment[] {
  return mockAppointments
    .filter((a) => {
      if (a.date !== date) return false;
      if (branchId && a.branchId !== branchId) return false;
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  return mockAppointments
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAppointmentsByDoctor(doctorId: string, date?: string): Appointment[] {
  return mockAppointments
    .filter((a) => {
      if (a.doctorId !== doctorId) return false;
      if (date && a.date !== date) return false;
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getUpcomingAppointments(days: number = 7): Appointment[] {
  const endDate = addDays(days);
  return mockAppointments
    .filter((a) => a.date >= todayStr && a.date <= endDate && a.status === 'scheduled')
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
}

export function getQueuePosition(appointmentId: string): number {
  const appointment = getAppointmentById(appointmentId);
  if (!appointment) return -1;

  const todayQueue = getTodayAppointments(appointment.branchId, appointment.doctorId).filter((a) =>
    ['scheduled', 'checked-in'].includes(a.status)
  );

  return todayQueue.findIndex((a) => a.id === appointmentId) + 1;
}

// Get next token number for walk-ins
export function getNextTokenNumber(branchId: string, doctorId: string): number {
  const todayAppts = getTodayAppointments(branchId, doctorId);
  if (todayAppts.length === 0) return 1;
  return Math.max(...todayAppts.map((a) => a.tokenNumber)) + 1;
}
