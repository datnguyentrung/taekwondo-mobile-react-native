import type { PageResponse } from "../../../infrastructure/http/pagination.types";
import type {
  CourseScheduleResponse,
  CourseScheduleSimpleResponse,
} from "../../course/api/course.dto";
import type {
  PersonResponse,
  PersonSimpleResponse,
} from "../../person/api/person.dto";
import type {
  AssignmentType,
  CourseStaffAssignmentStatus,
} from "../constants/course-staff-assignment.constants";

export interface CourseStaffAssignmentCreateRequest {
  staffPersonId: string;
  courseScheduleId: string;
  assignmentType: AssignmentType;
  startDate: string;
  endDate: string | null;
  assignmentStatus: CourseStaffAssignmentStatus;
  note: string | null;
}

export type CourseStaffAssignmentUpdateRequest =
  CourseStaffAssignmentCreateRequest;

export interface CourseStaffAssignmentResponse {
  courseStaffAssignmentId: string;
  staffPerson: PersonResponse;
  courseSchedule: CourseScheduleResponse;
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
  courseSchedule: CourseScheduleSimpleResponse;
  assignmentType: AssignmentType;
  startDate: string;
  endDate: string | null;
  assignmentStatus: CourseStaffAssignmentStatus;
}

export interface CourseStaffAssignmentListParams {
  courseId?: string;
  courseScheduleId?: string;
  staffPersonId?: string;
  assignmentTypes?: AssignmentType[];
  effectiveOn?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export type CourseStaffAssignmentListResponse =
  PageResponse<CourseStaffAssignmentSimpleResponse>;
