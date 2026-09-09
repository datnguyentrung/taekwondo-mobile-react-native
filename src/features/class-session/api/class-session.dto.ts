import type { SessionStatus } from '../constants/class-session.constants';

export interface SessionCreateRequest {
  courseId: string;
  sessionDate: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  note: string;
}

export interface SessionUpdateRequest {
  courseId: string;
  sessionDate: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  note: string;
}

export interface ReopenAttendanceRequest {
  attendanceReopenedUntil: string;
}

export interface SessionResponse {
  classSessionId: string;
  courseId: string;
  sessionDate: string;
  status: SessionStatus;
  attendanceClosed: boolean;
  attendanceReopenedUntil: string | null;
  startTime: string;
  endTime: string;
  note: string | null;
}

export interface ClassSessionFilterParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
