import { Permission } from '@/features/authorization';

import { getAttendanceHistoryNavigationDecision } from './historyAccess';

describe('getAttendanceHistoryNavigationDecision', () => {
  it('routes directly to student history for student attendance permission only', () => {
    expect(
      getAttendanceHistoryNavigationDecision([
        Permission.STUDENT_ATTENDANCE_READ,
      ]),
    ).toEqual({ type: 'route', mode: 'student' });
  });

  it('opens picker when both student attendance and coach timesheet permissions exist', () => {
    expect(
      getAttendanceHistoryNavigationDecision([
        Permission.STUDENT_ATTENDANCE_READ,
        Permission.COACH_TIMESHEET_READ,
      ]),
    ).toEqual({ type: 'picker' });
  });

  it('routes directly to coach history for coach timesheet permission only', () => {
    expect(
      getAttendanceHistoryNavigationDecision([Permission.COACH_TIMESHEET_READ]),
    ).toEqual({ type: 'route', mode: 'coach' });
  });
});
