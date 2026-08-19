import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { CoachSummary } from '@/features/coach/api/coach-summary.dto';
import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type { CoachTimesheetStatus } from '../constants/coach-timesheet.constants';

export interface CoachTimesheetCheckInRequest {
  staffCode?: string;
  personId?: string;
}

export interface CoachTimesheetAdjustRequest {
  status?: CoachTimesheetStatus;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  note?: string | null;
}

export interface CoachTimesheetResponse {
  timesheetId: string;
  coachAssignmentId: string;
  classSessionId: string | null;
  coach: CoachSummary;
  classSchedule: ClassScheduleSummary;
  workingDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: CoachTimesheetStatus;
  alreadyCheckedIn: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachTimesheetSummaryResponse {
  totalRecords: number;
  totalTeachingSessions: number;
}

export interface CoachTimesheetListResponse {
  summary: CoachTimesheetSummaryResponse;
  timesheets: PageResponse<CoachTimesheetResponse>;
}

export interface CoachTimesheetFilterRequest {
  coachId?: string;
  classSessionId?: string;
  classScheduleId?: string;
  branchId?: number;
  status?: CoachTimesheetStatus;
  workDate?: string;
  fromDate?: string;
  toDate?: string;
  month?: number;
  year?: number;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface MyCoachTimesheetsParams {
  fromDate?: string;
  toDate?: string;
  month?: number;
  year?: number;
  page?: number;
  size?: number;
}
