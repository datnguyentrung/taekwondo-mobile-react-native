import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  CourseCreateRequest,
  CourseListParams,
  CourseResponse,
  CourseScheduleChangeRequest,
  CourseScheduleChangeResponse,
  CourseUpdateRequest,
} from './course.dto';

export const courseApi = {
  async list(params?: CourseListParams): Promise<PageResponse<CourseResponse>> {
    const response = await javaApi.get<PageResponse<CourseResponse>>('/courses', { params });
    return response.data;
  },
  async get(courseId: string): Promise<CourseResponse> {
    const response = await javaApi.get<CourseResponse>(`/courses/${courseId}`);
    return response.data;
  },
  async create(request: CourseCreateRequest): Promise<CourseResponse> {
    const response = await javaApi.post<CourseResponse>('/courses', request);
    return response.data;
  },
  async update(courseId: string, request: CourseUpdateRequest): Promise<CourseResponse> {
    const response = await javaApi.put<CourseResponse>(`/courses/${courseId}`, request);
    return response.data;
  },
  async changeSchedule(
    courseId: string,
    request: CourseScheduleChangeRequest,
  ): Promise<CourseScheduleChangeResponse> {
    const response = await javaApi.put<CourseScheduleChangeResponse>(
      `/courses/${courseId}/schedule`,
      request,
    );
    return response.data;
  },
  async cancelPendingScheduleChange(courseId: string): Promise<void> {
    await javaApi.delete(`/courses/${courseId}/schedule/pending`);
  },
  async remove(courseId: string): Promise<void> {
    await javaApi.delete(`/courses/${courseId}`);
  },
};
