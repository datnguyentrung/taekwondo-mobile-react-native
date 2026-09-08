import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { HeaderAction } from '@/routes/navigation/layouts/BottomTabScreenLayout';
import BottomTabScreenLayout from '@/routes/navigation/layouts/BottomTabScreenLayout';
import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import type { Weekday } from '../../constants/class-schedule.constants';
import { ScheduleCard } from './ScheduleCard';
import { FilterActions, ScheduleFilterContent } from './ScheduleFilterContent';
import { ScheduleWeekTabBar } from './ScheduleWeekTabBar';
import { scheduleItems } from './scheduleScreen.fixtures';
import {
  countSelectedScheduleFilters,
  emptyScheduleFilters,
  filterScheduleItems,
} from './scheduleScreen.logic';
import type { ScheduleFilterState } from './scheduleScreen.types';

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<Weekday>('MONDAY');
  const [filters, setFilters] = useState<ScheduleFilterState>(emptyScheduleFilters);
  const [draftFilters, setDraftFilters] =
    useState<ScheduleFilterState>(emptyScheduleFilters);
  const [filterVisible, setFilterVisible] = useState(false);

  const appliedCount = countSelectedScheduleFilters(filters);
  const draftCount = countSelectedScheduleFilters(draftFilters);

  const visibleSchedules = useMemo(
    () => filterScheduleItems(scheduleItems, selectedDay, filters),
    [filters, selectedDay],
  );

  const actions: HeaderAction[] = [
    {
      icon: 'sliders',
      label: 'Lọc lịch học',
      badge: appliedCount || undefined,
      onPress: () => {
        setDraftFilters(filters);
        setFilterVisible(true);
      },
    },
    {
      icon: 'bellOutline',
      label: 'Thông báo',
      badge: 10,
      onPress: () => router.push('/notifications'),
    },
    {
      icon: 'homeOutline',
      label: 'Trang chủ',
      onPress: () => router.push('/'),
    },
  ];

  return (
    <>
      <BottomTabScreenLayout
        title="Lịch học"
        activeTab="schedule"
        rightActions={actions}
        contentContainerStyle={styles.layoutContent}
      >
        <ScheduleWeekTabBar
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        <View style={styles.list}>
          {visibleSchedules.map((item) => (
            <ScheduleCard key={item.scheduleId} schedule={item} />
          ))}
        </View>
      </BottomTabScreenLayout>

      <BottomSheetWindow
        visible={filterVisible}
        title="Lọc"
        accessibilityLabel="Lọc lịch học"
        backdropAccessibilityLabel="Đóng lọc lịch học"
        onClose={() => setFilterVisible(false)}
        footer={
          <FilterActions
            canApply={draftCount > 0}
            onReset={() => setDraftFilters(emptyScheduleFilters)}
            onApply={() => {
              setFilters(draftFilters);
              setFilterVisible(false);
            }}
          />
        }
      >
        <ScheduleFilterContent
          value={draftFilters}
          onChange={setDraftFilters}
        />
      </BottomSheetWindow>
    </>
  );
}

const styles = StyleSheet.create({
  layoutContent: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 25,
    gap: 20,
  },
});
