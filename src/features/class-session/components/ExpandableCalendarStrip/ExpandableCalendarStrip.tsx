import { useMemo } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'reicon-react-native';

import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii, typography } from '@/theme';
import {
  formatToDateString,
  getDaysOfMonth,
  getDaysOfWeek,
  parseDateString,
  type CalendarDayInfo,
} from '../../domain/calendarDate';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export interface ExpandableCalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
  /** Map of dateString -> number of sessions on that date */
  sessionCountMap?: Record<string, number>;
}

export function ExpandableCalendarStrip({
  selectedDate,
  onSelectDate,
  isExpanded,
  onToggleExpanded,
  sessionCountMap = {},
}: ExpandableCalendarStripProps) {
  const selectedDateObj = useMemo(() => parseDateString(selectedDate), [selectedDate]);
  const year = selectedDateObj.getFullYear();
  const month = selectedDateObj.getMonth();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpanded(!isExpanded);
  };

  const handlePrev = () => {
    if (isExpanded) {
      // Month back: keep same day if possible or 1st of previous month
      const prevMonthDate = new Date(year, month - 1, 1);
      onSelectDate(formatToDateString(prevMonthDate));
    } else {
      // 1 week back
      const prevWeekDate = new Date(selectedDateObj);
      prevWeekDate.setDate(selectedDateObj.getDate() - 7);
      onSelectDate(formatToDateString(prevWeekDate));
    }
  };

  const handleNext = () => {
    if (isExpanded) {
      // Month forward
      const nextMonthDate = new Date(year, month + 1, 1);
      onSelectDate(formatToDateString(nextMonthDate));
    } else {
      // 1 week forward
      const nextWeekDate = new Date(selectedDateObj);
      nextWeekDate.setDate(selectedDateObj.getDate() + 7);
      onSelectDate(formatToDateString(nextWeekDate));
    }
  };

  const weekDays = useMemo(() => {
    return getDaysOfWeek(selectedDateObj);
  }, [selectedDateObj]);

  const monthDays = useMemo(() => {
    return getDaysOfMonth(year, month);
  }, [year, month]);

  const visibleDays = isExpanded ? monthDays : weekDays;

  return (
    <View style={styles.container}>
      {/* Month Title Header with < > Navigation */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trở về trước"
          hitSlop={12}
          onPress={handlePrev}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
        >
          <AppIcon
            icon={<ChevronLeft />}
            size={16}
            color={Colors.light.textSecondary}
          />
        </Pressable>

        <ThemedText style={styles.monthTitle}>
          Tháng {month + 1}/{year}
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tiếp theo"
          hitSlop={12}
          onPress={handleNext}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
        >
          <AppIcon
            icon={<ChevronRight />}
            size={16}
            color={Colors.light.textSecondary}
          />
        </Pressable>
      </View>

      {/* Weekday Names Header (T2 -> CN) */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((dayLabel) => (
          <View key={dayLabel} style={styles.weekdayCol}>
            <ThemedText style={styles.weekdayLabel}>{dayLabel}</ThemedText>
          </View>
        ))}
      </View>

      {/* Days Grid (Week or Full Month) */}
      <View style={styles.grid}>
        {visibleDays.map((dayInfo: CalendarDayInfo) => {
          const isSelected = dayInfo.dateString === selectedDate;
          const count = sessionCountMap[dayInfo.dateString] || 0;
          const isFaded = isExpanded && !dayInfo.isCurrentMonth;

          return (
            <Pressable
              key={dayInfo.dateString}
              accessibilityRole="button"
              accessibilityLabel={`${dayInfo.dateString}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(dayInfo.dateString)}
              style={({ pressed }) => [
                styles.dayCell,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.dayCircleSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.dayText,
                    isFaded && styles.dayTextFaded,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {dayInfo.dayOfMonth}
                </ThemedText>
              </View>

              {/* Dots for sessions */}
              <View style={styles.dotsContainer}>
                {count > 0 ? (
                  <>
                    <View
                      style={[
                        styles.dot,
                        isSelected && styles.dotSelected,
                      ]}
                    />
                    {count > 1 ? (
                      <View
                        style={[
                          styles.dot,
                          isSelected && styles.dotSelected,
                        ]}
                      />
                    ) : null}
                  </>
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Drag handle to expand/collapse */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Thu gọn lịch' : 'Mở rộng lịch'}
        hitSlop={10}
        onPress={handleToggle}
        style={styles.handleContainer}
      >
        <View style={styles.handleBar} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: Colors.light.primary,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: typography.title.fontFamily,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  dayTextFaded: {
    color: Colors.light.divider,
  },
  dayTextSelected: {
    color: Colors.light.surface,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0EA5E9', // blue/cyan dot as in Figma design
  },
  dotSelected: {
    backgroundColor: '#0EA5E9',
  },
  emptyDot: {
    height: 4,
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.divider,
  },
  pressed: {
    opacity: 0.7,
  },
});
