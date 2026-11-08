import type { EvaluationStudent } from "../api/session-attendance.dto";
import type { AttendanceStatus } from "../constants/session-attendance.constants";

export type AttendanceFilter = "ALL" | "UNMARKED" | AttendanceStatus;
export type BeltSort = "ASC" | "DESC";
export const UNKNOWN_BELT_FILTER = "__UNKNOWN_BELT__";
export type BeltFilter = "ALL" | typeof UNKNOWN_BELT_FILTER | string;

const BELT_ORDER = [
  "C10",
  "C9",
  "C8",
  "C7",
  "C6",
  "C5",
  "C4",
  "C3",
  "C2",
  "C1",
  "D1",
  "D2",
  "D3",
  "D4",
  "D5",
  "D6",
  "D7",
  "D8",
  "D9",
  "D10",
] as const;

export function canEvaluateStudent(student: EvaluationStudent) {
  const status = student.attendance?.attendanceStatus;
  return Boolean(
    student.attendance?.sessionAttendanceId &&
      status &&
      ["PRESENT", "LATE", "MAKEUP"].includes(status),
  );
}

export function formatBeltName(beltCode?: string | null) {
  const labels: Record<string, string> = {
    C10: "Cấp 10 (Trắng)",
    C9: "Cấp 9 (Vàng)",
    C8: "Cấp 8 (Cam)",
    C7: "Cấp 7 (Xanh lá)",
    C6: "Cấp 6 (Xanh dương)",
    C5: "Cấp 5 (Đỏ)",
    C4: "Cấp 4 (Nâu)",
    C3: "Cấp 3",
    C2: "Cấp 2",
    C1: "Cấp 1",
  };
  return beltCode ? labels[beltCode] ?? beltCode : "Chưa rõ đai";
}

export function getBeltRank(belt?: string | null) {
  const index = BELT_ORDER.indexOf(belt as (typeof BELT_ORDER)[number]);
  return index < 0 ? BELT_ORDER.length : index;
}

export function getAvailableBelts(students: EvaluationStudent[]) {
  return Array.from(
    new Set(
      students
        .map((item) => item.studentEnrollment.studentPerson.currentBelt)
        .filter((belt): belt is string => Boolean(belt)),
    ),
  ).sort((left, right) => getBeltRank(left) - getBeltRank(right));
}

export function filterAndSortStudents(
  students: EvaluationStudent[],
  attendanceFilter: AttendanceFilter,
  beltFilter: BeltFilter,
  beltSort: BeltSort,
) {
  return students
    .filter((student) => {
      if (attendanceFilter === "ALL") return true;
      if (attendanceFilter === "UNMARKED") return !student.attendance;
      return student.attendance?.attendanceStatus === attendanceFilter;
    })
    .filter(
      (student) =>
        beltFilter === "ALL" ||
        (beltFilter === UNKNOWN_BELT_FILTER
          ? !student.studentEnrollment.studentPerson.currentBelt
          : student.studentEnrollment.studentPerson.currentBelt === beltFilter),
    )
    .sort((left, right) => {
      const rankDifference =
        getBeltRank(left.studentEnrollment.studentPerson.currentBelt) -
        getBeltRank(right.studentEnrollment.studentPerson.currentBelt);
      if (rankDifference !== 0) {
        return beltSort === "ASC" ? rankDifference : -rankDifference;
      }
      return left.studentEnrollment.studentPerson.fullName.localeCompare(
        right.studentEnrollment.studentPerson.fullName,
        "vi",
      );
    });
}
