import type {
  ScheduleLevel,
  ScheduleLocation,
  ScheduleShift,
  Weekday,
} from '../constants/class-schedule.constants';

export interface ClassScheduleSummary {
  scheduleId: string;
  branchName: string;
  scheduleLocation: ScheduleLocation;
  scheduleLevel: ScheduleLevel;
  scheduleShift: ScheduleShift;
  monthlyFee: number;
  quarterlyFee: number | null;
  startTime: string;
  endTime: string;
  weekday: Weekday;
}
