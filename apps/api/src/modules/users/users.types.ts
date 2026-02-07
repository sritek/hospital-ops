/**
 * Users Module Types
 */

import type { User, UserRole, UserBranch, Branch } from '@prisma/client';

export interface UserResponse {
  id: string;
  tenantId: string;
  email: string | null;
  phone: string;
  name: string;
  gender: string | null;
  avatarUrl: string | null;
  role: UserRole;
  registrationNumber: string | null;
  registrationCouncil: string | null;
  specialization: string | null;
  qualification: string | null;
  hprId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  branches?: BranchAssignment[];
}

export interface BranchAssignment {
  branchId: string;
  branchName: string;
  branchCode: string;
  isPrimary: boolean;
}

export interface CreateUserDto {
  email?: string;
  phone: string;
  password: string;
  name: string;
  gender?: string;
  role: UserRole;
  registrationNumber?: string;
  registrationCouncil?: string;
  specialization?: string;
  qualification?: string;
  branchIds: string[];
  primaryBranchId?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  gender?: string;
  role?: UserRole;
  registrationNumber?: string;
  registrationCouncil?: string;
  specialization?: string;
  qualification?: string;
  isActive?: boolean;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
}

export interface AssignBranchesDto {
  branchIds: string[];
  primaryBranchId?: string;
}

type UserWithBranches = User & {
  userBranches: (UserBranch & { branch: Branch })[];
};

export function toUserResponse(user: User, branches?: BranchAssignment[]): UserResponse {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    phone: user.phone,
    name: user.name,
    gender: user.gender,
    avatarUrl: user.avatarUrl,
    role: user.role,
    registrationNumber: user.registrationNumber,
    registrationCouncil: user.registrationCouncil,
    specialization: user.specialization,
    qualification: user.qualification,
    hprId: user.hprId,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    branches,
  };
}

export function toUserResponseWithBranches(user: UserWithBranches): UserResponse {
  const branches: BranchAssignment[] = user.userBranches.map((ub) => ({
    branchId: ub.branchId,
    branchName: ub.branch.name,
    branchCode: ub.branch.code,
    isPrimary: ub.isPrimary,
  }));

  return toUserResponse(user, branches);
}
