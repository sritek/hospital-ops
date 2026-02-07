/**
 * Auth State Management with Zustand
 *
 * Supports both mock (demo) and real API authentication.
 * In demo mode, uses the mock API client.
 * In production, uses the real API.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api-client';
import type { User } from '@/lib/mock-data/types';

// Re-export User type for convenience
export type { User };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Selected branch for multi-branch users
  selectedBranchId: string | null;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedBranch: (branchId: string) => void;

  // API Actions
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      selectedBranchId: null,

      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          error: null,
          // Set default branch if user has branches
          selectedBranchId: user.branchIds?.[0] || null,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          selectedBranchId: null,
          error: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setSelectedBranch: (branchId) => {
        const user = get().user;
        if (user && user.branchIds.includes(branchId)) {
          set({ selectedBranchId: branchId });
        }
      },

      login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ phone, password });

          if (response.success && response.data) {
            const { user, accessToken } = response.data;
            get().setAuth(user, accessToken);
            return true;
          } else {
            set({ error: response.error || 'Login failed' });
            return false;
          }
        } catch (err: any) {
          set({ error: err.message || 'Login failed. Please try again.' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          get().clearAuth();
        }
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken();
          if (response.success && response.data) {
            set({ accessToken: response.data.accessToken });
          }
        } catch {
          get().clearAuth();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedBranchId: state.selectedBranchId,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useSelectedBranchId = () => useAuthStore((state) => state.selectedBranchId);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
