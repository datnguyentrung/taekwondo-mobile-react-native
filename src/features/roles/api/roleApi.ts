import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  RoleCreateRequest,
  RoleListParams,
  RoleResponse,
  RoleUpdateRequest,
} from './role.dto';

export const roleApi = {
  async list(params?: RoleListParams): Promise<PageResponse<RoleResponse>> {
    const response = await javaApi.get<PageResponse<RoleResponse>>('/roles', { params });
    return response.data;
  },
  async get(roleCode: string): Promise<RoleResponse> {
    const response = await javaApi.get<RoleResponse>(`/roles/${roleCode}`);
    return response.data;
  },
  async create(request: RoleCreateRequest): Promise<RoleResponse> {
    const response = await javaApi.post<RoleResponse>('/roles', request);
    return response.data;
  },
  async update(roleCode: string, request: RoleUpdateRequest): Promise<RoleResponse> {
    const response = await javaApi.put<RoleResponse>(`/roles/${roleCode}`, request);
    return response.data;
  },
  async remove(roleCode: string): Promise<void> {
    await javaApi.delete(`/roles/${roleCode}`);
  },
};
