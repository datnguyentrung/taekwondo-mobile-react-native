import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

import { MOBILE_LIST_MAX_AUTO_PREFETCH_PAGES } from "./infiniteList.config";

/** Loads a bounded number of pages when a list cannot yet be scrolled. */
export function useShortListPrefetch({
  identity,
  hasNextPage,
  isFetchingNextPage,
  loadNextPage,
}: {
  identity: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadNextPage: () => Promise<void>;
}) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const autoPrefetched = useRef(0);

  useEffect(() => {
    autoPrefetched.current = 0;
  }, [identity]);

  useEffect(() => {
    if (
      !viewportHeight ||
      contentHeight > viewportHeight ||
      !hasNextPage ||
      isFetchingNextPage ||
      autoPrefetched.current >= MOBILE_LIST_MAX_AUTO_PREFETCH_PAGES
    ) {
      return;
    }
    autoPrefetched.current += 1;
    void loadNextPage();
  }, [contentHeight, hasNextPage, isFetchingNextPage, loadNextPage, viewportHeight]);

  return {
    onLayout: useCallback(
      (event: LayoutChangeEvent) => setViewportHeight(event.nativeEvent.layout.height),
      [],
    ),
    onContentSizeChange: useCallback(
      (_width: number, height: number) => setContentHeight(height),
      [],
    ),
  };
}
