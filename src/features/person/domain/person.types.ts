import type { Belt } from '../constants/person.constants';

export interface PersonResponse {
  personId: string;
  fullName: string;
  gender: boolean | null;
  birthDate: string;
  nationalCode: string | null;
  email: string | null;
  belt: Belt;
  faceImagePath: string | null;
  avatarUrl: string | null;
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
