import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { useAuthenticationRuntime } from '@/features/authentication';
import { queryClient } from '@/infrastructure/query/queryClient';

function AuthRuntime({ children }: PropsWithChildren) {
  useAuthenticationRuntime();
  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRuntime>{children}</AuthRuntime>
    </QueryClientProvider>
  );
}
