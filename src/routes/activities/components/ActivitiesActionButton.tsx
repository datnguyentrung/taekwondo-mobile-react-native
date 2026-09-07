import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, typography } from "@/theme";
import type { AppIconName } from "@/theme/icons";

export type ActivitiesActionVariant = "quick" | "default";

export type ActivitiesAction = {
  label: string;
  icon: AppIconName;
};

type ActivitiesActionButtonProps = {
  action: ActivitiesAction;
  variant?: ActivitiesActionVariant;
};

const noop = () => undefined;

export function ActivitiesActionButton({
  action,
  variant = "default",
}: ActivitiesActionButtonProps) {
  const isQuick = variant === "quick";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={noop}
      style={({ pressed }) => [styles.root, pressed ? styles.pressed : null]}
    >
      <View
        style={[styles.tile, isQuick ? styles.quickTile : styles.defaultTile]}
      >
        <AppIcon name={action.icon} size={38} />
        <AppIcon
          name={isQuick ? "featureBadgeMinus" : "featureBadgePlus"}
          size={22}
          style={styles.badge}
        />
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
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...effects.card,
  },
  quickTile: {
    backgroundColor: Colors.light.surface,
  },
  defaultTile: {
    backgroundColor: "rgba(215, 17, 19, 0.2)",
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
  },
  defaultLabel: {
    color: Colors.light.text,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
