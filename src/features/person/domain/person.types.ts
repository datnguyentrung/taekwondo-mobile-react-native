import type { PositionSimpleResponse } from '@/features/position/api/position.dto';
import type { Belt, PersonStatus } from '../constants/person.constants';

export interface PersonResponse {
  personId: string;
  fullName: string;
  gender: boolean | null;
  birthDate: string;
  email: string | null;
  nationalCode: string | null;
  personCode: string | null;
  currentBelt: Belt;
  status: PersonStatus;
  startDate: string;
  position: PositionSimpleResponse | null;
  faceImagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonSimpleResponse {
  personId: string;
  fullName: string;
  gender: boolean | null;
  birthDate: string;
  personCode: string | null;
  currentBelt: Belt;
  status: PersonStatus;
  faceImagePath: string | null;
}

export interface PersonSearchItem {
  personId: string;
  fullName: string;
  birthDate: string;
  belt: string;
  personType: string;
  code: string;
  status: string;
}
