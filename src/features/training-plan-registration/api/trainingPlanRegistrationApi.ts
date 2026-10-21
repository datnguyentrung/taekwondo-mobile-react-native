import { javaApi } from '@/infrastructure/http/httpClient';
import type { TrainingPlanCatalogItem, TrainingPlanRegistrationOptions } from './trainingPlanRegistration.dto';

export const trainingPlanRegistrationApi = {
  async catalog(studentPersonId?: string): Promise<TrainingPlanCatalogItem[]> {
    const response = await javaApi.get<TrainingPlanCatalogItem[]>('/training-plans/registration-catalog', {
      params: studentPersonId ? { studentPersonId } : undefined,
    });
    return response.data;
  },
  async options(planId: string, homeCourseId: string, startDate: string): Promise<TrainingPlanRegistrationOptions> {
    const response = await javaApi.get<TrainingPlanRegistrationOptions>(
      `/training-plans/${planId}/registration-options`,
      { params: { homeCourseId, startDate } },
    );
    return response.data;
  },
};
