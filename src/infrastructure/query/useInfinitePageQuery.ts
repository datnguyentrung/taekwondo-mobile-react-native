import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PageResponse } from "@/infrastructure/http/pagination.types";

import { MOBILE_LIST_PAGE_SIZE } from "./infiniteList.config";

export type InfinitePageFetcher<TItem> = (input: {
  page: number;
  size: number;
  signal: AbortSignal;
}) => Promise<PageResponse<TItem>>;

export type InfinitePageQueryOptions<TItem> = {
  queryKey: QueryKey;
  fetchPage: InfinitePageFetcher<TItem>;
  getItemId: (item: TItem) => string | number;
  enabled?: boolean;
  pageSize?: number;
  staleTime?: number;
};

/**
 * Pagination transport/state seam. Screens own their FlatList and rendering;
 * this hook owns page metadata, deduplication and request sequencing.
 */
export function useInfinitePageQuery<TItem>({
  queryKey,
  fetchPage,
  getItemId,
  enabled = true,
  pageSize = MOBILE_LIST_PAGE_SIZE,
  staleTime,
}: InfinitePageQueryOptions<TItem>) {
  const queryClient = useQueryClient();
  const nextPagePromise = useRef<Promise<unknown> | null>(null);
  const refreshController = useRef<AbortController | null>(null);
  const [isRefreshingFirstPage, setIsRefreshingFirstPage] = useState(false);

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      fetchPage({ page: Number(pageParam), size: pageSize, signal }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.pageNumber + 1,
    enabled,
    staleTime,
  });

  useEffect(
    () => () => {
      refreshController.current?.abort();
    },
    [queryKey],
  );

  const items = useMemo(() => {
    const seen = new Set<string | number>();
    return (query.data?.pages.flatMap((page) => page.content) ?? []).filter(
      (item) => {
        const id = getItemId(item);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      },
    );
  }, [getItemId, query.data]);

  const loadNextPage = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage || nextPagePromise.current) {
      return;
    }

    const request = query.fetchNextPage();
    nextPagePromise.current = request;
    try {
      await request;
    } finally {
      nextPagePromise.current = null;
    }
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  const refreshFirstPage = useCallback(async () => {
    refreshController.current?.abort();
    const controller = new AbortController();
    refreshController.current = controller;
    setIsRefreshingFirstPage(true);

    try {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const firstPage = await fetchPage({
        page: 0,
        size: pageSize,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      queryClient.setQueryData<InfiniteData<PageResponse<TItem>, number>>(
        queryKey,
        { pages: [firstPage], pageParams: [0] },
      );
    } finally {
      if (refreshController.current === controller) {
        refreshController.current = null;
        setIsRefreshingFirstPage(false);
      }
    }
  }, [fetchPage, pageSize, queryClient, queryKey]);

  return {
    ...query,
    items,
    totalElements: query.data?.pages[0]?.totalElements ?? 0,
    isInitialLoading: query.isPending && !query.data,
    isRefreshing: isRefreshingFirstPage,
    isLoadMoreError: query.isFetchNextPageError,
    loadNextPage,
    retryNextPage: loadNextPage,
    refreshFirstPage,
  };
}
