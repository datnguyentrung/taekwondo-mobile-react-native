import {
  getCalendarQuarterDateRange,
  getDefaultHistoryYears,
} from './historyDateRange';

describe('historyDateRange', () => {
  it('maps calendar quarters to inclusive API date ranges', () => {
    expect(getCalendarQuarterDateRange(2026, 1)).toEqual({
      from: '2026-01-01',
      to: '2026-03-31',
    });
    expect(getCalendarQuarterDateRange(2026, 4)).toEqual({
      from: '2026-10-01',
      to: '2026-12-31',
    });
  });

  it('returns current year and previous four years', () => {
    expect(getDefaultHistoryYears(2026)).toEqual([
      2026, 2025, 2024, 2023, 2022,
    ]);
  });
});
