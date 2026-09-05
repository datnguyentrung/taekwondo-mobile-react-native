import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';

import { useAuthenticationRuntime } from '@/features/authentication';
import { initializeDatabase } from '@/infrastructure/database/database';
import { queryClient } from '@/infrastructure/query/queryClient';

function DatabaseRuntime({ children }: PropsWithChildren) {
  useEffect(() => {
    void initializeDatabase().catch((error: unknown) => {
      console.error('[Database] initialize failed', error);
    });
  }, []);

  return children;
}

function AuthRuntime({ children }: PropsWithChildren) {
  useAuthenticationRuntime();
  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseRuntime>
        <AuthRuntime>{children}</AuthRuntime>
      </DatabaseRuntime>
    </QueryClientProvider>
  );
}
