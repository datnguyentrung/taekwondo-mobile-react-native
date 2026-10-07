import type {
  ClassScheduleResponse,
  ClassScheduleSimpleResponse,
} from "@/features/class-schedule/api/class-schedule.dto";
import type { PersonResponse, PersonSimpleResponse } from "@/features/person/domain/person.types";
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
  status: CourseStatus;
  classSessionGeneratedUntil: string | null;
  primaryCoach?: PersonSimpleResponse | null;
  assistantCoaches?: PersonResponse[];
  teachingAssistants?: PersonResponse[];
  manager?: PersonResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSimpleResponse {
  courseId: string;
  courseSchedules: CourseScheduleSimpleResponse[];
  name: string;
  capacity: number;
  status: CourseStatus;
  primaryCoach?: PersonSimpleResponse | null;
}

export interface CourseListParams {
  search?: string;
  status?: CourseStatus;
  page?: number;
  size?: number;
  sort?: string | string[];
}
