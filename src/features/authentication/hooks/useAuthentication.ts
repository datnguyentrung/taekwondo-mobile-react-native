import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import type { SwitchContextRequest } from '../api/auth.dto';
import { authApi } from '../api/authApi';
import { authSessionService } from '../services/authSessionService';
import { routeAfterAuthResponse } from '../utils/authRouting';

export function useGetAccount() {
  return useQuery({
    queryKey: ['authentication', 'account'],
    queryFn: authApi.getAccount,
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: authSessionService.login,
    onSuccess: (response) => {
      router.replace(routeAfterAuthResponse(response));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: authSessionService.logout,
    onSettled: () => router.replace('/(auth)/login'),
  });
}

export function useLogoutAll() {
  const router = useRouter();
  return useMutation({
    mutationFn: authSessionService.logoutAll,
    onSettled: () => router.replace('/(auth)/login'),
  });
}

export function useSwitchContext() {
  const router = useRouter();
  return useMutation({
    mutationFn: (request: SwitchContextRequest) =>
      authSessionService.switchContext(request),
    onSuccess: (response) => {
      router.replace(routeAfterAuthResponse(response));
    },
  });
}
