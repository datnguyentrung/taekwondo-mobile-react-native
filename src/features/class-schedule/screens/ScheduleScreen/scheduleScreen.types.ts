import type { ImageSourcePropType } from 'react-native';

import type {
  ScheduleLevel,
  ScheduleShift,
  Weekday,
} from '../../constants/class-schedule.constants';

export type ScheduleScreenItem = {
  scheduleId: string;
  branchId: number;
  branchName: string;
  weekday: Weekday;
  level: ScheduleLevel;
  levelLabel: string;
  shift: ScheduleShift;
  shiftLabel: string;
  startTime: string;
  endTime: string;
  coachName: string;
  image: ImageSourcePropType;
};

export type ScheduleFilterState = {
  branchIds: number[];
  sessions: string[];
  shifts: string[];
  levels: ScheduleLevel[];
};

export type ScheduleFilterGroupKey = keyof ScheduleFilterState;

export type ScheduleFilterOption = {
  value: string | number;
  label: string;
};

export type ScheduleFilterGroup = {
  key: ScheduleFilterGroupKey;
  title: string;
  options: readonly ScheduleFilterOption[];
};
