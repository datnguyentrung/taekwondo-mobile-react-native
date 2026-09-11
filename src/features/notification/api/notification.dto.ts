import type {
  NotificationRecipientStatus,
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

/** App-facing inbox item (`GET /notification-recipients/mine`). */
export interface NotificationRecipientMine {
  notificationRecipientId: string;
  notificationId: string;
  contextPersonId: string | null;
  title: string;
  body: string;
  notificationType: NotificationType;
  referenceType: string | null;
  referenceId: string | null;
  payload: string | null;
  read: boolean;
  readAt: string | null;
  deliveredAt: string | null;
  notificationRecipientStatus: NotificationRecipientStatus;
  createdAt: string;
}

/** Management detail (`GET /notification-recipients/{id}`). */
export interface NotificationRecipientAdminDetail {
  notificationRecipientId: string;
  notificationId: string;
  recipientUserId: string;
  contextPersonId: string | null;
  read: boolean;
  readAt: string | null;
  deliveredAt: string | null;
  notificationRecipientStatus: NotificationRecipientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MineListParams {
  page?: number;
  size?: number;
  read?: boolean;
  type?: NotificationType;
  search?: string;
}
