import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type { AttendanceStatus, EvaluationStatus } from '../constants/student-attendance.constants';

export interface AllowedActions {
  update: boolean;
  delete: boolean;
}

export interface StudentAttendanceResponse {
  studentAttendanceId: string;
  classSessionId: string;
  studentEnrollmentId: string;
  courseStaffAssignmentId: string | null;
  checkInTime: string | null;
  attendanceStatus: AttendanceStatus;
  evaluationStatus: EvaluationStatus | null;
  note: string | null;
  allowedActions: AllowedActions;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAttendanceCreateRequest {
  classSessionId: string;
  studentEnrollmentId: string;
  checkInTime: string;
  attendanceStatus: AttendanceStatus;
  evaluationStatus: EvaluationStatus;
  note: string;
}

export interface StudentAttendanceUpdateRequest {
  checkInTime: string;
  attendanceStatus: AttendanceStatus;
  evaluationStatus: EvaluationStatus;
  note: string;
}

export interface AttendanceFilterParams {
  from: string;
  to: string;
  courseId?: string;
  studentPersonId?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export type StudentAttendanceListResponse = PageResponse<StudentAttendanceResponse>;
