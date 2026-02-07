---
# Frontend patterns - Next.js, React, shadcn/ui, TanStack Query
inclusion: fileMatch
fileMatchPattern: "apps/web/**/*.tsx, apps/web/**/*.ts, apps/booking/**/*.tsx, apps/booking/**/*.ts"
---

# Frontend Patterns Guide

## Overview

This document covers frontend development patterns for Hospital-Ops using Next.js 15 App Router, React 19, shadcn/ui, and TanStack Query.

---

## 1. Project Structure

```
apps/web/src/
├── app/
│   ├── (auth)/                    # Auth layout group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   └── layout.tsx
│   ├── (dashboard)/               # Dashboard layout group
│   │   ├── patients/
│   │   │   ├── page.tsx           # List view
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx       # Detail view
│   │   │   └── new/
│   │   │       └── page.tsx       # Create form
│   │   ├── appointments/
│   │   ├── opd/
│   │   ├── ipd/
│   │   ├── pharmacy/
│   │   ├── laboratory/
│   │   ├── billing/
│   │   ├── staff/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── layout.tsx                 # Root layout
│   ├── loading.tsx                # Global loading
│   ├── error.tsx                  # Global error
│   └── not-found.tsx
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── forms/                     # Form components
│   │   ├── patient-form.tsx
│   │   ├── appointment-form.tsx
│   │   └── ...
│   ├── tables/                    # Table components
│   │   ├── patients-table.tsx
│   │   ├── data-table.tsx
│   │   └── ...
│   ├── charts/                    # Chart components
│   ├── layouts/                   # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── ...
│   └── shared/                    # Shared components
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       └── ...
├── hooks/                         # Custom hooks
│   ├── use-auth.ts
│   ├── use-patients.ts
│   ├── use-debounce.ts
│   └── ...
├── lib/                           # Utilities
│   ├── api-client.ts
│   ├── utils.ts
│   ├── validators.ts
│   └── ...
├── stores/                        # Zustand stores
│   ├── auth-store.ts
│   ├── ui-store.ts
│   └── ...
├── types/                         # TypeScript types
│   ├── api.ts
│   ├── patient.ts
│   └── ...
└── styles/
    └── globals.css
```

---

## 2. API Client Setup

### Fetch-based API Client

```typescript
// lib/api-client.ts
import { getSession } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Get token from session/cookie
    const session = await getSession();
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error?.code || "API_ERROR",
          data.error?.message || "An error occurred",
          response.status,
          data.error?.details,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NETWORK_ERROR", "Network error occurred", 0);
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient(API_BASE_URL);
```

---

## 3. TanStack Query Setup

### Query Client Provider

```typescript
// lib/query-client.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Keys Factory

```typescript
// lib/query-keys.ts
export const queryKeys = {
  // Patients
  patients: {
    all: ["patients"] as const,
    lists: () => [...queryKeys.patients.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.patients.lists(), filters] as const,
    details: () => [...queryKeys.patients.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
    appointments: (id: string) =>
      [...queryKeys.patients.detail(id), "appointments"] as const,
  },

  // Appointments
  appointments: {
    all: ["appointments"] as const,
    lists: () => [...queryKeys.appointments.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.appointments.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.appointments.all, "detail", id] as const,
    slots: (doctorId: string, date: string) =>
      [...queryKeys.appointments.all, "slots", doctorId, date] as const,
  },

  // Doctors
  doctors: {
    all: ["doctors"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.doctors.all, "list", filters] as const,
    schedule: (doctorId: string) =>
      [...queryKeys.doctors.all, "schedule", doctorId] as const,
  },

  // Bills
  bills: {
    all: ["bills"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.bills.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.bills.all, "detail", id] as const,
  },

  // User/Auth
  user: {
    current: ["user", "current"] as const,
    permissions: ["user", "permissions"] as const,
  },
};
```

---

## 4. Custom Hooks Pattern

### Data Fetching Hook

```typescript
// hooks/use-patients.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
} from "@/types/patient";

interface UsePatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function usePatientList(params: UsePatientListParams = {}) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: async () => {
      const response = await api.get<Patient[]>("/patients", params);
      return response;
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: async () => {
      const response = await api.get<Patient>(`/patients/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePatientInput) => {
      const response = await api.post<Patient>("/patients", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      toast.success("Patient created successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePatientInput;
    }) => {
      const response = await api.patch<Patient>(`/patients/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      toast.success("Patient updated successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      toast.success("Patient deleted successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}
```

### Auth Hook

```typescript
// hooks/use-auth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.user.current,
    queryFn: async () => {
      const response = await api.get<User>("/auth/me");
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { phone: string; password: string }) => {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials,
      );
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      queryClient.setQueryData(queryKeys.user.current, data.user);
      toast.success("Login successful");
      router.push("/dashboard");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    },
  });
}
```

---

## 5. Zustand Store Pattern

### Auth Store

```typescript
// stores/auth-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  tenantId: string;
  branches: Array<{ id: string; name: string; isPrimary: boolean }>;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

### UI Store

```typescript
// stores/ui-store.ts
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentBranchId: string | null;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentBranch: (branchId: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  currentBranchId: null,
  theme: "system",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentBranch: (branchId) => set({ currentBranchId: branchId }),
  setTheme: (theme) => set({ theme }),
}));
```

---

## 6. Form Patterns with React Hook Form + Zod

### Form Component Pattern

