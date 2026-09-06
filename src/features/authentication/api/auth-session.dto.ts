export interface AuthSessionCreateRequest {
  userId: string;
  activeUserPersonId: string;
  refreshTokenHash: string;
  deviceInfo: string;
  platform: string;
  fcmToken: string;
  expiresAt: string;
  revoked: boolean;
  revokedAt: string;
  version: number;
}

export type AuthSessionUpdateRequest = AuthSessionCreateRequest;

export interface AuthSessionResponse {
  authSessionId: string;
  userId: string;
  activeUserPersonId: string;
  refreshTokenHash: string;
  deviceInfo: string;
  platform: string;
  fcmToken: string;
  expiresAt: string;
  revoked: boolean;
  revokedAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
