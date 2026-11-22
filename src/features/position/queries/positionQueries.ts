import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { personKeys, usePeopleByPosition } from "@/features/person/queries/personQueries";
import { positionApi } from "../api/positionApi";
import type { AssignPeopleToPositionRequest, PositionCreateRequest, PositionResponse, PositionUpdateRequest } from "../api/position.dto";

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

type PositionCallbacks<TVariables> = {
  onSuccess?: (data: PositionResponse, variables: TVariables) => void | Promise<void>;
  onError?: () => void;
};

export function useCreatePosition(
  callbacks: PositionCallbacks<PositionCreateRequest> = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PositionCreateRequest) => positionApi.create(request),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      await callbacks.onSuccess?.(data, variables);
    },
    onError: callbacks.onError,
  });
}

export function useUpdatePosition(
  callbacks: PositionCallbacks<{ id: string; request: PositionUpdateRequest }> = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: PositionUpdateRequest }) =>
      positionApi.update(id, request),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: positionKeys.all });
      await callbacks.onSuccess?.(data, variables);
    },
    onError: callbacks.onError,
  });
}

export function useAssignPeopleToPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ positionId, request }: { positionId: string; request: AssignPeopleToPositionRequest }) =>
      positionApi.assignPeople(positionId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: positionKeys.all }),
        queryClient.invalidateQueries({ queryKey: personKeys.lists() }),
      ]);
    },
  });
}

export function useDeletePosition(callbacks: {
  onSuccess?: () => void | Promise<void>;
  onError?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      variables: string | { positionId: string; signal?: AbortSignal },
    ) =>
      positionApi.remove(
        typeof variables === "string" ? variables : variables.positionId,
        typeof variables === "string" ? undefined : variables.signal,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      await callbacks.onSuccess?.();
    },
    onError: callbacks.onError,
  });
}
