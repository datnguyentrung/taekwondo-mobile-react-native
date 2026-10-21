import { useMutation, useQuery } from '@tanstack/react-query';
import { walletApi } from '@/features/wallet/api/walletApi';
import type { WalletTrainingPlanPurchaseRequest } from '@/features/wallet/api/wallet-command.dto';
import { trainingPlanRegistrationApi } from '../api/trainingPlanRegistrationApi';

export const trainingPlanRegistrationKeys = {
  all: ['training-plan-registration'] as const,
  catalog: (studentPersonId?: string) => [...trainingPlanRegistrationKeys.all, 'catalog', studentPersonId ?? ''] as const,
  options: (planId?: string, homeCourseId?: string, startDate?: string) =>
    [...trainingPlanRegistrationKeys.all, 'options', planId ?? '', homeCourseId ?? '', startDate ?? ''] as const,
};

export function useTrainingPlanCatalog(studentPersonId?: string) {
  return useQuery({
    queryKey: trainingPlanRegistrationKeys.catalog(studentPersonId),
    queryFn: () => trainingPlanRegistrationApi.catalog(studentPersonId),
    enabled: Boolean(studentPersonId),
    staleTime: 30_000,
  });
}

export function useTrainingPlanOptions(planId?: string, homeCourseId?: string, startDate?: string) {
  return useQuery({
    queryKey: trainingPlanRegistrationKeys.options(planId, homeCourseId, startDate),
    queryFn: () => trainingPlanRegistrationApi.options(planId!, homeCourseId!, startDate!),
    enabled: Boolean(planId && homeCourseId && startDate),
  });
}

export function usePurchaseTrainingPlan() {
  return useMutation({ mutationFn: (request: WalletTrainingPlanPurchaseRequest) => walletApi.purchaseTrainingPlan(request) });
}
