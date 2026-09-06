import type { RelationshipType } from '@/features/authentication/domain/auth.types';

export interface UserPersonCreateRequest {
  userId: string;
  personId: string;
  relationshipType: RelationshipType;
  active: boolean;
}

export type UserPersonUpdateRequest = UserPersonCreateRequest;

export interface UserPersonResponse {
  userPersonId: string;
  userId: string;
  personId: string;
  relationshipType: RelationshipType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPersonListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
