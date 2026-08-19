import { javaApi } from '@/infrastructure/http/httpClient';

import type { SkillLevel } from '../constants/fitness.constans';
import type { FitnessThreshold } from './fitness.dto';

export const fitnessApi = {
  async getBySkillLevel(skillLevel: SkillLevel): Promise<FitnessThreshold[]> {
    const response = await javaApi.get<FitnessThreshold[]>('/fitness', { params: { skillLevel } });
    return response.data;
  },
};
