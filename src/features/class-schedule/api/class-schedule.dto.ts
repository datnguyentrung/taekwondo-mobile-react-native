import type { BranchResponse, BranchSimpleResponse } from '@/features/branch/api/branch.dto';
import type { CoachSummary } from '@/features/coach/api/coach-summary.dto';
import type {
  ScheduleLevel,
  ScheduleLocation,
  ScheduleShift,
  ScheduleStatus,
  Weekday,
} from '../constants/class-schedule.constants';
import type { ClassScheduleSummary } from './class-schedule-summary.dto';

export interface GetClassSchedulesParams {
  branchId?: number;
  weekday?: Weekday;
  level?: ScheduleLevel;
  location?: ScheduleLocation;
  status?: ScheduleStatus;
  scheduleLevel?: ScheduleLevel;
  scheduleLocation?: ScheduleLocation;
  scheduleShift?: ScheduleShift;
  scheduleStatus?: ScheduleStatus;
  scheduleIds?: string[];
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface ClassScheduleCreateRequest {
  branchId: number;
  weekday: Weekday;
  level: ScheduleLevel;
  location: ScheduleLocation;
  status: ScheduleStatus;
  startTime: string;
  endTime: string;
}

export type ClassScheduleUpdateRequest = ClassScheduleCreateRequest;

export interface ClassScheduleResponse {
  scheduleId: string;
  branch: BranchResponse;
  weekday: Weekday;
  level: ScheduleLevel;
  location: ScheduleLocation;
  status: ScheduleStatus;
  startTime: string;
  endTime: string;
}

export interface ClassScheduleSimpleResponse {
  scheduleId: string;
  branch: BranchSimpleResponse;
  weekday: Weekday;
  level: ScheduleLevel;
  location: ScheduleLocation;
  status: ScheduleStatus;
}

export interface ClassScheduleDetail extends ClassScheduleResponse {
  branchName?: string;
  coaches?: CoachSummary[];
  scheduleLevel?: ScheduleLevel;
  scheduleShift?: ScheduleShift;
  scheduleLocation?: ScheduleLocation;
  scheduleStatus?: ScheduleStatus;
  monthlyFee?: number;
  quarterlyFee?: number | null;
  totalStudents?: number | null;
}

export interface LegacyClassScheduleUpdateRequest {
  branchId?: number;
  weekday?: Weekday;
  level?: ScheduleLevel;
  startTime?: string;
  endTime?: string;
  shift?: ScheduleShift;
  location?: ScheduleLocation;
  scheduleStatus?: ScheduleStatus;
  monthlyFee?: number;
  quarterlyFee?: number;
}

export type { ClassScheduleSummary };
