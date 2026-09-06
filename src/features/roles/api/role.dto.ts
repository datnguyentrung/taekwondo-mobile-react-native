export interface RoleCreateRequest {
  code: string;
  name: string;
  description: string;
  permissionVersion: number;
}

export interface RoleUpdateRequest {
  name: string;
  description: string;
  permissionVersion: number;
}

export interface RoleResponse {
  code: string;
  name: string;
  description: string;
  permissionVersion: number;
}

export interface RoleListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
