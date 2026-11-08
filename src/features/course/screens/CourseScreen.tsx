import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";

import type { CourseResponse } from "@/features/course/api/course.dto";
import { CourseCatalogCard } from "@/features/student-commerce/components/StudentCommercePrimitives";
import { CourseCatalogSearchField } from "@/features/course/components/CourseCatalogSearchField";
import { CourseCreateSheet } from "@/features/course/components/CourseCreateSheet";
import { Permission, useCan } from "@/features/authorization";
import { COURSE_CATALOG_TABS } from "@/features/course/utils/courseCatalogViewModel";
import { SegmentedTabs } from "@/shared/ui/commerce/CommercePrimitives";
import type { CourseCatalogTab } from "@/features/course/domain/course.types";
import { asHref } from "@/features/student-commerce/utils/studentCommerceUtils";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { MOBILE_LIST_END_REACHED_THRESHOLD } from "@/infrastructure/query/infiniteList.config";
import { useShortListPrefetch } from "@/infrastructure/query/useShortListPrefetch";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { InfiniteListFooter } from "@/shared/ui/InfiniteListFooter";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import { useCourseCatalog } from "@/features/course/queries/courseCatalogQueries";

export function CourseCatalogScreen({
  initialTab = "active",
}: {
  initialTab?: CourseCatalogTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<CourseCatalogTab>(initialTab);
  const [search, setSearch] = useState("");
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  const canCreateCourse = useCan(Permission.COURSE_CREATE);

  const debouncedSearch = useDebounce(search, 400);
  const coursesQuery = useCourseCatalog(tab, debouncedSearch);
  const { courses, registerCreatedCourse } = coursesQuery;

  const shortListPrefetch = useShortListPrefetch({
    identity: `${tab}:${debouncedSearch}`,
    hasNextPage: Boolean(coursesQuery.hasNextPage),
    isFetchingNextPage: coursesQuery.isFetchingNextPage,
    loadNextPage: coursesQuery.loadNextPage,
  });

  const handleCreateSuccess = async (createdCourse: CourseResponse) => {
    await registerCreatedCourse(createdCourse);
    setIsCreateSheetVisible(false);
    router.push(asHref(`/courses/${createdCourse.courseId}`));
  };

  return (
    <>
      <StackScreenLayout
        title="Khóa học"
        scrollEnabled={false}
        refreshEnabled={false}
      >
        <FlatList
          data={courses}
          keyExtractor={(course) => course.courseId}
          renderItem={({ item }) => <CourseCatalogCard course={item} onPress={() => router.push(asHref(`/courses/${item.courseId}`))} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          onLayout={shortListPrefetch.onLayout}
          onContentSizeChange={shortListPrefetch.onContentSizeChange}
          onEndReached={() => void coursesQuery.loadNextPage()}
          onEndReachedThreshold={MOBILE_LIST_END_REACHED_THRESHOLD}
          refreshControl={<RefreshControl refreshing={coursesQuery.isRefreshing} onRefresh={() => void coursesQuery.refreshFirstPage()} tintColor={Colors.light.primary} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<><SegmentedTabs value={tab} tabs={COURSE_CATALOG_TABS} onChange={setTab} /><CourseCatalogSearchField tab={tab} value={search} onChangeText={setSearch} onCreatePress={canCreateCourse ? () => setIsCreateSheetVisible(true) : undefined} /></>}
          ListEmptyComponent={coursesQuery.isInitialLoading ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.light.primary} /></View> : <View style={styles.loadingContainer}><ThemedText type="bodySmall">Không có khóa học phù hợp.</ThemedText></View>}
          ListFooterComponent={<InfiniteListFooter hasItems={courses.length > 0} isLoading={coursesQuery.isFetchingNextPage} isError={coursesQuery.isLoadMoreError} onRetry={() => void coursesQuery.retryNextPage()} />}
        />
      </StackScreenLayout>

      <CourseCreateSheet
        visible={isCreateSheetVisible}
        onClose={() => setIsCreateSheetVisible(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 16, paddingBottom: 32, gap: 20 },
  gap: { height: 12 },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
