import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { PersonResponse } from '@/features/person/domain/person.types';
import type { Belt } from '@/features/person/constants/person.constants';
import type { StudentEnrollmentCreateRequest, StudentEnrollmentSimpleResponse } from '@/features/student-enrollment/api/student-enrollment.dto';
import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type { UserDetail } from '@/features/user/api/user.dto';
import type { StudentStatus } from '../constants/student.constants';
import type { StudentSummary } from './student-summary.dto';

export interface GetStudentsParams {
  search?: string;
  status?: StudentStatus;
  scheduleIds?: string[];
  belts?: Belt[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface StudentCreateRequest {
  nationalCode?: string;
  studentStatus: StudentStatus;
  fullName: string;
  startDate: string;
  branchId: number;
  phoneNumber: string;
  birthDate: string;
  belt: Belt;
  enrollmentRequest?: StudentEnrollmentCreateRequest;
}

export interface StudentUpdateRequest {
  personId?: string;
  birthDate?: string;
  belt?: Belt;
  nationalCode?: string;
  fullName?: string;
  startDate?: string;
  studentStatus?: StudentStatus;
  branchId?: number;
}

export interface StudentOverview {
  personId: string;
  studentCode: string;
  faceImagePath: string | null;
  avatarUrl: string | null;
  nationalCode: string | null;
  fullName: string;
  birthDate: string;
  phoneNumber: string;
  belt: Belt;
  roleName: string;
  studentStatus: StudentStatus;
  branchName: string;
  classSchedules: ClassScheduleSummary[];
}

export interface StudentListResponse {
  activeStudentCount: number;
  reservedStudentCount: number;
  droppedStudentCount: number;
  students: PageResponse<StudentOverview>;
}

export interface StudentDetail extends PersonResponse {
  userDetails: UserDetail[];
  studentCode: string;
  startDate: string;
  studentStatus: StudentStatus;
  branchId: number;
  branchName: string;
  branchAddress: string;
  enrollments: StudentEnrollmentSimpleResponse[];
}

export type { StudentSummary };
