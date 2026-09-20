import { useQuery } from "@tanstack/react-query";

import { personApi } from "../api/personApi";

export const PERSON_ADMIN_PAGE_SIZE = 200;

export const personKeys = {
  all: ["people"] as const,
  lists: () => [...personKeys.all, "list"] as const,
  list: () => [...personKeys.lists(), { size: PERSON_ADMIN_PAGE_SIZE }] as const,
  details: () => [...personKeys.all, "details"] as const,
  detail: (id: string) => [...personKeys.details(), id] as const,
};

export function usePeople() {
  return useQuery({
    queryKey: personKeys.list(),
    queryFn: () =>
      personApi.list({ size: PERSON_ADMIN_PAGE_SIZE, sort: "fullName,asc" }),
    staleTime: 30_000,
  });
}
