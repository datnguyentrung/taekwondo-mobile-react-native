import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  NotificationRecipientCreateRequest,
  NotificationRecipientFilterParams,
  NotificationRecipientListResponse,
  NotificationRecipientResponse,
  NotificationRecipientUpdateRequest,
} from './notification.dto';

export const notificationRecipientApi = {
  async list(params?: NotificationRecipientFilterParams): Promise<PageResponse<NotificationRecipientResponse>> {
    const response = await javaApi.get<PageResponse<NotificationRecipientResponse>>('/notification-recipients', { params });
    return response.data;
  },
  async getMine(params?: NotificationRecipientFilterParams): Promise<NotificationRecipientListResponse> {
    const response = await javaApi.get<NotificationRecipientListResponse>('/notification-recipients', { params });
    return response.data;
  },
  async create(request: NotificationRecipientCreateRequest): Promise<NotificationRecipientResponse> {
    const response = await javaApi.post<NotificationRecipientResponse>('/notification-recipients', request);
    return response.data;
  },
  async update(
    notificationRecipientId: string,
    request: NotificationRecipientUpdateRequest,
  ): Promise<NotificationRecipientResponse> {
    const response = await javaApi.put<NotificationRecipientResponse>(
      `/notification-recipients/${notificationRecipientId}`,
      request,
    );
    return response.data;
  },
  async getDetail(notificationRecipientId: string): Promise<NotificationRecipientResponse> {
    const response = await javaApi.get<NotificationRecipientResponse>(`/notification-recipients/${notificationRecipientId}`);
    return response.data;
  },
  async get(notificationRecipientId: string): Promise<NotificationRecipientResponse> {
    return notificationRecipientApi.getDetail(notificationRecipientId);
  },
  async markRead(notificationRecipientId: string): Promise<void> {
    await javaApi.patch(`/notification-recipients/${notificationRecipientId}/read`);
  },
  async remove(notificationRecipientId: string): Promise<void> {
    await javaApi.delete(`/notification-recipients/${notificationRecipientId}`);
  },
};
