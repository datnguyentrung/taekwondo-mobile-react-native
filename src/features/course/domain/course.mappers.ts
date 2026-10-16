import type { CourseResponse, CourseSimpleResponse } from "../api/course.dto";
import { CourseLevelLabel, CourseStatusLabel } from "../constants/course.constants";
import {
  WeekdayCodeToLabel,
  WeekdayLabel,
  type Weekday,
} from "@/features/class-schedule/constants/class-schedule.constants";
import { BeltLabel } from "@/features/person/constants/person.constants";
import type {
  CourseBranchItemView,
  CourseCatalogTab,
  CourseClassScheduleItemView,
  CourseStaffMemberView,
  CourseView,
} from "./course.types";

/**
 * Maps a CourseSimpleResponse or CourseResponse DTO from backend into a CourseView object for UI components.
 */
export function mapCourseApiToView(
  item: CourseSimpleResponse | CourseResponse,
  fallbackPackages: CourseView["packages"] = [],
): CourseView {
  const schedule = item.courseSchedules?.[0]?.classSchedule;
  const branchName = schedule?.branch?.name ?? "Cơ sở Văn Quán";
  const weekdayText = schedule?.weekday
    ? typeof schedule.weekday === "number"
      ? (WeekdayCodeToLabel[schedule.weekday] ?? `Thứ ${schedule.weekday}`)
      : (WeekdayLabel[schedule.weekday as Weekday] ?? String(schedule.weekday))
    : "";
  const levelText = CourseLevelLabel[item.level] ?? item.level;
  const scheduleLabel =
    [weekdayText, levelText].filter(Boolean).join(" · ") || "Lịch học linh hoạt";

  const catalogStatus: CourseCatalogTab =
    item.status === "OPEN"
      ? "registration"
      : item.status === "ACTIVE"
      ? "active"
      : "ended";

  const managerView: CourseStaffMemberView | undefined = item.manager
    ? {
        id: item.manager.personId,
        fullName: item.manager.fullName,
        roleLabel: "Quản lý khóa học",
      }
    : undefined;

  const primaryCoach = item.primaryCoach;
  const coachName = primaryCoach?.fullName || "Huấn luyện viên chính";
  const coachBeltLabel = primaryCoach?.currentBelt
    ? BeltLabel[primaryCoach.currentBelt] || primaryCoach.currentBelt
    : "Đai đen";

  const coaches: CourseStaffMemberView[] = primaryCoach
    ? [
        {
          id: primaryCoach.personId,
          fullName: primaryCoach.fullName,
          roleLabel: `Huấn luyện viên chính · ${coachBeltLabel}`,
        },
      ]
    : [];

  // Extract unique classSchedules and unique branches from courseSchedules
  const rawCourseSchedules = item.courseSchedules ?? [];
  const classScheduleMap = new Map<string, CourseClassScheduleItemView>();
  const branchMap = new Map<number | string, CourseBranchItemView>();

  for (const cs of rawCourseSchedules) {
    if (cs?.classSchedule) {
      if (!classScheduleMap.has(cs.classSchedule.scheduleId)) {
        classScheduleMap.set(cs.classSchedule.scheduleId, cs.classSchedule);
      }
      if (cs.classSchedule.branch) {
        const bId = cs.classSchedule.branch.branchId;
        if (bId != null && !branchMap.has(bId)) {
          branchMap.set(bId, cs.classSchedule.branch);
        }
      }
    }
  }

  const classSchedules: CourseClassScheduleItemView[] = Array.from(classScheduleMap.values());
  const branches: CourseBranchItemView[] = Array.from(branchMap.values());

  return {
    courseId: item.courseId,
    courseName: item.name,
    subtitle: `Lớp ${levelText || "Taekwondo"} · Cơ sở ${branchName}`,
    description: `Khóa học ${item.name} tại cơ sở ${branchName}. Sức chứa ${item.capacity} học viên.`,
    benefits: "Rèn luyện thể chất, nâng cao kỹ thuật Taekwondo, kỷ luật võ đạo và tác phong tự giác.",
    curriculum: "Khởi động, tấn cơ bản, đòn đá căn bản & nâng cao, bài quyền và đối luyện kiểm soát.",
    branchName,
    levelLabel: levelText || "Cơ bản",
    scheduleLabel,
    statusLabel: CourseStatusLabel[item.status] ?? "Đang mở đăng ký",
    catalogStatus,
    capacity: item.capacity,
    enrolledStudentCount: item.currentStudentCount ?? 0,
    manager: managerView,
    coachName,
    coaches,
    assistantCount: 0,
    packages: fallbackPackages,
    branches,
    classSchedules,
    courseSchedules: rawCourseSchedules,
  };
}
