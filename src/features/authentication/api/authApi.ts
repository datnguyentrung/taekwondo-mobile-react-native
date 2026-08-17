import { javaApi } from '@/infrastructure/http/httpClient';

import type { UserContext } from '../domain/auth.types';
import type {
  AuthResponse,
  AuthSession,
  DevicePlatform,
  LoginRequest,
  LogoutRequest,
  MobileAuthResponse,
  RefreshRequest,
  SwitchContextRequest,
} from './auth.dto';

export const authApi = {
  async login(request: LoginRequest): Promise<MobileAuthResponse> {
    const response = await javaApi.post<MobileAuthResponse>(
      '/auth/mobile/login',
      request,
    );
    return response.data;
  },

  async logout(request: LogoutRequest): Promise<void> {
    await javaApi.post('/auth/mobile/logout', request);
  },

  async refresh(request: RefreshRequest): Promise<MobileAuthResponse> {
    const response = await javaApi.post<MobileAuthResponse>(
      '/auth/mobile/refresh',
      request,
    );
    return response.data;
  },

  async getAccount(): Promise<AuthResponse> {
    const response = await javaApi.get<AuthResponse>('/auth/account');
    return response.data;
  },

  async getContexts(): Promise<UserContext[]> {
    const response = await javaApi.get<UserContext[]>('/auth/contexts');
    return response.data;
  },

  async switchContext(request: SwitchContextRequest): Promise<AuthResponse> {
    const response = await javaApi.post<AuthResponse>(
      '/auth/switch-context',
      request,
    );
    return response.data;
  },

  async logoutAll(): Promise<void> {
    await javaApi.post('/auth/logout-all');
  },

  async updateFcm(fcmToken: string, platform: DevicePlatform): Promise<void> {
    await javaApi.post('/auth/update-fcm', { fcmToken, platform });
  },

  async getSessions(): Promise<AuthSession[]> {
    const response = await javaApi.get<AuthSession[]>('/auth/sessions');
    return response.data;
  },
};
