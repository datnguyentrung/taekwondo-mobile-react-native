import type {
  SessionResponse,
  SessionSimpleResponse,
} from "@/features/class-session/api/class-session.dto";
import type {
  CourseStaffAssignmentResponse,
  CourseStaffAssignmentSimpleResponse,
} from "@/features/course-staff-assignment/api/course-staff-assignment.dto";
import type {
  StudentEnrollmentResponse,
  StudentEnrollmentSimpleResponse,
} from "@/features/student-enrollment/api/student-enrollment.dto";
import type { PageResponse } from "@/infrastructure/http/pagination.types";
import type {
  AttendanceStatus,
  EvaluationStatus,
} from "../constants/session-attendance.constants";

export interface AllowedActions {
  update: boolean;
  delete: boolean;
}

export interface SessionAttendanceResponse {
  sessionAttendanceId: string;
  studentAttendanceId?: string;
  classSession?: SessionResponse;
  classSessionId?: string;
  studentEnrollment?: StudentEnrollmentResponse | null;
  studentEnrollmentId?: string | null;
  courseStaffAssignment?: CourseStaffAssignmentResponse | null;
  courseStaffAssignmentId?: string | null;
  checkInTime: string | null;
  attendanceStatus: AttendanceStatus;
  evaluationStatus: EvaluationStatus | null;
  note: string | null;
  allowedActions: AllowedActions;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendanceSimpleResponse {
  sessionAttendanceId: string;
  classSession: SessionSimpleResponse;
  studentEnrollment: StudentEnrollmentSimpleResponse;
  courseStaffAssignment?: CourseStaffAssignmentSimpleResponse | null;
  checkInTime: string | null;
  attendanceStatus: AttendanceStatus;
  evaluationStatus: EvaluationStatus | null;
  note: string | null;
  allowedActions: AllowedActions;
  createdAt: Date;
}

export type StudentAttendanceResponse = SessionAttendanceResponse;
export type StudentAttendanceSimpleResponse = SessionAttendanceSimpleResponse;

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

export type SessionAttendanceListResponse =
  PageResponse<SessionAttendanceSimpleResponse>;
export type StudentAttendanceListResponse = SessionAttendanceListResponse;
