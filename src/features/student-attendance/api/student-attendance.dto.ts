import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type { AttendanceStatus, EvaluationStatus } from '../constants/student-attendance.constants';

export interface AllowedActions {
  update: boolean;
  delete: boolean;
}

export interface SessionAttendanceResponse {
  sessionAttendanceId: string;
  studentAttendanceId?: string;
  classSessionId: string;
  studentEnrollmentId: string | null;
  courseStaffAssignmentId: string | null;
  checkInTime: string | null;
  attendanceStatus: AttendanceStatus;
  evaluationStatus: EvaluationStatus | null;
  note: string | null;
  allowedActions: AllowedActions;
  createdAt: string;
  updatedAt: string;
}

export type StudentAttendanceResponse = SessionAttendanceResponse;

export interface SessionAttendanceCreateRequest {
  classSessionId: string;
  studentEnrollmentId?: string | null;
  courseStaffAssignmentId?: string | null;
  checkInTime?: string | null;
  attendanceStatus: AttendanceStatus;
  evaluationStatus?: EvaluationStatus | null;
  note?: string | null;
}

export type StudentAttendanceCreateRequest = SessionAttendanceCreateRequest;

export interface SessionAttendanceUpdateRequest {
  checkInTime?: string | null;
  attendanceStatus: AttendanceStatus;
  evaluationStatus?: EvaluationStatus | null;
  note?: string | null;
}

export type StudentAttendanceUpdateRequest = SessionAttendanceUpdateRequest;

export interface AttendanceFilterParams {
  from?: string;
  to?: string;
  courseId?: string;
  studentPersonId?: string;
  staffPersonId?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export type SessionAttendanceFilterParams = AttendanceFilterParams;

export type SessionAttendanceListResponse = PageResponse<SessionAttendanceResponse>;
export type StudentAttendanceListResponse = SessionAttendanceListResponse;
