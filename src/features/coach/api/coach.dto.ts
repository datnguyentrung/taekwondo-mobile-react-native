import type { CoachAssignmentCreateRequest, CoachAssignmentSimpleResponse } from '@/features/coach-assignment/api/coach-assignment.dto';
import type { PersonResponse } from '@/features/person/domain/person.types';
import type { Belt } from '@/features/person/constants/person.constants';
import type { UserDetail } from '@/features/user/api/user.dto';
import type { CoachStatus } from '../constants/coach.constants';
import type { CoachSummary } from './coach-summary.dto';

export interface CoachCreateRequest {
  coachStatus?: CoachStatus;
  fullName: string;
  phoneNumber: string;
  birthDate: string;
  belt: Belt;
  email: string;
  roleCode?: string;
  assignmentRequest?: CoachAssignmentCreateRequest;
}

export interface CoachUpdateRequest {
  personId?: string;
  phoneNumber?: string;
  birthDate?: string;
  belt?: Belt;
  nationalCode?: string;
  fullName?: string;
  coachStatus?: CoachStatus;
}

export interface CoachDetail extends PersonResponse {
  userDetails: UserDetail[];
  email: string;
  staffCode: string;
  coachStatus: CoachStatus;
  currentAssignments: CoachAssignmentSimpleResponse[];
}

export type { CoachSummary };
