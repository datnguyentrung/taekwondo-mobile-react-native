import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import type {
  NotificationRecipientListResponse,
  NotificationRecipientResponse,
} from "../api/notification.dto";
import { notificationRecipientApi } from "../api/notificationRecipientApi";
import type {
  NotificationSortBy,
  NotificationSortDir,
  NotificationType,
} from "../constants/notification.constants";

export const DEFAULT_NOTIFICATION_PAGE_SIZE = 30;

export interface NotificationFilters {
  read?: boolean;
  search?: string;
  type?: NotificationType;
  size?: number;
  sortBy?: NotificationSortBy;
  sortDir?: NotificationSortDir;
}

export const notificationTypes = [
  "SYSTEM",
  "ATTENDANCE",
  "TUITION",
  "CLASS_SCHEDULE",
  "COACH_TIMESHEET",
  "ANNOUNCEMENT",
  "CLASS_SESSION_REPORT",
] as const satisfies readonly NotificationType[];

const notificationTypeSet = new Set<string>(notificationTypes);
const pendingMarkReadIds = new Set<string>();

export type NotificationListFilters = Required<
  Pick<NotificationFilters, "size" | "sortBy" | "sortDir">
> &
  Pick<NotificationFilters, "read" | "search" | "type">;

export type NotificationInfiniteData = InfiniteData<
  NotificationRecipientListResponse,
  number
>;

type MarkReadMutationContext = {
  detailSnapshot?: NotificationRecipientResponse;
  listSnapshots: Array<[QueryKey, NotificationInfiniteData | undefined]>;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.lists(), normalizeNotificationFilters(filters)] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
};

export function isNotificationType(
  value?: string | null,
): value is NotificationType {
  return Boolean(value && notificationTypeSet.has(value));
}

export function normalizeNotificationFilters(
  filters: NotificationFilters = {},
): NotificationListFilters {
  const normalizedSearch = filters.search?.trim();
  return {
    read: filters.read,
    search: normalizedSearch || undefined,
    type: isNotificationType(filters.type) ? filters.type : undefined,
    size: filters.size ?? DEFAULT_NOTIFICATION_PAGE_SIZE,
    sortBy: filters.sortBy ?? "createdAt",
    sortDir: filters.sortDir ?? "desc",
  };
}

export function notificationListQueryOptions(filters: NotificationFilters = {}) {
  const normalizedFilters = normalizeNotificationFilters(filters);

  return infiniteQueryOptions({
    queryKey: notificationKeys.list(normalizedFilters),
    queryFn: ({ pageParam }) =>
      notificationRecipientApi.getMine({
        ...normalizedFilters,
        page: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.notifications.last
        ? undefined
        : lastPage.notifications.pageNumber + 1,
    staleTime: 45_000,
  });
}

export function prefetchNotifications(
  queryClient: QueryClient,
  filters: NotificationFilters = {},
) {
  void queryClient.prefetchInfiniteQuery(notificationListQueryOptions(filters));
}

export function isNotificationMarkReadPending(id: string) {
  return pendingMarkReadIds.has(id);
}

function updateDetailAsRead(
  old: NotificationRecipientResponse | undefined,
): NotificationRecipientResponse | undefined {
  if (!old) return old;
  return { ...old, read: true };
}

function updateInfiniteDataAfterMarkRead(
  old: NotificationInfiniteData | undefined,
  id: string,
  wasUnread: boolean,
): NotificationInfiniteData | undefined {
  if (!old) return old;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      unreadCount: wasUnread
        ? Math.max(0, page.unreadCount - 1)
        : page.unreadCount,
      notifications: {
        ...page.notifications,
        content: page.notifications.content.map((item) =>
          item.notificationRecipientId === id ? { ...item, read: true } : item,
        ),
      },
    })),
  };
}

export function useNotifications(filters: NotificationFilters) {
  return useInfiniteQuery(notificationListQueryOptions(filters));
}

export function useNotificationDetail(notificationRecipientId?: string) {
  return useQuery({
    queryKey: notificationKeys.detail(notificationRecipientId ?? ""),
    queryFn: () =>
      notificationRecipientApi.getDetail(notificationRecipientId as string),
    enabled: Boolean(notificationRecipientId),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MarkReadMutationContext>({
    mutationFn: notificationRecipientApi.markRead,
    retry: 1,
    onMutate: async (id) => {
      pendingMarkReadIds.add(id);
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const detailKey = notificationKeys.detail(id);
      const detailSnapshot =
        queryClient.getQueryData<NotificationRecipientResponse>(detailKey);
      const listSnapshots = queryClient.getQueriesData<NotificationInfiniteData>(
        { queryKey: notificationKeys.lists() },
      );
      const wasUnread = detailSnapshot?.read === false;

      queryClient.setQueryData<NotificationRecipientResponse>(
        detailKey,
        updateDetailAsRead,
      );
      queryClient.setQueriesData<NotificationInfiniteData>(
        { queryKey: notificationKeys.lists() },
        (old) => updateInfiniteDataAfterMarkRead(old, id, wasUnread),
      );

      return {
        detailSnapshot,
        listSnapshots,
      };
    },
    onError: (_error, id, context) => {
      queryClient.setQueryData(
        notificationKeys.detail(id),
        context?.detailSnapshot,
      );

      for (const [queryKey, data] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: (_data, _error, id) => {
      pendingMarkReadIds.delete(id);
      void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.detail(id),
      });
    },
  });
}
