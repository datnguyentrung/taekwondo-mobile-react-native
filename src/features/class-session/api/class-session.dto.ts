import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { SessionStatus } from '../constants/class-session.constants';

export interface SessionCreateRequest {
  scheduleId: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  status?: SessionStatus;
  isAttendanceClosed?: boolean;
}

export interface SessionUpdateRequest {
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  status?: SessionStatus;
  isAttendanceClosed?: boolean;
}

export interface SessionResponse {
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  note: string | null;
  status: SessionStatus;
  isAttendanceClosed: boolean;
  classSchedule: ClassScheduleSummary;
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
}
