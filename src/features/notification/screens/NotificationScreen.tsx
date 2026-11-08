import { Bell, Check } from "reicon-react-native";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { HomeHeaderButton } from "@/routes/navigation/components/HomeHeaderButton";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { MOBILE_LIST_END_REACHED_THRESHOLD } from "@/infrastructure/query/infiniteList.config";
import { useShortListPrefetch } from "@/infrastructure/query/useShortListPrefetch";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { InfiniteListFooter } from "@/shared/ui/InfiniteListFooter";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import type { NotificationRecipientMine } from "../api/notification.dto";
import { NotificationCard } from "../components/NotificationCard";
import {
  NotificationFilterBar,
  type NotificationReadTab,
} from "../components/NotificationFilterBar";
import {
  NotificationSkeletonList,
  NotificationStateView,
} from "../components/NotificationStateView";
import { NotificationSummaryCard } from "../components/NotificationSummaryCard";
import type { NotificationType } from "../constants/notification.constants";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationFilters,
} from "../queries/notificationQueries";
import { useNotificationStore } from "../store/notification.store";

export default function NotificationScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<NotificationReadTab>("all");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<
    NotificationType | undefined
  >();
  const debouncedSearch = useDebounce(search.trim(), 400);

  const filters = useMemo<NotificationFilters>(
    () => ({
      read: tab === "unread" ? false : undefined,
      search: debouncedSearch || undefined,
      type: selectedType,
    }),
    [debouncedSearch, selectedType, tab],
  );

  const notificationsQuery = useNotifications(filters);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkAllReadPending } =
    useMarkAllNotificationsRead();
  const notifications = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.content) ?? [],
    [notificationsQuery.data],
  );
  const totalCount = notificationsQuery.data?.pages[0]?.totalElements ?? 0;
  const isInitialLoading = notificationsQuery.isInitialLoading;
  const shortListPrefetch = useShortListPrefetch({
    identity: JSON.stringify(filters),
    hasNextPage: Boolean(notificationsQuery.hasNextPage),
    isFetchingNextPage: notificationsQuery.isFetchingNextPage,
    loadNextPage: notificationsQuery.loadNextPage,
  });

  const openNotification = useCallback(
    (notification: NotificationRecipientMine) => {
      if (!notification.read) {
        markRead(notification.notificationRecipientId);
      }
      router.push(
        `/notifications/${notification.notificationRecipientId}` as unknown as Href,
      );
    },
    [markRead, router],
  );

  const handleMarkAllRead = useCallback(() => {
    if (isMarkAllReadPending) return;
    markAllRead();
  }, [isMarkAllReadPending, markAllRead]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationRecipientMine }) => (
      <NotificationCard notification={item} onPress={openNotification} />
    ),
    [openNotification],
  );

  return (
    <StackScreenLayout
      title="Thông báo"
      scrollEnabled={false}
      rightActions={
        <>
          {unreadCount > 0 ? (
            <HeaderActionButton
              icon={<Check />}
              label="Đánh dấu tất cả đã đọc"
              color={Colors.light.text}
              testID="notification-read-all-button"
              onPress={handleMarkAllRead}
            />
          ) : null}
          <HomeHeaderButton color={Colors.light.text} />
        </>
      }
      contentContainerStyle={styles.screenContent}
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notificationRecipientId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ListSeparator}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isRefreshing}
            onRefresh={() => void notificationsQuery.refreshFirstPage()}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        onLayout={shortListPrefetch.onLayout}
        onContentSizeChange={shortListPrefetch.onContentSizeChange}
        onEndReached={() => void notificationsQuery.loadNextPage()}
        onEndReachedThreshold={MOBILE_LIST_END_REACHED_THRESHOLD}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <NotificationSummaryCard
              totalCount={totalCount}
              unreadCount={unreadCount}
            />
            <NotificationFilterBar
              tab={tab}
              search={search}
              selectedType={selectedType}
              onTabChange={setTab}
              onSearchChange={setSearch}
              onTypeChange={setSelectedType}
            />
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
            <NotificationSkeletonList />
          ) : notificationsQuery.isError ? (
            <NotificationStateView
              icon={<Bell />}
              title="Không tải được thông báo"
              description="Vui lòng thử lại sau ít phút."
              actionLabel="Thử lại"
              onActionPress={() => void notificationsQuery.refreshFirstPage()}
            />
          ) : (
            <NotificationStateView
              icon={<Bell />}
              title="Chưa có thông báo phù hợp"
              description="Thử đổi bộ lọc hoặc quay lại sau khi hệ thống gửi thông báo mới."
            />
          )
        }
        ListFooterComponent={
          <InfiniteListFooter
            hasItems={notifications.length > 0}
            isLoading={notificationsQuery.isFetchingNextPage}
            isError={notificationsQuery.isLoadMoreError}
            onRetry={() => void notificationsQuery.retryNextPage()}
          />
        }
      />
    </StackScreenLayout>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerContent: {
    gap: 14,
    marginBottom: 14,
  },
  separator: {
    height: 12,
  },
});
