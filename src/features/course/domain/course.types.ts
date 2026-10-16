import type {
  ClassScheduleResponse,
  ClassScheduleSimpleResponse,
} from "@/features/class-schedule/api/class-schedule.dto";
import type {
  BranchResponse,
  BranchSimpleResponse,
} from "@/features/branch/api/branch.dto";
import type {
  CourseScheduleResponse,
  CourseScheduleSimpleResponse,
} from "../api/course.dto";

export type { CourseResponse as Course } from "../api/course.dto";

export type CourseCatalogTab = "registration" | "active" | "ended";

export type CoursePackageView = {
  id: string;
  label: string;
  durationLabel: string;
  sessions: number;
  amount: number;
  originalAmount?: number;
  footerText?: string;
  badge?: { label: string; tone: "popular" | "saving" };
};

export type CourseStaffMemberView = {
  id: string;
  fullName: string;
  roleLabel: string;
};

export type CourseScheduleItemView = CourseScheduleResponse | CourseScheduleSimpleResponse;
export type CourseBranchItemView = BranchResponse | BranchSimpleResponse;
export type CourseClassScheduleItemView = ClassScheduleResponse | ClassScheduleSimpleResponse;

export type CourseView = {
  courseId: string;
  courseName: string;
  subtitle?: string;
  description?: string;
  benefits?: string;
  curriculum?: string;
  branchName: string;
  levelLabel: string;
  scheduleLabel: string;
  statusLabel: string;
  catalogStatus: CourseCatalogTab;
  capacity?: number;
  enrolledStudentCount?: number;
  endedAtLabel?: string;
  manager?: CourseStaffMemberView;
  coachName: string;
  coaches?: CourseStaffMemberView[];
  assistantCount?: number;
  packages: CoursePackageView[];
  branches?: CourseBranchItemView[];
  classSchedules?: CourseClassScheduleItemView[];
  courseSchedules?: CourseScheduleItemView[];
};
