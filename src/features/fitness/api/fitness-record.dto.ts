import type { CoachSummary } from '@/features/coach/api/coach-summary.dto';
import type { StudentSummary } from '@/features/student/api/student-summary.dto';
import type { SkillLevel } from '../constants/fitness.constans';

export interface FitnessMetrics {
  createdAt: string;
  assessmentDate: string;
  duration: number;
  amount: number;
  skillLevel: SkillLevel;
  durationLevel: number;
  amountLevel: number;
  fitnessLevel: number;
  isQualified: boolean;
}

export interface FitnessListMetrics {
  assessmentDate: string;
  duration: number;
  amount: number;
  skillLevel: SkillLevel;
  durationLevel: number;
  amountLevel: number;
  fitnessLevel: number;
  isQualified: boolean;
}
export interface FitnessRecordResponse {
  id: number;
  fitnessRecordId?: number;
  studentId?: string;
  fitnessId?: number;
  recordedByCoachId?: string;
  recordDate?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
  studentSummary: StudentSummary;
  metrics: FitnessMetrics;
  recordedByCoach: CoachSummary;
}

export interface FitnessRecordListResponse {
  id: number;
  studentSummary: StudentSummary;
  metrics: FitnessListMetrics;
}

export interface FitnessRecordCreateRequest {
  studentId?: string;
  fitnessId?: number;
  recordedByCoachId?: string;
  recordDate?: string;
  assessmentDate: string;
  studentCode: string;
  duration: number;
  amount: number;
  skillLevel: SkillLevel;
  staffCode: string;
}

export interface FitnessRecordUpdateRequest {
  studentId?: string;
  fitnessId?: number;
  recordedByCoachId?: string;
  recordDate?: string;
  assessmentDate: string;
  duration: number;
  amount: number;
  skillLevel: SkillLevel;
}

export interface FitnessRecordListParams {
  search?: string;
  skillLevel?: SkillLevel;
  page?: number;
  size?: number;
  sort?: string | string[];
}
