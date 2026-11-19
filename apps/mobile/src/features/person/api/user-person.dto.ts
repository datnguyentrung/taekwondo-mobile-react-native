import type { RelationshipType } from "../../authentication/domain/auth.types";
import type { UserSimpleResponse } from "../../user/api/user.dto";
import type { PersonResponse, PersonSimpleResponse } from "./person.dto";

export interface UserPersonCreateRequest {
  userId: string;
  personId: string;
  relationshipType: RelationshipType;
  active: boolean;
}

export type UserPersonUpdateRequest = UserPersonCreateRequest;

export interface UserPersonResponse {
  userPersonId: string;
  user: UserSimpleResponse;
  person: PersonResponse;
  relationshipType: RelationshipType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPersonSimpleResponse {
  userPersonId: string;
  user: UserSimpleResponse;
  person: PersonSimpleResponse;
  relationshipType: RelationshipType;
  active: boolean;
}

export interface UserPersonListParams {
  personId?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}
