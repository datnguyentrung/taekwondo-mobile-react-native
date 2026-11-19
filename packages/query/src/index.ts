import { QueryClient } from "@tanstack/react-query";

/** Each app creates its own in-memory cache using the same policy. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
