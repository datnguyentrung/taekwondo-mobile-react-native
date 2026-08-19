import { StudentEnrollmentSimpleResponse } from "@/features/student-enrollment/api/student-enrollment.dto";
import { StudentAttendanceResponse } from "../api/student-attendance.dto";

/**
 * Hàm gộp danh sách học viên đăng ký vào danh sách điểm danh.
 * @param enrollments Danh sách học viên đăng ký lớp học (StudentEnrollmentSimpleResponse[])
 * @param attendances Danh sách điểm danh đã có từ server (StudentAttendanceResponse[])
 * @param sessionDate Ngày của buổi học hiện tại (VD: "2026-03-08") để gán cho record mới
 * @returns Mảng StudentAttendanceResponse đã được gộp đầy đủ học viên
 */
export function mergeAttendanceData(
  enrollments: StudentEnrollmentSimpleResponse[],
  attendances: StudentAttendanceResponse[],
  sessionDate: string,
): StudentAttendanceResponse[] {
  // 1. Tạo một Set chứa các studentId đã có trong danh sách Attendance để tra cứu cực nhanh O(1)
  const existingStudentIds = new Set(
    attendances.map((attendance) => attendance.studentSummary.personId),
  );

  // 2. Clone danh sách attendance hiện tại để tránh mutate data gốc
  const combinedList: StudentAttendanceResponse[] = [...attendances];

  // 3. Duyệt qua danh sách enrollment, nếu ai chưa có thì thêm vào
  for (const enrollment of enrollments) {
    const studentId = enrollment.studentSummary.personId;

    if (!existingStudentIds.has(studentId)) {
      // Tạo một record giả lập cấu trúc của StudentAttendanceResponse
      const newRecord: StudentAttendanceResponse = {
        attendanceId: null, // Rỗng hoặc null vì chưa được lưu vào Database
        enrollmentId: enrollment.enrollmentId,
        studentSummary: enrollment.studentSummary,
        classSchedule: enrollment.classScheduleSummary,
        sessionDate: sessionDate,

        // Các trường chưa có dữ liệu sẽ set mặc định là null
        attendanceStatus: null, // Ép kiểu nếu interface gốc không cho phép null
        checkInTime: null,
        recordedByCoachName: null,
        evaluationStatus: null,
        note: null,
        evaluatedByCoachName: null,
        updatedAt: new Date().toISOString(),
        alreadyCheckedIn: false,
      };

      combinedList.push(newRecord);
    }
  }

  return combinedList;
}
