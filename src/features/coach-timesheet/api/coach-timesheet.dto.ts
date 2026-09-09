import type { PageResponse } from '@/infrastructure/http/pagination.types';

export interface AllowedActions {
  update: boolean;
  delete: boolean;
}

export interface CoachTimesheetCreateRequest {
  classSessionId: string;
  checkInTime: string;
  checkOutTime: string;
  note: string;
}

export interface CoachTimesheetUpdateRequest {
  checkInTime: string;
  checkOutTime: string;
  note: string;
}

export interface CoachTimesheetResponse {
  coachTimesheetId: string;
  courseStaffAssignmentId: string;
  classSessionId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  note: string | null;
  allowedActions: AllowedActions;
  createdAt: string;
  updatedAt: string;
}

export interface CoachTimesheetFilterRequest {
  from: string;
  to: string;
  courseId?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export type CoachTimesheetListResponse = PageResponse<CoachTimesheetResponse>;
