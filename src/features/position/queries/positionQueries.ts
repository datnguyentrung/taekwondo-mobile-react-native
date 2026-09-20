import { useQueries, useQuery } from "@tanstack/react-query";

import { personApi, type PersonResponse } from "@/features/person";
import { personKeys, usePeople } from "@/features/person/queries/personQueries";
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
  const people = usePeople();
  const details = useQueries({
    queries: (people.data?.content ?? []).map((person) => ({
      queryKey: personKeys.detail(person.personId),
      queryFn: () => personApi.get(person.personId) as Promise<PersonResponse>,
      enabled: Boolean(positionId),
      staleTime: 60_000,
    })),
  });

  return {
    people: details
      .map((query) => query.data)
      .filter(
        (person): person is PersonResponse =>
          Boolean(person && person.position?.positionId === positionId),
      ),
    isPending: people.isPending || details.some((query) => query.isPending),
    isError: people.isError || details.some((query) => query.isError),
  };
}
