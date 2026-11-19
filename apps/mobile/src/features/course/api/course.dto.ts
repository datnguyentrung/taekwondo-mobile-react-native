import type {
  ClassScheduleResponse,
  ClassScheduleSimpleResponse,
} from "../../class-schedule/api/class-schedule.dto";
import type { AssignmentType } from "../../course-staff-assignment/constants/course-staff-assignment.constants";
import type { PersonBriefResponse } from "../../person/domain/person.types";
import type { CourseLevel, CourseStatus } from "../constants/course.constants";

export interface CourseScheduleResponse {
  courseScheduleId: string;
  courseId?: string;
  classSchedule: ClassScheduleResponse;
  staffAssignments: CourseScheduleStaffAssignmentResponse[];
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CourseScheduleStaffAssignmentResponse {
  courseStaffAssignmentId: string;
  staffPerson: PersonBriefResponse;
  assignmentType: AssignmentType;
}

export interface CourseScheduleSimpleResponse {
  courseScheduleId: string;
  course?: CourseBriefResponse;
  classSchedule: ClassScheduleSimpleResponse;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "INACTIVE";
  learningProgress?: LearningProgress | null;
}

export interface CourseScheduleUpsertRequest {
  classScheduleId: string;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface CourseCreateRequest {
  courseSchedules: CourseScheduleUpsertRequest[];
  name: string;
  level: CourseLevel;
  capacity: number;
  status: CourseStatus;
}

export interface CourseUpdateRequest {
  name: string;
  level: CourseLevel;
  capacity: number;
  status: CourseStatus;
}

export interface CourseResponse {
  courseId: string;
  courseSchedules: CourseScheduleResponse[];
  name: string;
  level: CourseLevel;
  capacity: number;
  currentStudentCount: number;
  status: CourseStatus;
  classSessionGeneratedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSimpleResponse {
  courseId: string;
  courseSchedules: CourseScheduleSimpleResponse[];
  name: string;
  level: CourseLevel;
  capacity: number;
  currentStudentCount: number;
  status: CourseStatus;
}

export interface CourseBriefResponse {
  courseId: string;
  name: string;
}

export interface LearningProgress {
  scheduled: number;
  active: number;
  completed: number;
  terminated: number;
  cancelled: number;
  postponed: number;
  total: number;
}

export interface CourseListParams {
  search?: string;
  status?: CourseStatus;
  page?: number;
  size?: number;
  sort?: string | string[];
}
