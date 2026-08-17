import type {
  AuthContextType,
  AuthSession,
  AuthUser,
  UserContext,
} from '../domain/auth.types';
import type { NotificationPlatform } from '@/infrastructure/notifications/notification.types';

export type DevicePlatform = NotificationPlatform;

export type LoginRequest = {
  phoneNumber: string;
  password: string;
  idDevice: string;
  fcmToken?: string | null;
  platform: DevicePlatform;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type SwitchContextRequest = {
  personId: string;
  contextType: AuthContextType;
};

export type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
  activeContext: UserContext | null;
  availableContexts: UserContext[];
  requiresContextSelection: boolean;
};

export type MobileAuthResponse = AuthResponse & {
  accessToken: string;
  refreshToken: string;
};

export type { AuthSession };
