import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Colors, effects, hexToRgba, radii, typography } from "@/theme";

import {
  NotificationTypeLabel,
  type NotificationType,
} from "../constants/notification.constants";
import { notificationTypes } from "../queries/notificationQueries";

export type NotificationReadTab = "all" | "unread";

export type NotificationFilterBarProps = {
  tab: NotificationReadTab;
  search: string;
  selectedType?: NotificationType;
  onTabChange: (tab: NotificationReadTab) => void;
  onSearchChange: (value: string) => void;
  onTypeChange: (type?: NotificationType) => void;
};

const tabLabels: Record<NotificationReadTab, string> = {
  all: "Tất cả",
  unread: "Chưa đọc",
};

export function NotificationFilterBar({
  tab,
  search,
  selectedType,
  onTabChange,
  onSearchChange,
  onTypeChange,
}: NotificationFilterBarProps) {
  const [draftSearch, setDraftSearch] = useState(search);
  const debouncedSearch = useDebounce(draftSearch, 400);

  useEffect(() => {
    onSearchChange(debouncedSearch.trim());
  }, [debouncedSearch, onSearchChange]);

  const typeOptions = useMemo(
    () => [{ label: "Tất cả loại", value: undefined }, ...notificationTypes.map((type) => ({
      label: NotificationTypeLabel[type],
      value: type,
    }))],
    [],
  );

  return (
    <View style={styles.toolbar}>
      <View style={styles.tabRow} accessibilityRole="tablist">
        {(["all", "unread"] as const).map((item) => {
          const active = tab === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityLabel={tabLabels[item]}
              accessibilityState={{ selected: active }}
              onPress={() => onTabChange(item)}
              style={({ pressed }) => [
                styles.tabButton,
                active ? styles.tabButtonActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <ThemedText
                type="featureLabel"
                style={[styles.tabText, active ? styles.tabTextActive : null]}
              >
                {tabLabels[item]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchBox}>
        <AppIcon name="filter" size={18} color={Colors.light.textSecondary} />
        <TextInput
          value={draftSearch}
          onChangeText={setDraftSearch}
          placeholder="Tìm theo tiêu đề, nội dung..."
          placeholderTextColor={Colors.light.textSecondary}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeScroller}
      >
        {typeOptions.map((option) => {
          const active = selectedType === option.value;
          return (
            <Pressable
              key={option.value ?? "all"}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active }}
              onPress={() => onTypeChange(option.value)}
              style={({ pressed }) => [
                styles.typeChip,
                active ? styles.typeChipActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <ThemedText
                type="caption"
                style={[styles.typeChipText, active ? styles.typeChipTextActive : null]}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    borderRadius: radii.lg,
    backgroundColor: Colors.light.surface,
    padding: 12,
    ...effects.soft,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    minHeight: 44,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 14,
  },
  tabButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.surface,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: Colors.light.text,
    paddingVertical: 0,
    ...typography.bodySmall,
  },
  typeScroller: {
    gap: 8,
    paddingRight: 2,
  },
  typeChip: {
    minHeight: 38,
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
  },
  typeChipActive: {
    borderColor: hexToRgba(Colors.light.primary, 0.34),
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
  },
  typeChipText: {
    color: Colors.light.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.light.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
