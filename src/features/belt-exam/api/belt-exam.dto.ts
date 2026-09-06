import type { Belt } from '@/features/person/constants/person.constants';
import type { BeltExamResult, BeltExamType } from '../constants/belt-exam.constants';

export interface BeltExamCreateRequest {
  personId: string;
  fromBelt: Belt;
  targetBelt: Belt;
  year: number;
  quarter: number;
  examDate?: string | null;
  result?: BeltExamResult | null;
  note?: string | null;
  createdByUserId: string;
  type: BeltExamType;
}

export interface BeltExamUpdateRequest extends BeltExamCreateRequest {
  result: BeltExamResult;
}

export interface BeltExamResponse {
  beltExamId: string;
  personId: string;
  fromBelt: Belt;
  targetBelt: Belt;
  year: number;
  quarter: number;
  examDate: string | null;
  result: BeltExamResult | null;
  note: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  type: BeltExamType;
}

export interface BeltExamListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
