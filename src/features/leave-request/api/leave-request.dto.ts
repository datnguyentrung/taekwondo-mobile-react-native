import type { LeaveRequestStatus, RequesterType } from '../constants/leave-request.constants';

export interface LeaveRequestCreateRequest {
  personId: string;
  requesterType: RequesterType;
  leaveDate?: string | null;
  leaveClassSessionId?: string | null;
  makeupClassSessionId?: string | null;
  leaveContext: string;
}

export interface LeaveRequestReviewCommand {
  reviewNote?: string | null;
}

export interface LeaveRequestResponse {
  leaveRequestId: string;
  personId: string;
  requesterType: RequesterType;
  leaveDate: string | null;
  leaveClassSessionId: string | null;
  makeupClassSessionId: string | null;
  leaveContext: string;
  status: LeaveRequestStatus;
  createdByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
