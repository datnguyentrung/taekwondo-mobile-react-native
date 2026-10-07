import type {
  ClassScheduleResponse,
  ClassScheduleSimpleResponse,
} from "@/features/class-schedule/api/class-schedule.dto";
import type { PersonBriefResponse } from "@/features/person/domain/person.types";
import type { CourseStatus } from "../constants/course.constants";

export interface CourseScheduleResponse {
  courseScheduleId: string;
  classSchedule: ClassScheduleResponse;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CourseScheduleSimpleResponse {
  courseScheduleId: string;
  classSchedule: ClassScheduleSimpleResponse;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "INACTIVE";
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
  capacity: number;
  status: CourseStatus;
}

export interface CourseUpdateRequest {
  name: string;
  capacity: number;
  status: CourseStatus;
}

export interface CourseResponse {
  courseId: string;
  courseSchedules: CourseScheduleResponse[];
  name: string;
  capacity: number;
  currentStudentCount: number;
  status: CourseStatus;
  classSessionGeneratedUntil: string | null;
  primaryCoach?: PersonBriefResponse | null;
  manager?: PersonBriefResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSimpleResponse {
  courseId: string;
  courseSchedules: CourseScheduleSimpleResponse[];
  name: string;
  capacity: number;
  currentStudentCount: number;
  status: CourseStatus;
  primaryCoach?: PersonBriefResponse | null;
  manager?: PersonBriefResponse | null;
}

export interface CourseListParams {
  search?: string;
  status?: CourseStatus;
  page?: number;
  size?: number;
  sort?: string | string[];
}
