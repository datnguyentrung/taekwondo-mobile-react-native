import type { CoachAssignmentResponse } from '@/features/coach-assignment/api/coach-assignment.dto';
import type { Belt } from '@/features/person/constants/person.constants';
import type { RelationshipType } from '@/features/authentication/domain/auth.types';
import type { UserStatus } from '../constants/user.constants';

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserCreateRequest {
  phoneNumber: string;
  roleCodes: string[];
}

export interface UserInfo {
  idUser: string;
  userCode: string;
  idRole: string;
  assignedClasses: CoachAssignmentResponse[] | null;
}

export interface UserProfileSummary {
  birthDate: string;
  isActive: boolean;
  name: string;
  phone: string;
  belt: Belt;
}

export interface UserResponse {
  userInfo: UserInfo;
  userProfile: UserProfileSummary;
}

export interface UserDetail {
  userId: string;
  birthDate: string | null;
  phoneNumber: string | null;
  belt: Belt | null;
  status: UserStatus | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
  roles: string[] | null;
  fullName: string | null;
  relationshipType: RelationshipType | null;
  active: boolean | null;
  gender: boolean | null;
}
