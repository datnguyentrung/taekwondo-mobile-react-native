import type { CourseResponse, CourseSimpleResponse } from '@/features/course/api/course.dto';
import type { SessionStatus } from '../constants/class-session.constants';

export interface SessionCreateRequest {
  courseId: string;
  sessionDate: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  note: string;
}

export type SessionUpdateRequest = SessionCreateRequest;

export interface ReopenAttendanceRequest {
  attendanceReopenedUntil: string;
}

export interface SessionResponse {
  classSessionId: string;
  course: CourseResponse;
  sessionDate: string;
  status: SessionStatus;
  attendanceClosed: boolean;
  attendanceReopenedUntil: string | null;
  startTime: string;
  endTime: string;
  note: string | null;
}

export interface SessionSimpleResponse {
  classSessionId: string;
  course: CourseSimpleResponse;
  sessionDate: string;
  status: SessionStatus;
  attendanceClosed: boolean;
  attendanceReopenedUntil: string | null;
  startTime: string;
  endTime: string;
}

export interface ClassSessionFilterParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
