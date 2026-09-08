import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors } from '@/theme';
import { scheduleFilterGroups } from './scheduleScreen.fixtures';
import { toggleScheduleFilterValue } from './scheduleScreen.logic';
import type { ScheduleFilterOption, ScheduleFilterState } from './scheduleScreen.types';

export function ScheduleFilterContent({
  value,
  onChange,
}: {
  value: ScheduleFilterState;
  onChange: (next: ScheduleFilterState) => void;
}) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.filterContent}
    >
      {scheduleFilterGroups.map((group) => (
        <FilterGroup
          key={group.key}
          title={group.title}
          options={group.options}
          selectedValues={value[group.key] as (string | number)[]}
          onToggle={(optionValue) => {
            onChange({
              ...value,
              [group.key]: toggleScheduleFilterValue(
                value[group.key] as (string | number)[],
                optionValue,
              ),
            } as ScheduleFilterState);
          }}
          onSelectAll={() =>
            onChange({
              ...value,
              [group.key]: group.options.map((option) => option.value),
            } as ScheduleFilterState)
          }
          onClear={() => onChange({ ...value, [group.key]: [] } as ScheduleFilterState)}
        />
      ))}
    </ScrollView>
  );
}

export function FilterActions({
  canApply,
  onReset,
  onApply,
}: {
  canApply: boolean;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <View style={styles.filterActions}>
      <PillButton title="Đặt lại" style={styles.resetButton} onPress={onReset} />
      <PillButton
        title="Áp dụng"
        style={[styles.applyButton, canApply ? styles.applyButtonActive : null]}
        onPress={onApply}
      />
    </View>
  );
}

function FilterGroup({
  title,
  options,
  selectedValues,
  onToggle,
  onSelectAll,
  onClear,
}: {
  title: string;
  options: readonly ScheduleFilterOption[];
  selectedValues: (string | number)[];
  onToggle: (value: string | number) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.filterGroup}>
      <View style={styles.filterGroupHeader}>
        <ThemedText type="heading" style={styles.filterTitle}>
          {title}
        </ThemedText>
        <View style={styles.filterHeaderActions}>
          <Pressable accessibilityRole="button" onPress={onSelectAll} hitSlop={8}>
            <ThemedText type="body" style={styles.filterHeaderAction}>
              Tất cả
            </ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <ThemedText type="body" style={styles.filterHeaderMuted}>
              Huỷ
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {options.map((option) => {
        const selected = selectedValues.includes(option.value);
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(option.value)}
            style={({ pressed }) => [
              styles.filterOption,
              pressed ? styles.pressed : null,
            ]}
          >
            <ThemedText type="body" style={styles.filterOptionText}>
              {option.label}
            </ThemedText>
            <View style={[styles.checkbox, selected ? styles.checkboxSelected : null]}>
              {selected ? (
                <AppIcon name="checkRead" size={14} color={Colors.light.surface} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function PillButton({
  title,
  style,
  onPress,
}: {
  title: string;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        style,
        pressed ? styles.pressed : null,
      ]}
    >
      <ThemedText type="body" style={styles.pillButtonText}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterContent: {
    paddingBottom: 112,
  },
  filterGroup: {
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
    gap: 17,
  },
  filterGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  filterHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  filterHeaderAction: {
    color: Colors.light.text,
  },
  filterHeaderMuted: {
    color: Colors.light.divider,
  },
  filterOption: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterOptionText: {
    color: Colors.light.text,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: 3,
  },
  checkboxSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pillButton: {
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: Colors.light.divider,
  },
  resetButton: {
    flex: 0.38,
  },
  applyButton: {
    flex: 0.62,
  },
  applyButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  pillButtonText: {
    color: Colors.light.surface,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
