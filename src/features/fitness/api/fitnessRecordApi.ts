import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  FitnessRecordCreateRequest,
  FitnessRecordListParams,
  FitnessRecordListResponse,
  FitnessRecordResponse,
  FitnessRecordUpdateRequest,
} from './fitness-record.dto';

export const fitnessRecordApi = {
  async create(request: FitnessRecordCreateRequest): Promise<FitnessRecordResponse> {
    const response = await javaApi.post<FitnessRecordResponse>('/fitness-record', request);
    return response.data;
  },
  async update(id: number, request: FitnessRecordUpdateRequest): Promise<FitnessRecordResponse> {
    const response = await javaApi.put<FitnessRecordResponse>(`/fitness-record/${id}`, request);
    return response.data;
  },
  async remove(id: number): Promise<void> {
    await javaApi.delete(`/fitness-record/${id}`);
  },
  async getList(params?: FitnessRecordListParams): Promise<PageResponse<FitnessRecordListResponse>> {
    const response = await javaApi.get<PageResponse<FitnessRecordListResponse>>('/fitness-record', { params });
    return response.data;
  },
};
