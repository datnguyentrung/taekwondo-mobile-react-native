import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { SessionStatus } from '../constants/class-session.constants';

export interface SessionCreateRequest {
  courseId?: string;
  scheduleId?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  status?: SessionStatus;
  attendanceClosed?: boolean;
  isAttendanceClosed?: boolean;
}

export interface SessionUpdateRequest {
  courseId?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  status?: SessionStatus;
  attendanceClosed?: boolean;
  isAttendanceClosed?: boolean;
}

export interface SessionResponse {
  classSessionId?: string;
  courseId?: string;
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  note: string | null;
  status: SessionStatus;
  attendanceClosed?: boolean;
  isAttendanceClosed: boolean;
  classSchedule?: ClassScheduleSummary;
}

export interface ClassSessionFilterParams {
  search?: string;
  sessionDate?: string;
  isAttendanceClosed?: boolean;
  scheduleIds?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  sort?: string | string[];
}
