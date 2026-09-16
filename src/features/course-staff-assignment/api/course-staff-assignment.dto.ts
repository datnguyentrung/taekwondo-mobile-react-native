import type { CourseResponse, CourseSimpleResponse } from '@/features/course/api/course.dto';
import type { PersonResponse, PersonSimpleResponse } from '@/features/person/api/person.dto';
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
  staffPerson: PersonResponse;
  course: CourseResponse;
  assignmentType: AssignmentType;
  startDate: string;
  endDate: string | null;
  assignmentStatus: CourseStaffAssignmentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseStaffAssignmentSimpleResponse {
  courseStaffAssignmentId: string;
  staffPerson: PersonSimpleResponse;
  course: CourseSimpleResponse;
  assignmentType: AssignmentType;
  startDate: string;
  endDate: string | null;
  assignmentStatus: CourseStaffAssignmentStatus;
}

export interface CourseStaffAssignmentListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}

export type CourseStaffAssignmentListResponse =
  PageResponse<CourseStaffAssignmentSimpleResponse>;
