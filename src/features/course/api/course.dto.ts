import type {
  ClassScheduleResponse,
  ClassScheduleSimpleResponse,
} from "@/features/class-schedule/api/class-schedule.dto";
import type { PersonResponse, PersonSimpleResponse } from "@/features/person/domain/person.types";
import type { CourseStatus } from "../constants/course.constants";

export interface CourseCreateRequest {
  classScheduleId: string;
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
  classSchedule?: ClassScheduleResponse;
  classScheduleId?: string;
  nextClassSchedule?: ClassScheduleSimpleResponse | null;
  nextClassScheduleId?: string | null;
  nextScheduleEffectiveFrom: string | null;
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
  classSchedule?: ClassScheduleSimpleResponse;
  nextClassSchedule?: ClassScheduleSimpleResponse | null;
  nextClassScheduleId?: string | null;
  nextScheduleEffectiveFrom: string | null;
  name: string;
  capacity: number;
  status: CourseStatus;
  primaryCoach?: PersonSimpleResponse | null;
}

export interface CourseScheduleChangeRequest {
  classScheduleId: string;
  effectiveFrom: string;
}

export interface CourseScheduleChangeResponse {
  course: CourseResponse;
  cancelledSessionIds: string[];
  generatedSessionIds: string[];
}

export interface CourseListParams {
  search?: string;
  status?: CourseStatus;
  page?: number;
  size?: number;
  sort?: string | string[];
}
