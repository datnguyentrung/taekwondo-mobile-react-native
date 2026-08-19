import { javaApi } from '@/infrastructure/http/httpClient';
import type { MobileUploadFile } from '@/infrastructure/http/http.types';
import { createJsonMultipartFormData } from '@/infrastructure/http/multipart';

import type { CoachCreateRequest, CoachDetail, CoachUpdateRequest } from './coach.dto';

export const coachApi = {
  async create(request: CoachCreateRequest, file?: MobileUploadFile): Promise<CoachDetail> {
    const response = await javaApi.post<CoachDetail>(
      '/coaches',
      createJsonMultipartFormData(request, file),
    );
    return response.data;
  },
  async getDetail(staffCode: string): Promise<CoachDetail> {
    const response = await javaApi.get<CoachDetail>(`/coaches/${staffCode}`);
    return response.data;
  },
  async getList(): Promise<CoachDetail[]> {
    const response = await javaApi.get<CoachDetail[]>('/coaches');
    return response.data;
  },
  async update(personId: string, request: CoachUpdateRequest, file?: MobileUploadFile): Promise<CoachDetail> {
    const response = await javaApi.put<CoachDetail>(
      `/coaches/${personId}`,
      createJsonMultipartFormData(request, file),
    );
    return response.data;
  },
  async remove(personId: string): Promise<void> {
    await javaApi.delete(`/coaches/${personId}`);
  },
  async permanentlyRemove(staffCode: string): Promise<void> {
    await javaApi.delete(`/coaches/${staffCode}/permanent`);
  },
};
