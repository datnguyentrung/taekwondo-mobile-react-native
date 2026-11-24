import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Book,
  Document,
  InfoCircle,
  Search,
  User,
} from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, effects, radii } from "@/theme";
import type { AppIconElement } from "@/theme/icons";

type SupportQuickCardItem = {
  id: string;
  title: string;
  icon: AppIconElement;
};

const TOP_ROW_ITEMS: readonly SupportQuickCardItem[] = [
  { id: "fee-check", title: "Tra soát\nhọc phí", icon: <Document /> },
  { id: "lookup", title: "Tra cứu", icon: <Search /> },
  { id: "course-advice", title: "Tư vấn khóa học", icon: <Book /> },
];

const BOTTOM_ROW_ITEMS: readonly SupportQuickCardItem[] = [
  { id: "faq", title: "Câu hỏi thường gặp", icon: <InfoCircle /> },
  { id: "staff", title: "Nhân viên hỗ trợ", icon: <User /> },
];

export function SupportQuickCards({
  onSelectCard,
}: {
  onSelectCard: (item: SupportQuickCardItem) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroller}
    >
      <View style={styles.rowsWrapper}>
        <View style={styles.row}>
          {TOP_ROW_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title.replace("\n", " ")}
              onPress={() => onSelectCard(item)}
              style={({ pressed }) => [
                styles.card,
                styles.compactCard,
                activeEffect(pressed, "pressedScale"),
              ]}
            >
              <AppIcon
                icon={item.icon}
                size={24}
                color={Colors.light.primary}
              />
              <ThemedText type="bodySmall" style={styles.cardTitle}>
                {item.title}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          {BOTTOM_ROW_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => onSelectCard(item)}
              style={({ pressed }) => [
                styles.card,
                styles.wideCard,
                activeEffect(pressed, "pressedScale"),
              ]}
            >
              <AppIcon
                icon={item.icon}
                size={24}
                color={Colors.light.primary}
              />
              <ThemedText type="bodySmall" style={styles.cardTitle}>
                {item.title}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    paddingRight: 20,
  },
  rowsWrapper: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: radii.md,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    ...effects.soft,
  },
  compactCard: {
    width: 132,
    minHeight: 108,
  },
  wideCard: {
    width: 210,
    minHeight: 96,
  },
  cardTitle: {
    color: Colors.light.text,
    fontWeight: "600",
    marginTop: 12,
  },
});
