import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  AttendanceFilterParams,
  SessionAttendanceCreateRequest,
  SessionAttendanceListResponse,
  SessionAttendanceResponse,
  SessionAttendanceUpdateRequest,
} from './student-attendance.dto';

export const sessionAttendanceApi = {
  async list(params?: AttendanceFilterParams): Promise<SessionAttendanceListResponse> {
    const response = await javaApi.get<SessionAttendanceListResponse>('/session-attendances', { params });
    return response.data;
  },
  async get(sessionAttendanceId: string): Promise<SessionAttendanceResponse> {
    const response = await javaApi.get<SessionAttendanceResponse>(`/session-attendances/${sessionAttendanceId}`);
    return response.data;
  },
  async create(request: SessionAttendanceCreateRequest): Promise<SessionAttendanceResponse> {
    const response = await javaApi.post<SessionAttendanceResponse>('/session-attendances', request);
    return response.data;
  },
  async update(
    sessionAttendanceId: string,
    request: SessionAttendanceUpdateRequest,
  ): Promise<SessionAttendanceResponse> {
    const response = await javaApi.put<SessionAttendanceResponse>(
      `/session-attendances/${sessionAttendanceId}`,
      request,
    );
    return response.data;
  },
  async remove(sessionAttendanceId: string): Promise<void> {
    await javaApi.delete(`/session-attendances/${sessionAttendanceId}`);
  },
};

export const studentAttendanceApi = sessionAttendanceApi;
