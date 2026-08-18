import type { Belt } from '@/features/person/constants/person.constants';

export interface LeaderboardResponse<T> {
  year: number;
  quarter: number;
  totalStudents: number;
  rankings: RankItem<T>[];
}

export interface RankItem<T> {
  rank: number;
  rankBefore: number | null;
  personId: string;
  avatarUrl: string | null;
  studentCode: string;
  fullName: string;
  belt: Belt;
  data: T;
}

export interface LeaderboardMember {
  personId: string;
  studentCode: string;
  fullName: string;
  belt: Belt;
}
