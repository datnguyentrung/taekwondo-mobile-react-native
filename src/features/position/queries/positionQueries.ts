import { useQuery } from "@tanstack/react-query";

import { usePeopleByPosition } from "@/features/person/queries/personQueries";
import { positionApi } from "../api/positionApi";

export const POSITION_ADMIN_PAGE_SIZE = 200;

export const positionKeys = {
  all: ["positions"] as const,
  lists: () => [...positionKeys.all, "list"] as const,
  list: () =>
    [...positionKeys.lists(), { size: POSITION_ADMIN_PAGE_SIZE }] as const,
  detail: (id: string) => [...positionKeys.all, "detail", id] as const,
};

export function usePositions() {
  return useQuery({
    queryKey: positionKeys.list(),
    queryFn: () =>
      positionApi.list({ size: POSITION_ADMIN_PAGE_SIZE, sort: "name,asc" }),
    staleTime: 30_000,
  });
}

export function usePosition(id?: string) {
  return useQuery({
    queryKey: positionKeys.detail(id ?? ""),
    queryFn: () => positionApi.get(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function usePositionPeople(positionId?: string) {
  const query = usePeopleByPosition(positionId);

  return {
    people: query.data?.content ?? [],
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