```typescript
// components/forms/patient-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreatePatient, useUpdatePatient } from '@/hooks/use-patients';
import type { Patient } from '@/types/patient';

const patientSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional().or(z.literal('')),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: () => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const isEditing = !!patient;

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      phone: patient?.phone || '',
      name: patient?.name || '',
      email: patient?.email || '',
      gender: patient?.gender as any,
      dateOfBirth: patient?.dateOfBirth?.split('T')[0] || '',
      bloodGroup: patient?.bloodGroup as any,
      address: patient?.address || '',
      city: patient?.city || '',
      state: patient?.state || '',
      pincode: patient?.pincode || '',
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      if (isEditing) {
        await updatePatient.mutateAsync({ id: patient.id, data });
      } else {
        await createPatient.mutateAsync(data);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createPatient.isPending || updatePatient.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" {...field} disabled={isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Patient name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bloodGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update Patient' : 'Create Patient'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 7. Data Table Pattern

### Reusable Data Table

```typescript
// components/tables/data-table.tsx
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onSearch,
  pagination,
  onPageChange,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: !!pagination,
  });

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {onSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Patients Table Example

```typescript
// components/tables/patients-table.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/types/patient';

interface PatientsTableProps {
  data: Patient[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onSearch?: (value: string) => void;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function PatientsTable({ data, pagination, onSearch, onPageChange, isLoading }: PatientsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.gender || '-'}</span>
      ),
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Age',
      cell: ({ row }) => {
        if (!row.original.dateOfBirth) return '-';
        const age = Math.floor(
          (Date.now() - new Date(row.original.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        return `${age} years`;
      },
    },
    {
      accessorKey: 'bookingStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.bookingStatus;
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          normal: 'default',
          warning: 'secondary',
          prepaid_only: 'outline',
          blocked: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'abhaNumber',
      header: 'ABHA',
      cell: ({ row }) => row.original.abhaNumber || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/patients/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/patients/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search patients..."
      onSearch={onSearch}
      pagination={pagination}
      onPageChange={onPageChange}
      isLoading={isLoading}
    />
  );
}
```

---

## 8. Page Component Pattern

### List Page

```typescript
// app/(dashboard)/patients/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientList } from '@/hooks/use-patients';
import { PatientsTable } from '@/components/tables/patients-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function PatientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = usePatientList({
    page,
    limit: 20,
    search: debouncedSearch,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">Manage patient records</p>
        </div>
        <Button onClick={() => router.push('/patients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <PatientsTable
        data={data?.data || []}
        pagination={data?.meta}
        onSearch={setSearch}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Detail Page

```typescript
// app/(dashboard)/patients/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/use-patients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(params.id as string);

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{patient.name}</h1>
            <p className="text-muted-foreground">{patient.phone}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="lab-reports">Lab Reports</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize">{patient.gender || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span>{patient.dateOfBirth || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span>{patient.bloodGroup || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{patient.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span>{patient.city || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Medical</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allergies</span>
                  <span>{patient.allergies?.join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ABHA</span>
                  <span>{patient.abhaNumber || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          {/* Appointments list */}
        </TabsContent>

        <TabsContent value="prescriptions">
          {/* Prescriptions list */}
        </TabsContent>

        <TabsContent value="lab-reports">
          {/* Lab reports list */}
        </TabsContent>

        <TabsContent value="billing">
          {/* Billing history */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}
```

---

## 9. Layout Components

### Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layouts/sidebar';
import { Header } from '@/components/layouts/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Sidebar Component

```typescript
// components/layouts/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useCurrentUser } from '@/hooks/use-auth';
import {
  Users, Calendar, Stethoscope, Bed, FlaskConical, Pill,
  Receipt, UserCog, BarChart3, Settings, ChevronLeft
} from 'lucide-react';

const navigation = [
  { name: 'Patients', href: '/patients', icon: Users, permission: 'patients:read' },
  { name: 'Appointments', href: '/appointments', icon: Calendar, permission: 'appointments:read' },
  { name: 'OPD', href: '/opd', icon: Stethoscope, permission: 'consultations:read' },
  { name: 'IPD', href: '/ipd', icon: Bed, permission: 'ipd:read' },
  { name: 'Laboratory', href: '/laboratory', icon: FlaskConical, permission: 'lab_orders:read' },
  { name: 'Pharmacy', href: '/pharmacy', icon: Pill, permission: 'pharmacy:read' },
  { name: 'Billing', href: '/billing', icon: Receipt, permission: 'billing:read' },
  { name: 'Staff', href: '/staff', icon: UserCog, permission: 'users:read' },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports:read' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { data: user } = useCurrentUser();

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    if (user?.role === 'super_admin') return true;
    // Check user permissions
    return true; // Simplified
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold">Hospital-Ops</span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded hover:bg-muted"
        >
          <ChevronLeft className={cn('h-5 w-5 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          if (!hasPermission(item.permission)) return null;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

## 10. Utility Functions

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Indian number formatting
export function formatIndianNumber(num: number): string {
  const str = num.toString();
  let result = "";
  let count = 0;

  for (let i = str.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result = "," + result;
    }
    result = str[i] + result;
    count++;
  }

  return result;
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return `₹${formatIndianNumber(Math.round(amount))}`;
}

// Date formatting (Indian format)
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  });
}

// Time formatting
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Phone masking (for privacy)
export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return phone.slice(0, 2) + "****" + phone.slice(-4);
}
```

---

## Summary

This frontend patterns guide covers:

1. **Project Structure**: App Router organization
2. **API Client**: Fetch-based with error handling
3. **TanStack Query**: Setup and query keys
4. **Custom Hooks**: Data fetching patterns
5. **Zustand Stores**: State management
6. **Form Patterns**: React Hook Form + Zod
7. **Data Tables**: TanStack Table integration
8. **Page Components**: List and detail patterns
9. **Layout Components**: Sidebar and header
10. **Utilities**: Indian formatting helpers

Key principles:

- Server components by default, client when needed
- Type-safe data fetching with TanStack Query
- Form validation with Zod schemas
- Consistent UI with shadcn/ui components
- Indian locale formatting (₹, DD/MM/YYYY)
