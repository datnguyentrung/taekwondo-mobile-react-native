import { Pressable, ScrollView, StyleSheet } from "react-native";
import { Calendar, Coins, Users } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, hexToRgba, radii } from "@/theme";
import type { AppIconElement } from "@/theme/icons";

import { CHAT_QUICK_ACTIONS } from "../constants/chat.constants";
import type { ChatQuickAction } from "../domain/chat.types";

function getQuickActionIcon(
  iconKey: ChatQuickAction["iconKey"],
): AppIconElement {
  switch (iconKey) {
    case "class-advice":
      return <Users />;
    case "tuition":
      return <Coins />;
    case "trial":
      return <Calendar />;
  }
}

export function ChatQuickActionChips({
  visible,
  onSelect,
}: {
  visible: boolean;
  onSelect: (action: ChatQuickAction) => void;
}) {
  if (!visible) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroller}
    >
      {CHAT_QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.title.replace("\n", " ")}
          onPress={() => onSelect(action)}
          style={({ pressed }) => [
            styles.chip,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon
            icon={getQuickActionIcon(action.iconKey)}
            size={20}
            color={Colors.light.primary}
          />
          <ThemedText type="caption" style={styles.chipText}>
            {action.title}
          </ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.lg,
    backgroundColor: hexToRgba(Colors.light.primary, 0.05),
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.primary, 0.16),
  },
  chipText: {
    color: Colors.light.text,
    fontWeight: "600",
    lineHeight: 16,
  },
});
