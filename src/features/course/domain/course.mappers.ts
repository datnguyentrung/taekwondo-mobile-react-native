import type { CourseSimpleResponse } from "../api/course.dto";
import { CourseStatusLabel } from "../constants/course.constants";
import {
  ScheduleLevelLabel,
  WeekdayCodeToLabel,
  WeekdayLabel,
  type Weekday,
} from "@/features/class-schedule/constants/class-schedule.constants";
import type {
  CourseCatalogTab,
  CourseView,
} from "@/features/student-commerce/types";

/**
 * Maps a CourseSimpleResponse DTO from backend into a CourseView object for UI components.
 */
export function mapCourseApiToView(item: CourseSimpleResponse): CourseView {
  const schedule = item.classSchedule;
  const branchName = schedule?.branch?.name ?? "Cơ sở Văn Quán";
  const weekdayText = schedule?.weekday
    ? typeof schedule.weekday === "number"
      ? (WeekdayCodeToLabel[schedule.weekday] ?? `Thứ ${schedule.weekday}`)
      : (WeekdayLabel[schedule.weekday as Weekday] ?? String(schedule.weekday))
    : "";
  const levelText = schedule?.level
    ? (ScheduleLevelLabel[schedule.level] ?? schedule.level)
    : "";
  const scheduleLabel =
    [weekdayText, levelText].filter(Boolean).join(" · ") || "Lịch học linh hoạt";

  const catalogStatus: CourseCatalogTab =
    item.status === "OPEN"
      ? "registration"
      : item.status === "ACTIVE"
      ? "active"
      : "ended";

  return {
    courseId: item.courseId,
    courseName: item.name,
    branchName,
    levelLabel: levelText || "Cơ bản",
    scheduleLabel,
    statusLabel: CourseStatusLabel[item.status] ?? "Đang mở đăng ký",
    catalogStatus,
    coachName: "Huấn luyện viên",
    packages: [],
  };
}
