import type { CoachAssignmentStatus } from '../constants/coach-assignment.constants';
import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { CoachSummary } from '@/features/coach/api/coach-summary.dto';

export interface CoachAssignmentCreateRequest {
  coachId: string;
  scheduleIds: string[];
  assignmentDate: string;
  endDate?: string | null;
  note?: string;
}

export interface CoachAssignmentUpdateRequest {
  status: CoachAssignmentStatus;
  assignmentDate?: string;
  endDate?: string | null;
  note?: string;
}

export interface CoachAssignmentFilterRequest {
  coachId?: string;
  classScheduleId?: string;
  branchId?: number;
  status?: CoachAssignmentStatus;
  startDate?: string;
  endDate?: string;
  effectiveDate?: string;
  search?: string;
}
export interface CoachAssignmentResponse {
  assignmentId: string;
  classSchedule: ClassScheduleSummary;
  assignedDate: string;
  endDate: string | null;
  status: CoachAssignmentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachAssignmentSimpleResponse {
  assignmentId: string;
  coach: CoachSummary;
  classSchedule: ClassScheduleSummary;
  assignedDate: string;
  endDate: string | null;
  status: CoachAssignmentStatus;
}
