import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { ScheduleLevel } from '@/features/class-schedule/constants/class-schedule.constants';
import type { Belt } from '@/features/person/constants/person.constants';
import type { StudentSummary } from '@/features/student/api/student-summary.dto';
import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type { AttendanceStatus, EvaluationStatus } from '../constants/student-attendance.constants';
import type { AttendanceStats } from './attendance-stats.dto';

export interface StudentAttendanceResponse {
  attendanceId: string | null;
  enrollmentId: string;
  studentSummary: StudentSummary;
  classSchedule: ClassScheduleSummary;
  sessionDate: string;
  attendanceStatus: AttendanceStatus | null;
  checkInTime: string | null;
  recordedByCoachName: string | null;
  alreadyCheckedIn: boolean;
  evaluationStatus: EvaluationStatus | null;
  note: string | null;
  evaluatedByCoachName: string | null;
  updatedAt: string;
}

export interface AttendanceListResponse {
  stats: AttendanceStats;
  attendances: PageResponse<StudentAttendanceResponse>;
}
export interface StudentAttendanceSimpleResponse {
  attendanceId: string;
  enrollmentId: string;
  studentId: string;
  attendanceStatus: AttendanceStatus;
  recordedByCoachName: string | null;
  checkInTime: string | null;
  evaluationStatus: EvaluationStatus | null;
  evaluatedByCoachName: string | null;
  note: string | null;
}

export interface AttendanceBatchCreateRequest {
  classScheduleId: string;
  sessionDate: string;
}

export interface AttendanceManualLogRequest {
  studentId: string;
  classScheduleId: string;
  sessionDate: string;
  attendanceStatus: AttendanceStatus;
  checkInTime?: string | null;
  note?: string;
}

export interface AttendanceUpdateStatusRequest {
  attendanceStatus: AttendanceStatus;
}
export interface AttendanceUpdateEvaluationRequest {
  evaluationStatus?: EvaluationStatus;
  note?: string;
}

export interface AttendanceFullUpdateRequest {
  attendanceStatus?: AttendanceStatus;
  evaluationStatus?: EvaluationStatus;
  note?: string;
}

export interface AttendanceCheckInRequest {
  studentCode?: string;
  personId?: string;
}

export interface AttendanceFilterParams {
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  sessionDate?: string;
  attendanceStatuses?: AttendanceStatus[];
  evaluationStatuses?: EvaluationStatus[];
  belts?: Belt[];
  branchIds?: number[];
  scheduleIds?: string[];
  scheduleLevels?: ScheduleLevel[];
  sessionIds?: string[];
  startDate?: string;
  endDate?: string;
}
