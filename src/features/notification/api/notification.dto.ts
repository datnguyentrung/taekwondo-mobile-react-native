import type { PageResponse } from '@/infrastructure/http/pagination.types';
import type { NotificationRecipientStatus, NotificationType } from '../constants/notification.constants';

export interface NotificationCreateRequest {
  title: string;
  body: string;
  notificationType?: NotificationType;
  referenceType?: string;
  referenceId?: string;
  payload?: string;
  recipientUserIds: string[];
}

export interface NotificationRecipientResponse {
  notificationRecipientId: string;
  notificationId: string;
  recipientUserId: string;
  title: string;
  body: string;
  notificationType: NotificationType;
  referenceType: string | null;
  referenceId: string | null;
  payload: string | null;
  read: boolean;
  readAt: string | null;
  deliveredAt: string | null;
  recipientStatus: NotificationRecipientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notificationId: string;
  title: string;
  body: string;
  notificationType: NotificationType;
  referenceType: string | null;
  referenceId: string | null;
  payload: string | null;
  createdAt: string;
  recipientCount: number;
}

export interface NotificationRecipientListResponse {
  unreadCount: number;
  notifications: PageResponse<NotificationRecipientResponse>;
}

export interface NotificationRecipientFilterParams {
  read?: boolean;
  status?: NotificationRecipientStatus;
  type?: NotificationType;
  fromCreatedAt?: string;
  toCreatedAt?: string;
  fromReadAt?: string;
  toReadAt?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
