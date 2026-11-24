import { Pressable, StyleSheet, View } from "react-native";
import { Chat, Phone } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, radii, Spacing } from "@/theme";

type SupportHeroSectionProps = {
  displayName: string;
  onPressChat: () => void;
  onPressHotline: () => void;
};

export function SupportHeroSection({
  displayName,
  onPressChat,
  onPressHotline,
}: SupportHeroSectionProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="bodySmall" style={styles.greeting}>
        Xin chào {displayName}
      </ThemedText>
      <ThemedText type="heading" style={styles.heading}>
        Trợ lý TKD có thể giúp gì cho bạn?
      </ThemedText>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chat Trợ lý"
          onPress={onPressChat}
          style={({ pressed }) => [
            styles.primaryButton,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon icon={<Chat />} size={20} color={Colors.light.surface} />
          <ThemedText type="action" style={styles.primaryButtonText}>
            Chat Trợ lý
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hotline TKD"
          onPress={onPressHotline}
          style={({ pressed }) => [
            styles.secondaryButton,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon icon={<Phone />} size={20} color={Colors.light.primary} />
          <ThemedText type="action" style={styles.secondaryButtonText}>
            Hotline TKD
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  greeting: {
    color: Colors.light.primary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  heading: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: Colors.light.surface,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
});
