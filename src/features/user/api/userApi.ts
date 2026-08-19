import { javaApi } from '@/infrastructure/http/httpClient';

import type {
  ChangePasswordRequest,
  UserCreateRequest,
  UserDetail,
  UserResponse,
} from './user.dto';

export const userApi = {
  async create(request: UserCreateRequest): Promise<UserDetail> {
    const response = await javaApi.post<UserDetail>('/users', request);
    return response.data;
  },
  async changePassword(request: ChangePasswordRequest): Promise<string> {
    const response = await javaApi.post<string>('/users/me/change-password', request);
    return response.data;
  },
  async getMe(): Promise<UserResponse[]> {
    const response = await javaApi.get<UserResponse[]>('/users/me');
    return response.data;
  },
};
