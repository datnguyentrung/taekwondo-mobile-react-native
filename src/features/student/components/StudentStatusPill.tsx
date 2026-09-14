import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii } from "@/theme";

export function StudentStatusPill({ label }: { label: string }) {
  const paused = label === "Bảo lưu";

  return (
    <View style={[styles.root, paused ? styles.paused : styles.learning]}>
      <ThemedText
        type="featureLabel"
        style={[styles.text, paused ? styles.pausedText : styles.learningText]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 32,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
  },
  learning: {
    borderColor: hexToRgba(Colors.light.primary, 0.2),
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
  },
  paused: {
    borderColor: Colors.light.divider,
    backgroundColor: hexToRgba(Colors.light.divider, 0.24),
  },
  text: {
    textAlign: "center",
  },
  learningText: {
    color: Colors.light.primary,
  },
  pausedText: {
    color: Colors.light.textSecondary,
  },
});
