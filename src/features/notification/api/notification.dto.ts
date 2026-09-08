import type { PageResponse } from "@/infrastructure/http/pagination.types";
import type {
  NotificationRecipientStatus,
  NotificationSortBy,
  NotificationSortDir,
  NotificationType,
} from "../constants/notification.constants";

export interface NotificationCreateRequest {
  title: string;
  body: string;
  notificationType?: NotificationType | null;
  referenceType?: string | null;
  referenceId?: string | null;
  payload?: string | null;
  recipientUserIds: string[];
}

export interface NotificationUpdateRequest {
  title: string;
  body: string;
  notificationType: NotificationType;
  referenceType: string;
  referenceId: string;
  payload: string;
}

export interface NotificationListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
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
  recipientCount: number | null;
}

export interface NotificationRecipientCreateRequest {
  notificationId: string;
  recipientUserId: string;
  read: boolean;
  readAt: string;
  deliveredAt: string;
  notificationRecipientStatus: NotificationRecipientStatus;
}

export type NotificationRecipientUpdateRequest = NotificationRecipientCreateRequest;

export interface NotificationRecipientAdminResponse {
  notificationRecipientId: string;
  notificationId: string;
  recipientUserId: string;
  read: boolean;
  readAt: string | null;
  deliveredAt: string | null;
  notificationRecipientStatus: NotificationRecipientStatus;
  createdAt: string;
  updatedAt: string;
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
  sortBy?: NotificationSortBy;
  sortDir?: NotificationSortDir;
}
