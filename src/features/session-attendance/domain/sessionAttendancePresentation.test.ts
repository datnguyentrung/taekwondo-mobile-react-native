import type { EvaluationStudent } from "../api/session-attendance.dto";
import {
  canEvaluateStudent,
  filterAndSortStudents,
  getAvailableBelts,
} from "./sessionAttendancePresentation";

function student(
  id: string,
  belt: string | null,
  attendanceStatus?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "MAKEUP",
): EvaluationStudent {
  return {
    studentEnrollment: {
      studentEnrollmentId: id,
      studentPerson: {
        personId: id,
        fullName: `Học viên ${id}`,
        currentBelt: belt,
      },
    },
    attendance: attendanceStatus
      ? {
          sessionAttendanceId: `attendance-${id}`,
          attendanceStatus,
          evaluationStatus: "PENDING",
        }
      : null,
    recorded: Boolean(attendanceStatus),
  };
}

describe("session attendance presentation", () => {
  const students = [
    student("c9", "C9", "PRESENT"),
    student("c10", "C10"),
    student("c8", "C8", "ABSENT"),
  ];

  it("keeps unmarked students distinct from present students", () => {
    expect(canEvaluateStudent(students[1])).toBe(false);
    expect(
      filterAndSortStudents(students, "UNMARKED", "ALL", "ASC").map(
        (item) => item.studentEnrollment.studentEnrollmentId,
      ),
    ).toEqual(["c10"]);
  });

  it("allows evaluation only for eligible recorded attendance", () => {
    expect(canEvaluateStudent(students[0])).toBe(true);
    expect(canEvaluateStudent(students[2])).toBe(false);
  });

  it("filters by belt and sorts using belt progression", () => {
    expect(getAvailableBelts(students)).toEqual(["C10", "C9", "C8"]);
    expect(
      filterAndSortStudents(students, "ALL", "ALL", "DESC").map(
        (item) => item.studentEnrollment.studentPerson.currentBelt,
      ),
    ).toEqual(["C8", "C9", "C10"]);
    expect(filterAndSortStudents(students, "ALL", "C9", "ASC")).toHaveLength(1);
  });
});
