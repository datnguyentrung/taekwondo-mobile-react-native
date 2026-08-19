import { javaApi } from '@/infrastructure/http/httpClient';
import type { MobileUploadFile } from '@/infrastructure/http/http.types';
import { createJsonMultipartFormData } from '@/infrastructure/http/multipart';

import type { YearlySummaryResponse } from '@/features/leaderboard/api/yearly-summary.dto';
import type {
  GetStudentsParams,
  StudentCreateRequest,
  StudentDetail,
  StudentListResponse,
  StudentUpdateRequest,
} from './student.dto';

export const studentApi = {
  async create(request: StudentCreateRequest, file?: MobileUploadFile): Promise<StudentDetail> {
    const response = await javaApi.post<StudentDetail>(
      '/students',
      createJsonMultipartFormData(request, file),
    );
    return response.data;
  },
  async getList(params?: GetStudentsParams): Promise<StudentListResponse> {
    const response = await javaApi.get<StudentListResponse>('/students', { params });
    return response.data;
  },
  async getDetail(studentCode: string): Promise<StudentDetail> {
    const response = await javaApi.get<StudentDetail>(`/students/${studentCode}`);
    return response.data;
  },
  async getYearlySummary(studentCode: string, year: number): Promise<YearlySummaryResponse> {
    const response = await javaApi.get<YearlySummaryResponse>(`/students/${studentCode}/yearly-summary`, { params: { year } });
    return response.data;
  },
  async update(personId: string, request: StudentUpdateRequest, file?: MobileUploadFile): Promise<StudentDetail> {
    const response = await javaApi.put<StudentDetail>(
      `/students/${personId}`,
      createJsonMultipartFormData(request, file),
    );
    return response.data;
  },
  async remove(studentCode: string): Promise<void> {
    await javaApi.delete(`/students/${studentCode}`);
  },
  async permanentlyRemove(studentCode: string): Promise<void> {
    await javaApi.delete(`/students/${studentCode}/permanent`);
  },
};
