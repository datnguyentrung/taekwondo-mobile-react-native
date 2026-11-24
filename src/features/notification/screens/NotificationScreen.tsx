import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Bell, Check, Plus, Tuning } from "reicon-react-native";

import { MOBILE_LIST_END_REACHED_THRESHOLD } from "@/infrastructure/query/infiniteList.config";
import { useShortListPrefetch } from "@/infrastructure/query/useShortListPrefetch";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import BottomTabScreenLayout, {
  BOTTOM_TAB_SPACE,
} from "@/routes/navigation/layouts/BottomTabScreenLayout";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { AdminSearchField } from "@/shared/ui/admin/AdministrationPrimitives";
import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { InfiniteListFooter } from "@/shared/ui/InfiniteListFooter";
import {
  FilterSheetActions,
  MultiSelectFilterContent,
  type MultiSelectFilterGroup,
} from "@/shared/ui/MultiSelectFilterContent";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { useToast } from "@/shared/ui/Toast";
import { Colors } from "@/theme";

import { ChatbotHeaderButton } from "@/routes/navigation/components/ChatbotHeaderButton";
import type { NotificationRecipientMine } from "../api/notification.dto";
import { NotificationCard } from "../components/NotificationCard";
import {
  NotificationSkeletonList,
  NotificationStateView,
} from "../components/NotificationStateView";
import { NotificationSummaryCard } from "../components/NotificationSummaryCard";
import {
  NotificationTypeLabel,
  type NotificationType,
} from "../constants/notification.constants";
import {
  notificationTypes,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationFilters,
} from "../queries/notificationQueries";
import { useNotificationStore } from "../store/notification.store";

type NotificationReadTab = "all" | "unread";

const READ_TABS: readonly { value: NotificationReadTab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
];

export default function NotificationScreen() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<NotificationReadTab>("all");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<
    NotificationType | undefined
  >();
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftType, setDraftType] = useState<NotificationType | undefined>();
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

  const openFilter = useCallback(() => {
    setDraftType(selectedType);
    setFilterVisible(true);
  }, [selectedType]);

  const handleResetFilter = useCallback(() => {
    setDraftType(undefined);
    setSelectedType(undefined);
    setFilterVisible(false);
  }, []);

  const handleApplyFilter = useCallback(() => {
    setSelectedType(draftType);
    setFilterVisible(false);
  }, [draftType]);

  const filterGroups = useMemo<readonly MultiSelectFilterGroup[]>(
    () => [
      {
        key: "type",
        title: "Loại thông báo",
        options: notificationTypes.map((type) => ({
          value: type,
          label: NotificationTypeLabel[type],
        })),
        selectedValues: draftType ? [draftType] : [],
        onToggle: (val) =>
          setDraftType((prev) =>
            prev === val ? undefined : (val as NotificationType),
          ),
        onSelectAll: () => setDraftType(undefined),
        onClear: () => setDraftType(undefined),
      },
    ],
    [draftType],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationRecipientMine }) => (
      <NotificationCard notification={item} onPress={openNotification} />
    ),
    [openNotification],
  );

  return (
    <BottomTabScreenLayout
      title="Thông báo"
      activeTab="notifications"
      scrollEnabled={false}
      rightActions={
        <>
          <HeaderActionButton
            icon={<Tuning />}
            label="Lọc"
            badge={selectedType ? 1 : undefined}
            color={Colors.light.surface}
            testID="notification-filter-button"
            onPress={openFilter}
          />
          {unreadCount > 0 ? (
            <HeaderActionButton
              icon={<Check />}
              label="Đánh dấu tất cả đã đọc"
              color={Colors.light.surface}
              testID="notification-read-all-button"
              onPress={handleMarkAllRead}
            />
          ) : null}
          <ChatbotHeaderButton />
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
            <SegmentedControl
              value={tab}
              options={READ_TABS}
              onChange={setTab}
            />
            <View style={styles.searchRow}>
              <View style={styles.searchFieldWrap}>
                <AdminSearchField
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm theo tiêu đề, nội dung..."
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tạo thông báo"
                hitSlop={8}
                onPress={() =>
                  toast.show({
                    message: "Tính năng tạo thông báo đang được phát triển.",
                    variant: "info",
                  })
                }
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.createButtonPressed,
                ]}
              >
                <AppIcon
                  icon={<Plus />}
                  size={22}
                  color={Colors.light.surface}
                />
              </Pressable>
            </View>
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

      <BottomSheetWindow
        visible={filterVisible}
        title="Lọc thông báo"
        onClose={() => setFilterVisible(false)}
        footer={
          <FilterSheetActions
            canApply={draftType !== selectedType}
            onReset={handleResetFilter}
            onApply={handleApplyFilter}
          />
        }
      >
        <MultiSelectFilterContent groups={filterGroups} />
      </BottomSheetWindow>
    </BottomTabScreenLayout>
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
    paddingBottom: BOTTOM_TAB_SPACE + 20,
  },
  headerContent: {
    gap: 14,
    marginBottom: 14,
  },
  separator: {
    height: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchFieldWrap: {
    flex: 1,
    minWidth: 0,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonPressed: {
    opacity: 0.78,
  },
});
