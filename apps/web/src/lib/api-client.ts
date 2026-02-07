/**
 * API Client Abstraction Layer
 *
 * This module provides a clean interface for API calls that can be easily
 * switched between mock and real implementations.
 *
 * To switch to real API:
 * 1. Set NEXT_PUBLIC_USE_MOCK_API=false in .env
 * 2. Implement the real API calls in the else branches
 *
 * The interface remains the same, so no component changes needed.
 */

import type {
  Clinic,
  Branch,
  Doctor,
  Patient,
  Appointment,
  Drug,
  DrugInteraction,
  LabTest,
  ICD10Code,
  WhatsAppTemplate,
  User,
  VisitHistory,
} from './mock-data/types';

// Import mock data and helpers
import {
  mockClinic,
  mockBranches,
  mockDoctors,
  mockPatients,
  mockAppointments,
  mockLabTests,
  mockICD10Codes,
  mockWhatsAppTemplates,
  getBranchById,
  getDoctorById,
  getDoctorsByBranch,
  getPatientById,
  searchPatients as searchPatientsData,
  getPatientVisitHistory,
  getTodayAppointments as getTodayApptsData,
  getAppointmentsByDate as getApptsByDateData,
  searchDrugs as searchDrugsData,
  checkDrugInteractions as checkInteractionsData,
  searchLabTests as searchLabTestsData,
  searchICD10 as searchICD10Data,
  getNextTokenNumber,
} from './mock-data';

// Check if we're in mock mode
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

// Simulate network delay for realistic feel
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.random() * 300 + 100); // 100-400ms

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

/**
 * Pagination params
 */
interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response
 */
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// AUTH API
// ============================================

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    if (USE_MOCK) {
      await delay(500);

      // Demo credentials
      if (credentials.phone === '9876543210' && credentials.password === 'demo123') {
        return {
          success: true,
          data: {
            user: {
              id: 'user-001',
              tenantId: 'tenant-001',
              name: 'Dr. Priya Sharma',
              email: 'priya.sharma@healthfirst.in',
              phone: '9876543210',
              role: 'doctor',
              branchIds: ['branch-001', 'branch-002'],
              photoUrl: '/images/doctors/doctor-female-1.jpg',
              isActive: true,
              lastLoginAt: new Date().toISOString(),
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
          },
        };
      }

      // Receptionist login
      if (credentials.phone === '9876543220' && credentials.password === 'demo123') {
        return {
          success: true,
          data: {
            user: {
              id: 'user-002',
              tenantId: 'tenant-001',
              name: 'Rekha Singh',
              phone: '9876543220',
              role: 'receptionist',
              branchIds: ['branch-001'],
              isActive: true,
              lastLoginAt: new Date().toISOString(),
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
          },
        };
      }

      return {
        success: false,
        data: null as any,
        error: 'Invalid phone number or password',
      };
    }

    // Real API call would go here
    throw new Error('Real API not implemented');
  },

  logout: async (): Promise<ApiResponse<void>> => {
    if (USE_MOCK) {
      await delay(200);
      return { success: true, data: undefined };
    }
    throw new Error('Real API not implemented');
  },

  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    if (USE_MOCK) {
      await delay(200);
      return {
        success: true,
        data: { accessToken: 'mock-access-token-' + Date.now() },
      };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// CLINIC API
// ============================================

export const clinicApi = {
  getClinic: async (): Promise<ApiResponse<Clinic>> => {
    if (USE_MOCK) {
      await randomDelay();
      return { success: true, data: mockClinic };
    }
    throw new Error('Real API not implemented');
  },

  getBranches: async (): Promise<ApiResponse<Branch[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      return { success: true, data: mockBranches };
    }
    throw new Error('Real API not implemented');
  },

  getBranch: async (branchId: string): Promise<ApiResponse<Branch | null>> => {
    if (USE_MOCK) {
      await randomDelay();
      const branch = getBranchById(branchId);
      return { success: true, data: branch || null };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// DOCTORS API
// ============================================

export const doctorsApi = {
  list: async (branchId?: string): Promise<ApiResponse<Doctor[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const doctors = branchId
        ? getDoctorsByBranch(branchId)
        : mockDoctors.filter((d) => d.isActive);
      return { success: true, data: doctors };
    }
    throw new Error('Real API not implemented');
  },

  get: async (doctorId: string): Promise<ApiResponse<Doctor | null>> => {
    if (USE_MOCK) {
      await randomDelay();
      const doctor = getDoctorById(doctorId);
      return { success: true, data: doctor || null };
    }
    throw new Error('Real API not implemented');
  },

  getAvailableSlots: async (
    doctorId: string,
    date: string,
    branchId: string
  ): Promise<ApiResponse<string[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const doctor = getDoctorById(doctorId);
      if (!doctor) return { success: true, data: [] };

      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ] as const;
      const dayIndex = new Date(date).getDay();
      const dayOfWeek = dayNames[dayIndex] as keyof typeof doctor.availability;
      const daySlots = doctor.availability[dayOfWeek] || [];

      // Generate slots based on availability
      const slots: string[] = [];
      for (const period of daySlots) {
        const startParts = period.start.split(':');
        const endParts = period.end.split(':');
        let startHour = Number(startParts[0]) || 0;
        let startMin = Number(startParts[1]) || 0;
        const endHour = Number(endParts[0]) || 0;
        const endMin = Number(endParts[1]) || 0;

        while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
          slots.push(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
          startMin += doctor.slotDuration;
          if (startMin >= 60) {
            startHour += 1;
            startMin -= 60;
          }
        }
      }

      // Remove already booked slots
      const bookedAppts = getApptsByDateData(date, branchId).filter(
        (a) => a.doctorId === doctorId && a.status !== 'cancelled'
      );
      const bookedTimes = new Set(bookedAppts.map((a) => a.time));

      return {
        success: true,
        data: slots.filter((s) => !bookedTimes.has(s)),
      };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// PATIENTS API
// ============================================

export const patientsApi = {
  list: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PaginatedResponse<Patient>> => {
    if (USE_MOCK) {
      await randomDelay();
      let patients = [...mockPatients];

      if (params?.search) {
        patients = searchPatientsData(params.search);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const start = (page - 1) * limit;
      const paginatedData = patients.slice(start, start + limit);

      return {
        data: paginatedData,
        meta: {
          page,
          limit,
          total: patients.length,
          totalPages: Math.ceil(patients.length / limit),
        },
      };
    }
    throw new Error('Real API not implemented');
  },

  get: async (patientId: string): Promise<ApiResponse<Patient | null>> => {
    if (USE_MOCK) {
      await randomDelay();
      const patient = getPatientById(patientId);
      return { success: true, data: patient || null };
    }
    throw new Error('Real API not implemented');
  },

  search: async (query: string): Promise<ApiResponse<Patient[]>> => {
    if (USE_MOCK) {
      await delay(300);
      const results = searchPatientsData(query).slice(0, 10);
      return { success: true, data: results };
    }
    throw new Error('Real API not implemented');
  },

  getVisitHistory: async (patientId: string): Promise<ApiResponse<VisitHistory[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const history = getPatientVisitHistory(patientId);
      return { success: true, data: history };
    }
    throw new Error('Real API not implemented');
  },

  verifyAbha: async (
    abhaNumber: string
  ): Promise<
    ApiResponse<{ verified: boolean; name?: string; gender?: string; yearOfBirth?: string }>
  > => {
    if (USE_MOCK) {
      await delay(1500); // Longer delay for "API call" feel
      // Simulate ABDM verification
      if (abhaNumber.match(/^\d{2}-\d{4}-\d{4}-\d{4}$/)) {
        return {
          success: true,
          data: {
            verified: true,
            name: 'Verified Patient',
            gender: 'M',
            yearOfBirth: '1985',
          },
        };
      }
      return {
        success: false,
        data: { verified: false },
        error: 'Invalid ABHA number format',
      };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// APPOINTMENTS API
// ============================================

export const appointmentsApi = {
  getToday: async (branchId?: string, doctorId?: string): Promise<ApiResponse<Appointment[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const appointments = getTodayApptsData(branchId, doctorId);
      return { success: true, data: appointments };
    }
    throw new Error('Real API not implemented');
  },

  getByDate: async (date: string, branchId?: string): Promise<ApiResponse<Appointment[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const appointments = getApptsByDateData(date, branchId);
      return { success: true, data: appointments };
    }
    throw new Error('Real API not implemented');
  },

  get: async (appointmentId: string): Promise<ApiResponse<Appointment | null>> => {
    if (USE_MOCK) {
      await randomDelay();
      const appointment = mockAppointments.find((a) => a.id === appointmentId);
      return { success: true, data: appointment || null };
    }
    throw new Error('Real API not implemented');
  },

  checkIn: async (appointmentId: string): Promise<ApiResponse<Appointment>> => {
    if (USE_MOCK) {
      await delay(300);
      const appointment = mockAppointments.find((a) => a.id === appointmentId);
      if (appointment) {
        appointment.status = 'checked-in';
        appointment.checkedInAt = new Date().toISOString();
        appointment.updatedAt = new Date().toISOString();
      }
      return { success: true, data: appointment! };
    }
    throw new Error('Real API not implemented');
  },

  startConsultation: async (appointmentId: string): Promise<ApiResponse<Appointment>> => {
    if (USE_MOCK) {
      await delay(300);
      const appointment = mockAppointments.find((a) => a.id === appointmentId);
      if (appointment) {
        appointment.status = 'in-consultation';
        appointment.consultationStartedAt = new Date().toISOString();
        appointment.updatedAt = new Date().toISOString();
      }
      return { success: true, data: appointment! };
    }
    throw new Error('Real API not implemented');
  },

  complete: async (appointmentId: string): Promise<ApiResponse<Appointment>> => {
    if (USE_MOCK) {
      await delay(300);
      const appointment = mockAppointments.find((a) => a.id === appointmentId);
      if (appointment) {
        appointment.status = 'completed';
        appointment.completedAt = new Date().toISOString();
        appointment.updatedAt = new Date().toISOString();
      }
      return { success: true, data: appointment! };
    }
    throw new Error('Real API not implemented');
  },

  markNoShow: async (appointmentId: string): Promise<ApiResponse<Appointment>> => {
    if (USE_MOCK) {
      await delay(300);
      const appointment = mockAppointments.find((a) => a.id === appointmentId);
      if (appointment) {
        appointment.status = 'no-show';
        appointment.updatedAt = new Date().toISOString();

        // Update patient no-show count
        const patient = mockPatients.find((p) => p.id === appointment.patientId);
        if (patient) {
          patient.noShowCount += 1;
          if (patient.noShowCount >= 2) {
            patient.bookingStatus = 'warning';
          }
        }
      }
      return { success: true, data: appointment! };
    }
    throw new Error('Real API not implemented');
  },

  create: async (data: {
    patientId: string;
    doctorId: string;
    branchId: string;
    date: string;
    time: string;
    type: Appointment['type'];
    source: Appointment['source'];
    reason?: string;
  }): Promise<ApiResponse<Appointment>> => {
    if (USE_MOCK) {
      await delay(500);

      const doctor = getDoctorById(data.doctorId);
      const timeParts = data.time.split(':');
      const hours = Number(timeParts[0]) || 0;
      const mins = Number(timeParts[1]) || 0;
      const endMins = mins + (doctor?.slotDuration || 15);
      const endTime = `${String(hours + Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

      const patient = getPatientById(data.patientId);
      const isFirstVisit = patient ? patient.totalVisits === 0 : true;

      const newAppointment: Appointment = {
        id: `apt-new-${Date.now()}`,
        tenantId: 'tenant-001',
        branchId: data.branchId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: data.date,
        time: data.time,
        endTime,
        tokenNumber: getNextTokenNumber(data.branchId, data.doctorId),
        type: data.type,
        status: data.type === 'walk-in' ? 'checked-in' : 'scheduled',
        source: data.source,
        reason: data.reason,
        noShowRisk: patient?.noShowCount && patient.noShowCount >= 2 ? 'high' : 'low',
        isFirstVisit,
        isVip: patient ? patient.totalVisits >= 5 : false,
        checkedInAt: data.type === 'walk-in' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAppointments.push(newAppointment);
      return { success: true, data: newAppointment };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// DRUGS API
// ============================================

export const drugsApi = {
  search: async (query: string): Promise<ApiResponse<Drug[]>> => {
    if (USE_MOCK) {
      await delay(200);
      const results = searchDrugsData(query).slice(0, 15);
      return { success: true, data: results };
    }
    throw new Error('Real API not implemented');
  },

  checkInteractions: async (drugIds: string[]): Promise<ApiResponse<DrugInteraction[]>> => {
    if (USE_MOCK) {
      await delay(300);
      const interactions = checkInteractionsData(drugIds);
      return { success: true, data: interactions };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// LAB TESTS API
// ============================================

export const labTestsApi = {
  search: async (query: string): Promise<ApiResponse<LabTest[]>> => {
    if (USE_MOCK) {
      await delay(200);
      const results = searchLabTestsData(query);
      return { success: true, data: results };
    }
    throw new Error('Real API not implemented');
  },

  getCommon: async (): Promise<ApiResponse<LabTest[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const common = mockLabTests.filter((t) =>
        ['CBC', 'LFT', 'KFT', 'LIPID', 'TFT', 'HBA1C'].includes(t.code)
      );
      return { success: true, data: common };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// ICD-10 API
// ============================================

export const icd10Api = {
  search: async (query: string): Promise<ApiResponse<ICD10Code[]>> => {
    if (USE_MOCK) {
      await delay(200);
      const results = searchICD10Data(query);
      return { success: true, data: results };
    }
    throw new Error('Real API not implemented');
  },

  getCommon: async (): Promise<ApiResponse<ICD10Code[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      return { success: true, data: mockICD10Codes.slice(0, 10) };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// WHATSAPP API
// ============================================

export const whatsappApi = {
  getTemplates: async (
    category?: WhatsAppTemplate['category']
  ): Promise<ApiResponse<WhatsAppTemplate[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      let templates = mockWhatsAppTemplates.filter((t) => t.isActive);
      if (category) {
        templates = templates.filter((t) => t.category === category);
      }
      return { success: true, data: templates };
    }
    throw new Error('Real API not implemented');
  },

  sendMessage: async (_data: {
    patientId: string;
    templateId: string;
    variables: Record<string, string>;
  }): Promise<ApiResponse<{ messageId: string; status: string }>> => {
    if (USE_MOCK) {
      await delay(800);
      return {
        success: true,
        data: {
          messageId: `msg-${Date.now()}`,
          status: 'sent',
        },
      };
    }
    throw new Error('Real API not implemented');
  },
};

// ============================================
// ANALYTICS API (Mock data for charts)
// ============================================

export const analyticsApi = {
  getDashboardMetrics: async (): Promise<
    ApiResponse<{
      todayAppointments: { total: number; completed: number };
      todayRevenue: number;
      totalPatients: number;
      activeStaff: number;
    }>
  > => {
    if (USE_MOCK) {
      await randomDelay();
      const todayAppts = getTodayApptsData();
      return {
        success: true,
        data: {
          todayAppointments: {
            total: todayAppts.length,
            completed: todayAppts.filter((a) => a.status === 'completed').length,
          },
          todayRevenue: 45231,
          totalPatients: mockPatients.length,
          activeStaff: 8,
        },
      };
    }
    throw new Error('Real API not implemented');
  },

  getRevenueData: async (
    days: number = 7
  ): Promise<ApiResponse<{ date: string; revenue: number }[]>> => {
    if (USE_MOCK) {
      await randomDelay();
      const data: { date: string; revenue: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0] ?? '';
        data.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 30000) + 20000,
        });
      }
      return { success: true, data };
    }
    throw new Error('Real API not implemented');
  },

  getAppointmentStats: async (): Promise<
    ApiResponse<{
      byDay: { day: string; count: number }[];
      byStatus: { status: string; count: number }[];
      noShowRate: number;
    }>
  > => {
    if (USE_MOCK) {
      await randomDelay();
      return {
        success: true,
        data: {
          byDay: [
            { day: 'Mon', count: 24 },
            { day: 'Tue', count: 28 },
            { day: 'Wed', count: 22 },
            { day: 'Thu', count: 26 },
            { day: 'Fri', count: 30 },
            { day: 'Sat', count: 18 },
            { day: 'Sun', count: 8 },
          ],
          byStatus: [
            { status: 'Completed', count: 85 },
            { status: 'Scheduled', count: 45 },
            { status: 'Cancelled', count: 12 },
            { status: 'No-show', count: 8 },
          ],
          noShowRate: 5.3,
        },
      };
    }
    throw new Error('Real API not implemented');
  },
};
