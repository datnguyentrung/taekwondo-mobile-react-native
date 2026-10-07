import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  CourseCreateRequest,
  CourseListParams,
  CourseResponse,
  CourseScheduleResponse,
  CourseScheduleUpsertRequest,
  CourseSimpleResponse,
  CourseUpdateRequest,
} from './course.dto';

export const courseApi = {
  async list(params?: CourseListParams): Promise<PageResponse<CourseSimpleResponse>> {
    const response = await javaApi.get<PageResponse<CourseSimpleResponse>>('/courses', { params });
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
  async addSchedule(courseId: string, request: CourseScheduleUpsertRequest): Promise<CourseScheduleResponse> {
    const response = await javaApi.post<CourseScheduleResponse>(`/courses/${courseId}/schedules`, request);
    return response.data;
  },
  async updateSchedule(courseId: string, courseScheduleId: string, request: CourseScheduleUpsertRequest): Promise<CourseScheduleResponse> {
    const response = await javaApi.put<CourseScheduleResponse>(`/courses/${courseId}/schedules/${courseScheduleId}`, request);
    return response.data;
  },
  async removeSchedule(courseId: string, courseScheduleId: string): Promise<void> {
    await javaApi.delete(`/courses/${courseId}/schedules/${courseScheduleId}`);
  },
  async remove(courseId: string): Promise<void> {
    await javaApi.delete(`/courses/${courseId}`);
  },
};
