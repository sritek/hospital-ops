/**
 * Demo State Management
 * Tracks demo mode and allows resetting to initial state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoState {
  isDemo: boolean;
  demoStartedAt: string | null;

  // Track modifications for potential reset
  modifiedAppointmentIds: string[];
  modifiedPatientIds: string[];

  // Actions
  startDemo: () => void;
  endDemo: () => void;
  trackAppointmentChange: (appointmentId: string) => void;
  trackPatientChange: (patientId: string) => void;
  resetDemo: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      isDemo: true, // Default to demo mode
      demoStartedAt: null,
      modifiedAppointmentIds: [],
      modifiedPatientIds: [],

      startDemo: () => {
        set({
          isDemo: true,
          demoStartedAt: new Date().toISOString(),
          modifiedAppointmentIds: [],
          modifiedPatientIds: [],
        });
      },

      endDemo: () => {
        set({
          isDemo: false,
          demoStartedAt: null,
        });
      },

      trackAppointmentChange: (appointmentId: string) => {
        const current = get().modifiedAppointmentIds;
        if (!current.includes(appointmentId)) {
          set({ modifiedAppointmentIds: [...current, appointmentId] });
        }
      },

      trackPatientChange: (patientId: string) => {
        const current = get().modifiedPatientIds;
        if (!current.includes(patientId)) {
          set({ modifiedPatientIds: [...current, patientId] });
        }
      },

      resetDemo: () => {
        // Clear all localStorage data
        if (typeof window !== 'undefined') {
          // Clear specific stores
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('demo-storage');
          localStorage.removeItem('appointments-storage');
          localStorage.removeItem('patients-storage');

          // Reload the page to reset mock data
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'demo-storage',
      partialize: (state) => ({
        isDemo: state.isDemo,
        demoStartedAt: state.demoStartedAt,
      }),
    }
  )
);

// Helper to check if we're in demo mode
export const isDemoMode = () => {
  if (typeof window === 'undefined') return true;
  return process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';
};
