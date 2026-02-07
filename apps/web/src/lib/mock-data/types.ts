/**
 * Shared types for mock data
 * These types will be used by both mock and real API implementations
 * When moving to real API, these can be imported from @hospital-ops/shared
 */

export type UserRole =
  | 'super_admin'
  | 'branch_admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_tech'
  | 'accountant';

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'in-consultation'
  | 'completed'
  | 'no-show'
  | 'cancelled';

export type AppointmentType = 'scheduled' | 'walk-in' | 'follow-up' | 'emergency';

export type AppointmentSource = 'online' | 'walk-in' | 'phone' | 'whatsapp';

export type NoShowRisk = 'low' | 'medium' | 'high';

export type BookingStatus = 'normal' | 'warning' | 'blocked';

export type DrugSchedule = 'H' | 'H1' | 'X' | 'OTC';

export type InteractionSeverity = 'mild' | 'moderate' | 'severe';

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin?: string;
  timezone: string;
  currency: string;
  workingHours: WorkingHours;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  breaks?: { start: string; end: string }[];
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  legalName: string;
  email: string;
  phone: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  hfrId?: string; // Health Facility Registry ID (ABDM)
  hipId?: string; // Health Information Provider ID (ABDM)
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt?: string;
  branches: Branch[];
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  specialization: string;
  qualification: string;
  experience: number; // years
  registrationNumber: string;
  registrationCouncil: string;
  hprId?: string; // Healthcare Professional Registry ID (ABDM)
  languages: string[];
  consultationFee: number;
  followUpFee: number;
  slotDuration: number; // minutes
  branchIds: string[];
  availability: DoctorAvailability;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailability {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Patient {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  age: number;
  photoUrl?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  abhaNumber?: string;
  abhaAddress?: string;
  emergencyContact?: EmergencyContact;
  noShowCount: number;
  bookingStatus: BookingStatus;
  firstVisitDate: string;
  lastVisitDate?: string;
  totalVisits: number;
  preferredLanguage: 'en' | 'hi';
  marketingConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  branchId: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime: string; // HH:mm
  tokenNumber: number;
  type: AppointmentType;
  status: AppointmentStatus;
  source: AppointmentSource;
  reason?: string;
  notes?: string;
  noShowRisk: NoShowRisk;
  isFirstVisit: boolean;
  isVip: boolean;
  checkedInAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  manufacturer: string;
  category: string;
  forms: string[];
  strengths: string[];
  schedule: DrugSchedule;
  interactsWith: string[]; // Drug IDs
  contraindications: string[];
  sideEffects: string[];
  isActive: boolean;
}

export interface DrugInteraction {
  drug1Id: string;
  drug2Id: string;
  severity: InteractionSeverity;
  description: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications: PrescriptionMedication[];
  diagnosis: string;
  diagnosisCode?: string; // ICD-10
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface PrescriptionMedication {
  drugId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'appointments' | 'reminders' | 'results' | 'marketing' | 'general';
  contentEn: string;
  contentHi: string;
  variables: string[];
  isActive: boolean;
}

export interface WhatsAppMessage {
  id: string;
  patientId: string;
  templateId?: string;
  sender: 'patient' | 'clinic' | 'bot';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  branchIds: string[];
  photoUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitHistory {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  diagnosisCode?: string;
  chiefComplaint: string;
  prescription?: Prescription;
  vitals?: Vitals;
  labOrders?: string[];
  notes?: string;
}

export interface Vitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  spo2?: number;
  respiratoryRate?: number;
  recordedAt: string;
  recordedBy: string;
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  turnaroundTime: string; // e.g., "24 hours"
  sampleType: string;
  instructions?: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}
