import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  PermissionCreateRequest,
  PermissionListParams,
  PermissionResponse,
  PermissionUpdateRequest,
} from './permission.dto';

export const permissionApi = {
  async list(params?: PermissionListParams): Promise<PageResponse<PermissionResponse>> {
    const response = await javaApi.get<PageResponse<PermissionResponse>>('/permissions', { params });
    return response.data;
  },
  async get(permissionId: number): Promise<PermissionResponse> {
    const response = await javaApi.get<PermissionResponse>(`/permissions/${permissionId}`);
    return response.data;
  },
  async create(request: PermissionCreateRequest): Promise<PermissionResponse> {
    const response = await javaApi.post<PermissionResponse>('/permissions', request);
    return response.data;
  },
  async update(permissionId: number, request: PermissionUpdateRequest): Promise<PermissionResponse> {
    const response = await javaApi.put<PermissionResponse>(`/permissions/${permissionId}`, request);
    return response.data;
  },
  async remove(permissionId: number): Promise<void> {
    await javaApi.delete(`/permissions/${permissionId}`);
  },
};
