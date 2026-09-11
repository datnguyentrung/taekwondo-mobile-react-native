import type { CalendarQuarter } from '../../domain/historyDateRange';

export type HistoryFilterState = {
  branchIds: number[];
  shifts: string[];
  year?: number;
  quarter?: CalendarQuarter;
};

export type HistoryFilterOption<T extends string | number = string | number> = {
  value: T;
  label: string;
};

export type HistoryMultiFilterGroupKey = 'branchIds' | 'shifts';

export type HistoryMultiFilterGroup = {
  key: HistoryMultiFilterGroupKey;
  title: string;
  options: readonly HistoryFilterOption[];
};

export type HistorySingleFilterGroup<T extends string | number = string | number> = {
  key: 'year' | 'quarter';
  title: string;
  options: readonly HistoryFilterOption<T>[];
};
