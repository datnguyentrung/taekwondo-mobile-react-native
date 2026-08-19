import { javaApi } from '@/infrastructure/http/httpClient';

import type { AssignUserRoleRequest, UserRoleResponse } from './user-role.dto';

export const userRoleApi = {
  async assign(request: AssignUserRoleRequest): Promise<UserRoleResponse> {
    const response = await javaApi.post<UserRoleResponse>('/user-roles', request);
    return response.data;
  },
};
