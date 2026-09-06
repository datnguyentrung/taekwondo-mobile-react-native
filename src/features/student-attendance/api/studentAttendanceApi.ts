import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  AttendanceBatchCreateRequest,
  AttendanceCheckInRequest,
  AttendanceFilterParams,
  AttendanceListResponse,
  AttendanceManualLogRequest,
  AttendanceUpdateEvaluationRequest,
  AttendanceUpdateStatusRequest,
  StudentAttendanceCreateRequest,
  StudentAttendanceResponse,
  StudentAttendanceSimpleResponse,
  StudentAttendanceUpdateRequest,
} from './student-attendance.dto';

export const studentAttendanceApi = {
  async list(params?: AttendanceFilterParams): Promise<AttendanceListResponse> {
    return studentAttendanceApi.getList(params);
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
  async updateMany(request: StudentAttendanceSimpleResponse[]): Promise<StudentAttendanceResponse[]> {
    const response = await javaApi.put<StudentAttendanceResponse[]>('/student-attendances', request);
    return response.data;
  },
  async updateStatus(attendanceId: string, request: AttendanceUpdateStatusRequest): Promise<StudentAttendanceResponse> {
    const response = await javaApi.patch<StudentAttendanceResponse>(`/student-attendances/${attendanceId}/status`, request);
    return response.data;
  },
  async updateEvaluation(attendanceId: string, request: AttendanceUpdateEvaluationRequest): Promise<void> {
    await javaApi.patch(`/student-attendances/${attendanceId}/evaluation`, request);
  },
  async createManual(request: AttendanceManualLogRequest): Promise<StudentAttendanceResponse> {
    const response = await javaApi.post<StudentAttendanceResponse>('/student-attendances', request);
    return response.data;
  },
  async checkIn(request: AttendanceCheckInRequest): Promise<StudentAttendanceResponse> {
    const response = await javaApi.post<StudentAttendanceResponse>('/student-attendances/check-in', request);
    return response.data;
  },
  async initialize(request: AttendanceBatchCreateRequest): Promise<StudentAttendanceResponse[]> {
    const response = await javaApi.post<StudentAttendanceResponse[]>('/student-attendances/batch-init', request);
    return response.data;
  },
  async getList(params?: AttendanceFilterParams): Promise<AttendanceListResponse> {
    const response = await javaApi.get<AttendanceListResponse>('/student-attendances', { params });
    return response.data;
  },
  async removeMany(attendanceIds: string[]): Promise<void> {
    await javaApi.delete('/student-attendances', { data: attendanceIds });
  },
};
