import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type { CoachAssignmentStatus } from '../constants/coach-assignment.constants';
import type {
  CoachAssignmentCreateRequest,
  CoachAssignmentExistsParams,
  CoachAssignmentFilterRequest,
  CoachAssignmentResponse,
  CoachAssignmentSimpleResponse,
  CoachAssignmentUpdateRequest,
} from './coach-assignment.dto';

export const coachAssignmentApi = {
  async list(params?: CoachAssignmentFilterRequest): Promise<PageResponse<CoachAssignmentResponse>> {
    return coachAssignmentApi.getList(params);
  },
  async get(assignmentId: string): Promise<CoachAssignmentResponse> {
    return coachAssignmentApi.getDetail(assignmentId);
  },
  async create(request: CoachAssignmentCreateRequest): Promise<CoachAssignmentSimpleResponse[]> {
    const response = await javaApi.post<CoachAssignmentSimpleResponse[]>('/coach-assignments', request);
    return response.data;
  },
  async update(assignmentId: string, request: CoachAssignmentUpdateRequest): Promise<string> {
    const response = await javaApi.put<string>(`/coach-assignments/${assignmentId}`, request);
    return response.data;
  },
  async remove(assignmentId: string): Promise<void> {
    await javaApi.delete(`/coach-assignments/${assignmentId}`);
  },
  async getDetail(assignmentId: string): Promise<CoachAssignmentResponse> {
    const response = await javaApi.get<CoachAssignmentResponse>(`/coach-assignments/${assignmentId}`);
    return response.data;
  },
  async getList(params?: CoachAssignmentFilterRequest): Promise<PageResponse<CoachAssignmentResponse>> {
    const response = await javaApi.get<PageResponse<CoachAssignmentResponse>>('/coach-assignments', { params });
    return response.data;
  },
  async getByCoach(coachId: string, status?: CoachAssignmentStatus): Promise<CoachAssignmentResponse[]> {
    const response = await javaApi.get<CoachAssignmentResponse[]>(`/coach-assignments/coach/${coachId}`, { params: status ? { status } : undefined });
    return response.data;
  },
  async exists(params: CoachAssignmentExistsParams): Promise<boolean> {
    const response = await javaApi.get<boolean>('/coach-assignments/exists', { params });
    return response.data;
  },
};
