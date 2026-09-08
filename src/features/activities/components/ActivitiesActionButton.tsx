import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, figmaColors, hexToRgba, typography } from "@/theme";
import type { ActivitiesAction } from "./activities.constants";

export type ActivitiesActionVariant = "quick" | "default";

type ActivitiesActionButtonProps = {
  action: ActivitiesAction;
  variant?: ActivitiesActionVariant;
  isEditingQuick?: boolean;
  onPress?: (action: ActivitiesAction) => void;
};

const noop = () => undefined;

export function ActivitiesActionButton({
  action,
  variant = "default",
  isEditingQuick = false,
  onPress,
}: ActivitiesActionButtonProps) {
  const isQuick = variant === "quick";
  const badgeName = isQuick ? "featureBadgeMinus" : "featureBadgePlus";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={onPress ? () => onPress(action) : noop}
      style={({ pressed }) => [styles.root, pressed ? styles.pressed : null]}
    >
      <View
        style={[styles.tile, isQuick ? styles.quickTile : styles.defaultTile]}
      >
        <AppIcon name={action.icon} size={38} />
        {isEditingQuick ? (
          <AppIcon name={badgeName} size={22} style={styles.badge} />
        ) : null}
      </View>
      <ThemedText
        type="featureLabel"
        numberOfLines={2}
        style={[
          styles.label,
          isQuick ? styles.quickLabel : styles.defaultLabel,
        ]}
      >
        {action.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    minHeight: 100,
    alignItems: "center",
  },
  tile: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...effects.card,
  },
  quickTile: {
    backgroundColor: Colors.light.surface,
  },
  defaultTile: {
    backgroundColor: hexToRgba(figmaColors.color1, 0.1),
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
  },
  label: {
    width: "90%",
    marginTop: 4,
    textAlign: "center",
    ...typography.featureLabel,
  },
  quickLabel: {
    color: Colors.light.surface,
    ...typography.bodySmall,
  },
  defaultLabel: {
    color: Colors.light.text,
    ...typography.bodySmall,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
