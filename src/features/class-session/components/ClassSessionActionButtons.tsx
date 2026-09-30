import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, hexToRgba, radii } from "@/theme";

export function ClassSessionActionButtons({
  onHistoryPress,
  onEvaluatePress,
}: {
  onHistoryPress: () => void;
  onEvaluatePress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingActionWrap,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lịch sử điểm danh"
          onPress={onHistoryPress}
          style={({ pressed }) => [
            styles.historyButton,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <ThemedText type="subtitle" style={styles.historyButtonText}>
            Lịch sử
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đánh giá buổi tập"
          onPress={onEvaluatePress}
          style={({ pressed }) => [
            styles.evaluateButton,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <ThemedText type="subtitle" style={styles.evaluateButtonText}>
            Đánh giá
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingActionWrap: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: hexToRgba(Colors.light.background, 0.94),
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  historyButton: {
    flex: 1,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  historyButtonText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  evaluateButton: {
    flex: 1,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    backgroundColor: Colors.light.primary,
  },
  evaluateButtonText: {
    color: Colors.light.surface,
    fontWeight: "700",
  },
});
