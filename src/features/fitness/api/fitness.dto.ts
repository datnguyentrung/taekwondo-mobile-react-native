import type { SkillLevel } from '../constants/fitness.constans';

export interface FitnessThreshold {
  fitnessLevel: number;
  skillLevel: SkillLevel;
  duration: number;
  amount: number;
}
