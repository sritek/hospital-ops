/**
 * Patients State Management
 * Handles patient search, selection, and profile data
 */

import { create } from 'zustand';
import { patientsApi } from '@/lib/api-client';
import type { Patient, VisitHistory } from '@/lib/mock-data/types';

interface PatientsState {
  // Data
  patients: Patient[];
  selectedPatient: Patient | null;
  visitHistory: VisitHistory[];
  searchResults: Patient[];

  // Pagination
  currentPage: number;
  totalPages: number;
  totalPatients: number;

  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // Actions
  fetchPatients: (page?: number, search?: string) => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  clearSearch: () => void;
  selectPatient: (patientId: string) => Promise<void>;
  clearSelectedPatient: () => void;
  fetchVisitHistory: (patientId: string) => Promise<void>;

  // ABHA verification
  verifyAbha: (abhaNumber: string) => Promise<{ verified: boolean; data?: any }>;
}

export const usePatientsStore = create<PatientsState>()((set, get) => ({
  patients: [],
  selectedPatient: null,
  visitHistory: [],
  searchResults: [],
  currentPage: 1,
  totalPages: 1,
  totalPatients: 0,
  isLoading: false,
  isSearching: false,
  error: null,

  fetchPatients: async (page = 1, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await patientsApi.list({ page, limit: 20, search });
      set({
        patients: response.data,
        currentPage: response.meta.page,
        totalPages: response.meta.totalPages,
        totalPatients: response.meta.total,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch patients' });
    } finally {
      set({ isLoading: false });
    }
  },

  searchPatients: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true });
    try {
      const response = await patientsApi.search(query);
      if (response.success) {
        set({ searchResults: response.data });
      }
    } catch {
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [] });
  },

  selectPatient: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await patientsApi.get(patientId);
      if (response.success && response.data) {
        set({ selectedPatient: response.data });
        // Also fetch visit history
        get().fetchVisitHistory(patientId);
      } else {
        set({ error: 'Patient not found' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch patient' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearSelectedPatient: () => {
    set({ selectedPatient: null, visitHistory: [] });
  },

  fetchVisitHistory: async (patientId: string) => {
    try {
      const response = await patientsApi.getVisitHistory(patientId);
      if (response.success) {
        set({ visitHistory: response.data });
      }
    } catch {
      set({ visitHistory: [] });
    }
  },

  verifyAbha: async (abhaNumber: string) => {
    try {
      const response = await patientsApi.verifyAbha(abhaNumber);
      return {
        verified: response.success && response.data.verified,
        data: response.data,
      };
    } catch {
      return { verified: false };
    }
  },
}));

// Selector hooks
export const usePatientsList = () => usePatientsStore((state) => state.patients);
export const useSelectedPatient = () => usePatientsStore((state) => state.selectedPatient);
export const usePatientVisitHistory = () => usePatientsStore((state) => state.visitHistory);
export const usePatientSearchResults = () => usePatientsStore((state) => state.searchResults);
