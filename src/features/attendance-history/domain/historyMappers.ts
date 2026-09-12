import type { CoachTimesheetResponse } from '@/features/coach-timesheet/api/coach-timesheet.dto';
import type { StudentAttendanceResponse } from '@/features/student-attendance/api/student-attendance.dto';
import {
  AttendanceStatusLabel,
  EvaluationStatusLabel,
  type EvaluationStatus,
} from '@/features/student-attendance/constants/student-attendance.constants';

import type { AttendanceHistoryMode } from './historyAccess';

export type HistoryRecordTone = 'success' | 'warning' | 'error' | 'neutral';

export type HistoryRecordViewModel = {
  id: string;
  mode: AttendanceHistoryMode;
  dateLabel: string;
  branchLabel: string;
  shiftLabel: string;
  statusLabel: string;
  badgeLabel: string;
  noteTitle: string;
  note: string;
  tone: HistoryRecordTone;
};

export type StudentAttendanceDisplayMeta = {
  branchLabel: string;
  shiftLabel: string;
};

export type CoachTimesheetDisplayMeta = StudentAttendanceDisplayMeta & {
  statusLabel?: string;
};

export function mapStudentAttendanceToHistoryRecord(
  attendance: StudentAttendanceResponse,
  meta: StudentAttendanceDisplayMeta,
): HistoryRecordViewModel {
  const evaluationStatus = attendance.evaluationStatus ?? 'PENDING';

  return {
    id: attendance.sessionAttendanceId ?? attendance.studentAttendanceId,
    mode: 'student',
    dateLabel: formatDisplayDate(attendance.checkInTime ?? attendance.createdAt),
    branchLabel: meta.branchLabel,
    shiftLabel: meta.shiftLabel,
    statusLabel: AttendanceStatusLabel[attendance.attendanceStatus],
    badgeLabel: EvaluationStatusLabel[evaluationStatus],
    noteTitle: 'Ghi chú',
    note: attendance.note?.trim() || 'Không có ghi chú',
    tone: toneForEvaluation(evaluationStatus),
  };
}

export function mapCoachTimesheetToHistoryRecord(
  timesheet: CoachTimesheetResponse,
  meta: CoachTimesheetDisplayMeta,
): HistoryRecordViewModel {
  return {
    id: timesheet.coachTimesheetId,
    mode: 'coach',
    dateLabel: formatDisplayDate(timesheet.checkInTime ?? timesheet.createdAt),
    branchLabel: meta.branchLabel,
    shiftLabel: meta.shiftLabel,
    statusLabel: meta.statusLabel ?? formatTimesheetStatus(timesheet),
    badgeLabel: formatTimesheetDuration(timesheet),
    noteTitle: 'Ghi chú',
    note: timesheet.note?.trim() || 'Không có ghi chú',
    tone: timesheet.checkInTime && timesheet.checkOutTime ? 'success' : 'warning',
  };
}

export function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function toneForEvaluation(status: EvaluationStatus): HistoryRecordTone {
  if (status === 'GOOD') return 'success';
  if (status === 'WEAK') return 'error';
  if (status === 'AVERAGE') return 'warning';
  return 'neutral';
}

function formatTimesheetStatus(timesheet: CoachTimesheetResponse): string {
  if (timesheet.checkInTime && timesheet.checkOutTime) return 'Đã chấm công';
  if (timesheet.checkInTime) return 'Thiếu giờ ra';
  return 'Chưa chấm công';
}

function formatTimesheetDuration(timesheet: CoachTimesheetResponse): string {
  if (!timesheet.checkInTime || !timesheet.checkOutTime) return 'Chưa đủ';

  const start = new Date(timesheet.checkInTime).getTime();
  const end = new Date(timesheet.checkOutTime).getTime();
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes} phút`;
  if (remainingMinutes <= 0) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}
