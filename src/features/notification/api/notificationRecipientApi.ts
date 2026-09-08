import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  NotificationRecipientAdminResponse,
  NotificationRecipientCreateRequest,
  NotificationRecipientFilterParams,
  NotificationRecipientListResponse,
  NotificationRecipientResponse,
  NotificationRecipientUpdateRequest,
} from './notification.dto';

export const notificationRecipientApi = {
  async getMine(
    params?: NotificationRecipientFilterParams,
  ): Promise<NotificationRecipientListResponse> {
    const response = await javaApi.get<NotificationRecipientListResponse>(
      '/notification-recipients',
      { params },
    );
    return response.data;
  },

  async getDetail(notificationRecipientId: string): Promise<NotificationRecipientResponse> {
    const response = await javaApi.get<NotificationRecipientResponse>(
      `/notification-recipients/${notificationRecipientId}`,
    );
    return response.data;
  },

  async markRead(notificationRecipientId: string): Promise<void> {
    await javaApi.patch(`/notification-recipients/${notificationRecipientId}/read`);
  },

  async create(request: NotificationRecipientCreateRequest): Promise<NotificationRecipientAdminResponse> {
    const response = await javaApi.post<NotificationRecipientAdminResponse>(
      '/notification-recipients',
      request,
    );
    return response.data;
  },

  async update(
    notificationRecipientId: string,
    request: NotificationRecipientUpdateRequest,
  ): Promise<NotificationRecipientAdminResponse> {
    const response = await javaApi.put<NotificationRecipientAdminResponse>(
      `/notification-recipients/${notificationRecipientId}`,
      request,
    );
    return response.data;
  },

  async remove(notificationRecipientId: string): Promise<void> {
    await javaApi.delete(`/notification-recipients/${notificationRecipientId}`);
  },
};
