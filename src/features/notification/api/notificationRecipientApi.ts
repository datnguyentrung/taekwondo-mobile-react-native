import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  NotificationRecipientFilterParams,
  NotificationRecipientListResponse,
  NotificationRecipientResponse,
} from './notification.dto';

export const notificationRecipientApi = {
  async getMine(params?: NotificationRecipientFilterParams): Promise<NotificationRecipientListResponse> {
    const response = await javaApi.get<NotificationRecipientListResponse>('/notification-recipients', { params });
    return response.data;
  },
  async getDetail(notificationRecipientId: string): Promise<NotificationRecipientResponse> {
    const response = await javaApi.get<NotificationRecipientResponse>(`/notification-recipients/${notificationRecipientId}`);
    return response.data;
  },
  async markRead(notificationRecipientId: string): Promise<void> {
    await javaApi.patch(`/notification-recipients/${notificationRecipientId}/read`);
  },
};
