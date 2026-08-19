import { javaApi } from '@/infrastructure/http/httpClient';

import type { NotificationCreateRequest, NotificationResponse } from './notification.dto';

export const notificationApi = {
  async create(request: NotificationCreateRequest): Promise<NotificationResponse> {
    const response = await javaApi.post<NotificationResponse>('/notifications', request);
    return response.data;
  },
  async getDetail(notificationId: string): Promise<NotificationResponse> {
    const response = await javaApi.get<NotificationResponse>(`/notifications/${notificationId}`);
    return response.data;
  },
};
