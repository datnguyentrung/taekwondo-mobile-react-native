import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  AttendanceFilterParams,
  StudentAttendanceCreateRequest,
  StudentAttendanceResponse,
  StudentAttendanceListResponse,
  StudentAttendanceUpdateRequest,
} from './student-attendance.dto';

export const studentAttendanceApi = {
  async list(params: AttendanceFilterParams): Promise<StudentAttendanceListResponse> {
    const response = await javaApi.get<StudentAttendanceListResponse>('/student-attendances', { params });
    return response.data;
  },
  async get(studentAttendanceId: string): Promise<StudentAttendanceResponse> {
    const response = await javaApi.get<StudentAttendanceResponse>(`/student-attendances/${studentAttendanceId}`);
    return response.data;
  },
  async create(request: StudentAttendanceCreateRequest): Promise<StudentAttendanceResponse> {
    const response = await javaApi.post<StudentAttendanceResponse>('/student-attendances', request);
    return response.data;
  },
  async update(studentAttendanceId: string, request: StudentAttendanceUpdateRequest): Promise<StudentAttendanceResponse> {
    const response = await javaApi.put<StudentAttendanceResponse>(`/student-attendances/${studentAttendanceId}`, request);
    return response.data;
  },
  async remove(studentAttendanceId: string): Promise<void> {
    await javaApi.delete(`/student-attendances/${studentAttendanceId}`);
  },
};
