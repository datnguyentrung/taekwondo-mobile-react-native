import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  CoursePriceCreateRequest,
  CoursePriceListParams,
  CoursePriceResponse,
  CoursePriceUpdateRequest,
} from './course-price.dto';

export const coursePriceApi = {
  async list(params?: CoursePriceListParams): Promise<PageResponse<CoursePriceResponse>> {
    const response = await javaApi.get<PageResponse<CoursePriceResponse>>('/course-prices', { params });
    return response.data;
  },
  async get(coursePriceId: string): Promise<CoursePriceResponse> {
    const response = await javaApi.get<CoursePriceResponse>(`/course-prices/${coursePriceId}`);
    return response.data;
  },
  async create(request: CoursePriceCreateRequest): Promise<CoursePriceResponse> {
    const response = await javaApi.post<CoursePriceResponse>('/course-prices', request);
    return response.data;
  },
  async update(coursePriceId: string, request: CoursePriceUpdateRequest): Promise<CoursePriceResponse> {
    const response = await javaApi.put<CoursePriceResponse>(`/course-prices/${coursePriceId}`, request);
    return response.data;
  },
  async remove(coursePriceId: string): Promise<void> {
    await javaApi.delete(`/course-prices/${coursePriceId}`);
  },
};
