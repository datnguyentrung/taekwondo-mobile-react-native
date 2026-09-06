import type { CoachDetail } from '@/features/coach/api/coach.dto';
import type { CoachTimesheetResponse } from '@/features/coach-timesheet/api/coach-timesheet.dto';
import type { StudentDetail } from '@/features/student/api/student.dto';
import type { StudentAttendanceResponse } from '@/features/student-attendance/api/student-attendance.dto';
import type { Belt, PersonStatus } from '../constants/person.constants';
import type { PersonResponse } from '../domain/person.types';

export interface PersonCreateRequest {
  fullName: string;
  gender: boolean;
  birthDate: string;
  email?: string | null;
  nationalCode?: string | null;
  faceImagePath?: string | null;
  currentBelt: Belt;
  status: PersonStatus;
  startDate: string;
}

export interface PersonUpdateRequest extends PersonCreateRequest {
  personCode?: string | null;
}

export interface PersonSearchItem {
  personId: string;
  fullName: string;
  birthDate: string;
  belt: string;
  personType: string;
  code: string;
  status: string;
}

export interface FaceCheckInResult {
  personType: string;
  checkInSuccess: boolean;
  checkInErrorCode: string | null;
  checkInErrorMessage: string | null;
  studentDetail: StudentDetail | null;
  coachDetail: CoachDetail | null;
  studentAttendance: StudentAttendanceResponse | null;
  coachTimesheet: CoachTimesheetResponse | null;
}
export interface FaceEmbeddingUpdateResponse {
  personId: string;
  dimension: number;
  model: string;
  faceImagePath: string;
  avatarUrl: string;
  updatedAt: string;
}

export interface FaceImageUrlResponse {
  avatarUrl: string;
}

export type { PersonResponse };

export interface PersonSearchParams {
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  sort?: string | string[];
}
