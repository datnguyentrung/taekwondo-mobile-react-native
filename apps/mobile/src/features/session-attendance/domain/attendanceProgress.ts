import type { ClassSessionEvaluationResponse } from '../api/session-attendance.dto';

export type AttendanceProgressStats = {
  totalStudents: number;
  markedCount: number;
  unmarkedCount: number;
  presentCount: number;
  absentCount: number;
  attendancePercent: number;
  evaluatedCount: number;
  needEvaluationCount: number;
  evaluationPercent: number;
};

export function calculateAttendanceProgress(
  students: ClassSessionEvaluationResponse['students'],
): AttendanceProgressStats {
  const totalStudents = students.length;
  const presentCount = students.filter(({ attendance }) =>
    attendance
      ? ['PRESENT', 'LATE', 'MAKEUP'].includes(attendance.attendanceStatus)
      : false,
  ).length;
  const absentCount = students.filter(({ attendance }) =>
    attendance
      ? ['ABSENT', 'EXCUSED'].includes(attendance.attendanceStatus)
      : false,
  ).length;
  const markedCount = students.filter(({ attendance }) => Boolean(attendance)).length;
  const unmarkedCount = totalStudents - markedCount;
  const evaluableStudents = students.filter(({ attendance }) =>
    attendance
      ? ["PRESENT", "LATE", "MAKEUP"].includes(attendance.attendanceStatus)
      : false,
  );
  const evaluatedCount = evaluableStudents.filter(
    ({ attendance }) =>
      Boolean(attendance?.evaluationStatus) &&
      attendance?.evaluationStatus !== 'PENDING',
  ).length;
  const needEvaluationCount = evaluableStudents.length;

  return {
    totalStudents,
    markedCount,
    unmarkedCount,
    presentCount,
    absentCount,
    attendancePercent:
      totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
    evaluatedCount,
    needEvaluationCount,
    evaluationPercent:
      needEvaluationCount > 0
        ? Math.round((evaluatedCount / needEvaluationCount) * 100)
        : 0,
  };
}
