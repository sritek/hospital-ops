/**
 * Appointments State Management
 * Handles appointment queue, status updates, and real-time state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { appointmentsApi } from '@/lib/api-client';
import type { Appointment, AppointmentStatus } from '@/lib/mock-data/types';

interface AppointmentsState {
  // Data
  todayAppointments: Appointment[];
  selectedAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodayAppointments: (branchId?: string, doctorId?: string) => Promise<void>;
  setSelectedAppointment: (appointment: Appointment | null) => void;

  // Status updates
  checkIn: (appointmentId: string) => Promise<boolean>;
  startConsultation: (appointmentId: string) => Promise<boolean>;
  completeConsultation: (appointmentId: string) => Promise<boolean>;
  markNoShow: (appointmentId: string) => Promise<boolean>;

  // Create
  createWalkIn: (data: {
    patientId: string;
    doctorId: string;
    branchId: string;
    reason?: string;
  }) => Promise<Appointment | null>;

  // Helpers
  getQueueByDoctor: (doctorId: string) => Appointment[];
  getQueueByStatus: (status: AppointmentStatus) => Appointment[];
  getWaitingCount: () => number;
  getInConsultationCount: () => number;
}

export const useAppointmentsStore = create<AppointmentsState>()(
  persist(
    (set, get) => ({
      todayAppointments: [],
      selectedAppointment: null,
      isLoading: false,
      error: null,

      fetchTodayAppointments: async (branchId?: string, doctorId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await appointmentsApi.getToday(branchId, doctorId);
          if (response.success) {
            set({ todayAppointments: response.data });
          } else {
            set({ error: 'Failed to fetch appointments' });
          }
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch appointments' });
        } finally {
          set({ isLoading: false });
        }
      },

      setSelectedAppointment: (appointment) => {
        set({ selectedAppointment: appointment });
      },

      checkIn: async (appointmentId: string) => {
        try {
          const response = await appointmentsApi.checkIn(appointmentId);
          if (response.success) {
            // Update local state
            set((state) => ({
              todayAppointments: state.todayAppointments.map((apt) =>
                apt.id === appointmentId
                  ? {
                      ...apt,
                      status: 'checked-in' as AppointmentStatus,
                      checkedInAt: new Date().toISOString(),
                    }
                  : apt
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      startConsultation: async (appointmentId: string) => {
        try {
          const response = await appointmentsApi.startConsultation(appointmentId);
          if (response.success) {
            set((state) => ({
              todayAppointments: state.todayAppointments.map((apt) =>
                apt.id === appointmentId
                  ? {
                      ...apt,
                      status: 'in-consultation' as AppointmentStatus,
                      consultationStartedAt: new Date().toISOString(),
                    }
                  : apt
              ),
              selectedAppointment:
                state.selectedAppointment?.id === appointmentId
                  ? { ...state.selectedAppointment, status: 'in-consultation' as AppointmentStatus }
                  : state.selectedAppointment,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      completeConsultation: async (appointmentId: string) => {
        try {
          const response = await appointmentsApi.complete(appointmentId);
          if (response.success) {
            set((state) => ({
              todayAppointments: state.todayAppointments.map((apt) =>
                apt.id === appointmentId
                  ? {
                      ...apt,
                      status: 'completed' as AppointmentStatus,
                      completedAt: new Date().toISOString(),
                    }
                  : apt
              ),
              selectedAppointment: null,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      markNoShow: async (appointmentId: string) => {
        try {
          const response = await appointmentsApi.markNoShow(appointmentId);
          if (response.success) {
            set((state) => ({
              todayAppointments: state.todayAppointments.map((apt) =>
                apt.id === appointmentId ? { ...apt, status: 'no-show' as AppointmentStatus } : apt
              ),
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      createWalkIn: async (data) => {
        try {
          const today = new Date().toISOString().split('T')[0] ?? '';
          const now = new Date();
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const response = await appointmentsApi.create({
            ...data,
            date: today,
            time,
            type: 'walk-in',
            source: 'walk-in',
          });

          if (response.success) {
            set((state) => ({
              todayAppointments: [...state.todayAppointments, response.data].sort((a, b) =>
                a.time.localeCompare(b.time)
              ),
            }));
            return response.data;
          }
          return null;
        } catch {
          return null;
        }
      },

      getQueueByDoctor: (doctorId: string) => {
        return get().todayAppointments.filter((apt) => apt.doctorId === doctorId);
      },

      getQueueByStatus: (status: AppointmentStatus) => {
        return get().todayAppointments.filter((apt) => apt.status === status);
      },

      getWaitingCount: () => {
        return get().todayAppointments.filter(
          (apt) => apt.status === 'checked-in' || apt.status === 'scheduled'
        ).length;
      },

      getInConsultationCount: () => {
        return get().todayAppointments.filter((apt) => apt.status === 'in-consultation').length;
      },
    }),
    {
      name: 'appointments-storage',
      partialize: (state) => ({
        // Only persist selected appointment for page refreshes
        selectedAppointment: state.selectedAppointment,
      }),
    }
  )
);

// Selector hooks
export const useTodayAppointments = () => useAppointmentsStore((state) => state.todayAppointments);
export const useSelectedAppointment = () =>
  useAppointmentsStore((state) => state.selectedAppointment);
export const useAppointmentsLoading = () => useAppointmentsStore((state) => state.isLoading);
