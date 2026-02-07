/**
 * Auth API Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@hospital-ops/shared';

interface LoginInput {
  phone: string;
  password: string;
}

interface RegisterInput {
  phone: string;
  password: string;
  name: string;
  facilityName: string;
  email?: string;
}

interface RequestOtpInput {
  phone: string;
  purpose: 'login' | 'reset_password' | 'register';
}

interface VerifyOtpInput {
  phone: string;
  code: string;
  purpose: 'login' | 'reset_password' | 'register';
}

interface ResetPasswordInput {
  phone: string;
  code: string;
  newPassword: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface AuthResponse {
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string | null;
    phone: string;
    role: UserRole;
    branchIds: string[];
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await api.post<AuthResponse>('/auth/login', input);
      return response.data!;
    },
    onSuccess: (data) => {
      setAuth(
        {
          ...data.user,
          email: data.user.email ?? undefined,
          isActive: data.user.isActive ?? true,
          createdAt: data.user.createdAt ?? new Date().toISOString(),
          updatedAt: data.user.updatedAt ?? new Date().toISOString(),
        },
        data.accessToken
      );
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const response = await api.post<AuthResponse>('/auth/register', input);
      return response.data!;
    },
    onSuccess: (data) => {
      setAuth(
        {
          ...data.user,
          email: data.user.email ?? undefined,
          isActive: data.user.isActive ?? true,
          createdAt: data.user.createdAt ?? new Date().toISOString(),
          updatedAt: data.user.updatedAt ?? new Date().toISOString(),
        },
        data.accessToken
      );
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (input: RequestOtpInput) => {
      const response = await api.post<{ message: string }>('/auth/request-otp', input);
      return response.data!;
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (input: VerifyOtpInput) => {
      const response = await api.post<{ verified: boolean }>('/auth/verify-otp', input);
      return response.data!;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: ResetPasswordInput) => {
      const response = await api.post<{ message: string }>('/auth/reset-password', input);
      return response.data!;
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const response = await api.post<{ message: string }>('/auth/change-password', input);
      return response.data!;
    },
  });
}

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<AuthResponse['user']>('/auth/me');
      return response.data!;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRefreshToken() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ accessToken: string }>('/auth/refresh');
      return response.data!;
    },
    onSuccess: (data) => {
      if (user) {
        setAuth(user, data.accessToken);
      }
    },
  });
}
