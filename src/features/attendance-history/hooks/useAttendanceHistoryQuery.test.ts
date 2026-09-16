import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useAttendanceHistoryQuery } from './useAttendanceHistoryQuery';
import { emptyHistoryFilters } from '../screens/AttendanceHistoryScreen/historyFilter.logic';

// Mock authorization
jest.mock('@/features/authorization', () => ({
  usePermissions: jest.fn(() => ['SESSION_ATTENDANCE_READ', 'COACH_TIMESHEET_READ']),
  hasPermission: jest.fn((perms, p) => perms?.includes(p)),
  Permission: {
    SESSION_ATTENDANCE_READ: 'SESSION_ATTENDANCE_READ',
    SESSION_ATTENDANCE_UPDATE: 'SESSION_ATTENDANCE_UPDATE',
    SESSION_ATTENDANCE_DELETE: 'SESSION_ATTENDANCE_DELETE',
    COACH_TIMESHEET_READ: 'COACH_TIMESHEET_READ',
    COACH_TIMESHEET_UPDATE: 'COACH_TIMESHEET_UPDATE',
    COACH_TIMESHEET_DELETE: 'COACH_TIMESHEET_DELETE',
  },
}));

// Mock APIs
jest.mock('@/features/session-attendance/api/sessionAttendanceApi', () => ({
  sessionAttendanceApi: {
    list: jest.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  },
}));

jest.mock('@/features/coach-timesheet/api/coachTimesheetApi', () => ({
  coachTimesheetApi: {
    list: jest.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useAttendanceHistoryQuery', () => {
  it('returns client-filter strategy when user has only READ permission', async () => {
    const rendered = renderHook(
      () =>
        useAttendanceHistoryQuery({
          mode: 'student',
          filters: { ...emptyHistoryFilters, year: 2026, quarter: 1 },
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    const { result } = await rendered;

    expect(result.current.strategy).toBe('client-filter');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.records).toBeDefined();
  });
});
