import type { Belt, PersonStatus } from '../constants/person.constants';

export interface PersonResponse {
  personId: string;
  fullName: string;
  gender: boolean | null;
  birthDate: string;
  nationalCode: string | null;
  email: string | null;
  belt: Belt;
  currentBelt?: Belt;
  personCode?: string | null;
  status?: PersonStatus;
  startDate?: string | null;
  faceImagePath: string | null;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
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
