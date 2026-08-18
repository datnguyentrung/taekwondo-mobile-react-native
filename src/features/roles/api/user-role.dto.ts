export interface AssignUserRoleRequest {
  userId: string;
  roleCode: string;
}

export interface UserRoleResponse {
  userId: string;
  roleCodes: string[];
}
