import type { HistoryRecordViewModel } from '../../domain/historyMappers';
import {
  DEFAULT_HISTORY_YEAR,
  type CalendarQuarter,
  getCalendarQuarterDateRange,
  getDefaultHistoryYears,
  QUARTER_OPTIONS,
} from '../../domain/historyDateRange';
import type {
  HistoryFilterOption,
  HistoryFilterState,
  HistoryMultiFilterGroup,
  HistorySingleFilterGroup,
} from './historyFilter.types';

export const emptyHistoryFilters: HistoryFilterState = {
  branchIds: [],
  shifts: [],
};

export function countSelectedHistoryFilters(filters: HistoryFilterState) {
  return (
    filters.branchIds.length +
    filters.shifts.length +
    (filters.year ? 1 : 0) +
    (filters.quarter ? 1 : 0)
  );
}

export function canApplyHistoryFilters(filters: HistoryFilterState) {
  return Boolean(filters.year && filters.quarter);
}

export function filterHistoryRecords(
  records: HistoryRecordViewModel[],
  filters: HistoryFilterState,
) {
  const dateRange =
    filters.year && filters.quarter
      ? getCalendarQuarterDateRange(filters.year, filters.quarter)
      : null;

  return records.filter((record) => {
    if (
      filters.branchIds.length &&
      !filters.branchIds.includes(getBranchId(record.branchLabel))
    ) {
      return false;
    }

    if (filters.shifts.length && !filters.shifts.includes(record.shiftLabel)) {
      return false;
    }

    if (dateRange && !isDisplayDateInRange(record.dateLabel, dateRange.from, dateRange.to)) {
      return false;
    }

    return true;
  });
}

export function getHistoryFilterDateRange(filters: HistoryFilterState) {
  if (!filters.year || !filters.quarter) return null;
  return getCalendarQuarterDateRange(filters.year, filters.quarter);
}

export function getHistoryFilterGroups(records: HistoryRecordViewModel[]): {
  multi: HistoryMultiFilterGroup[];
  years: HistorySingleFilterGroup<number>;
  quarters: HistorySingleFilterGroup<CalendarQuarter>;
} {
  return {
    multi: [
      {
        key: 'branchIds',
        title: 'Cơ sở',
        options: uniqueOptions(
          records.map((record) => ({
            value: getBranchId(record.branchLabel),
            label: record.branchLabel,
          })),
        ),
      },
      {
        key: 'shifts',
        title: 'Ca',
        options: uniqueOptions(
          records.map((record) => ({
            value: record.shiftLabel,
            label: record.shiftLabel,
          })),
        ),
      },
    ],
    years: {
      key: 'year',
      title: 'Năm học',
      options: getDefaultHistoryYears(DEFAULT_HISTORY_YEAR).map((year) => ({
        value: year,
        label: String(year),
      })),
    },
    quarters: {
      key: 'quarter',
      title: 'Quý',
      options: QUARTER_OPTIONS.map((quarter) => ({
        value: quarter,
        label: String(quarter),
      })),
    },
  };
}

function uniqueOptions<T extends string | number>(
  options: HistoryFilterOption<T>[],
): HistoryFilterOption<T>[] {
  const seen = new Set<T>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function getBranchId(branchLabel: string) {
  const match = branchLabel.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function isDisplayDateInRange(displayDate: string, from: string, to: string) {
  const recordDate = parseDisplayDate(displayDate);
  if (!recordDate) return true;
  return recordDate >= from && recordDate <= to;
}

function parseDisplayDate(displayDate: string) {
  const [day, month, year] = displayDate.split('-');
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
}
