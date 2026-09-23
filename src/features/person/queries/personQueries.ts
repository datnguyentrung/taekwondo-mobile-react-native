import { useQuery } from "@tanstack/react-query";

import type { PersonSearchParams } from "../api/person.dto";
import { personApi } from "../api/personApi";

export const PERSON_ADMIN_PAGE_SIZE = 200;

export const personKeys = {
  all: ["people"] as const,
  lists: () => [...personKeys.all, "list"] as const,
  list: (params?: PersonSearchParams) =>
    [...personKeys.lists(), params ?? { size: PERSON_ADMIN_PAGE_SIZE }] as const,
  details: () => [...personKeys.all, "details"] as const,
  detail: (id: string) => [...personKeys.details(), id] as const,
};

export function usePeople() {
  return useQuery({
    queryKey: personKeys.list({ size: PERSON_ADMIN_PAGE_SIZE, sort: "fullName,asc" }),
    queryFn: () =>
      personApi.list({ size: PERSON_ADMIN_PAGE_SIZE, sort: "fullName,asc" }),
    staleTime: 30_000,
  });
}

export function usePeopleByPosition(positionId?: string) {
  return useQuery({
    queryKey: personKeys.list({
      positionId,
      size: PERSON_ADMIN_PAGE_SIZE,
      sort: "fullName,asc",
    }),
    queryFn: () =>
      personApi.list({
        positionId,
        size: PERSON_ADMIN_PAGE_SIZE,
        sort: "fullName,asc",
      }),
    enabled: Boolean(positionId),
    staleTime: 30_000,
  });
}
