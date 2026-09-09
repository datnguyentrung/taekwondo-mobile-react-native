import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type {
  AssignmentType,
  CourseStaffAssignmentStatus,
} from '../constants/course-staff-assignment.constants';

export interface CourseStaffAssignmentCreateRequest {
  staffPersonId: string;
  courseId: string;
  assignmentType: AssignmentType;
  startDate: string;
  endDate: string | null;
  assignmentStatus: CourseStaffAssignmentStatus;
  note: string | null;
}

export type CourseStaffAssignmentUpdateRequest = CourseStaffAssignmentCreateRequest;

export interface CourseStaffAssignmentResponse {
  courseStaffAssignmentId: string;
  staffPersonId: string;
  courseId: string;
  assignmentType: AssignmentType;
  startDate: string;
  endDate: string | null;
  assignmentStatus: CourseStaffAssignmentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseStaffAssignmentListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}

export type CourseStaffAssignmentListResponse =
  PageResponse<CourseStaffAssignmentResponse>;
