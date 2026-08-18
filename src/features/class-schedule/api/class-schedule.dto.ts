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
  scheduleLevel?: ScheduleLevel;
  scheduleLocation?: ScheduleLocation;
  scheduleShift?: ScheduleShift;
  scheduleStatus?: ScheduleStatus;
  weekday?: Weekday;
  scheduleIds?: string[];
}

export interface ClassScheduleCreateRequest {
  scheduleId: string;
  branchId: number;
  weekday: Weekday;
  level: ScheduleLevel;
  startTime: string;
  endTime: string;
  shift: ScheduleShift;
  location: ScheduleLocation;
  scheduleStatus: ScheduleStatus;
  monthlyFee: number;
  quarterlyFee?: number;
}

export interface ClassScheduleUpdateRequest {
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

export interface ClassScheduleDetail {
  scheduleId: string;
  branchId: number;
  branchName: string;
  coaches: CoachSummary[];
  scheduleLevel: ScheduleLevel;
  scheduleShift: ScheduleShift;
  scheduleLocation: ScheduleLocation;
  scheduleStatus: ScheduleStatus;
  monthlyFee: number;
  quarterlyFee: number | null;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  totalStudents: number | null;
}

export type { ClassScheduleSummary };
