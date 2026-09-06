import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  ClassSessionFilterParams,
  SessionCreateRequest,
  SessionResponse,
  SessionUpdateRequest,
} from './class-session.dto';

export const classSessionApi = {
  async list(params?: ClassSessionFilterParams): Promise<PageResponse<SessionResponse>> {
    return classSessionApi.getList(params);
  },
  async get(sessionId: string): Promise<SessionResponse> {
    return classSessionApi.getDetail(sessionId);
  },
  async getList(params?: ClassSessionFilterParams): Promise<PageResponse<SessionResponse>> {
    const response = await javaApi.get<PageResponse<SessionResponse>>('/class-sessions', { params });
    return response.data;
  },
  async getDetail(sessionId: string): Promise<SessionResponse> {
    const response = await javaApi.get<SessionResponse>(`/class-sessions/${sessionId}`);
    return response.data;
  },
  async create(request: SessionCreateRequest): Promise<SessionResponse> {
    const response = await javaApi.post<SessionResponse>('/class-sessions', request);
    return response.data;
  },
  async update(sessionId: string, request: SessionUpdateRequest): Promise<SessionResponse> {
    const response = await javaApi.put<SessionResponse>(`/class-sessions/${sessionId}`, request);
    return response.data;
  },
  async remove(sessionId: string): Promise<void> {
    await javaApi.delete(`/class-sessions/${sessionId}`);
  },
};
