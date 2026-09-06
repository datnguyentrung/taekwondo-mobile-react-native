import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  NotificationCreateRequest,
  NotificationListParams,
  NotificationResponse,
  NotificationUpdateRequest,
} from './notification.dto';

export const notificationApi = {
  async list(params?: NotificationListParams): Promise<PageResponse<NotificationResponse>> {
    const response = await javaApi.get<PageResponse<NotificationResponse>>('/notifications', { params });
    return response.data;
  },
  async create(request: NotificationCreateRequest): Promise<NotificationResponse> {
    const response = await javaApi.post<NotificationResponse>('/notifications', request);
    return response.data;
  },
  async update(notificationId: string, request: NotificationUpdateRequest): Promise<NotificationResponse> {
    const response = await javaApi.put<NotificationResponse>(`/notifications/${notificationId}`, request);
    return response.data;
  },
  async getDetail(notificationId: string): Promise<NotificationResponse> {
    const response = await javaApi.get<NotificationResponse>(`/notifications/${notificationId}`);
    return response.data;
  },
  async get(notificationId: string): Promise<NotificationResponse> {
    return notificationApi.getDetail(notificationId);
  },
  async remove(notificationId: string): Promise<void> {
    await javaApi.delete(`/notifications/${notificationId}`);
  },
};
