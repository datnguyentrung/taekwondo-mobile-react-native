import type { CourseStatus } from '../constants/course.constants';

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
  classScheduleId: string;
  nextClassScheduleId: string | null;
  nextScheduleEffectiveFrom: string | null;
  name: string;
  capacity: number;
  status: CourseStatus;
  classSessionGeneratedUntil: string | null;
  createdAt: string;
  updatedAt: string;
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
  page?: number;
  size?: number;
  sort?: string | string[];
}
