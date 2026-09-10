import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, radii, typography } from "@/theme";

import type { ActivitiesAction } from "./activities.constants";
import {
  ActivitiesActionButton,
  type ActivitiesActionVariant,
} from "./ActivitiesActionButton";

type ActivitiesGridSectionProps = {
  title?: string;
  actions: ActivitiesAction[];
  variant?: ActivitiesActionVariant;
  isEditingQuick?: boolean;
  onAddQuickAction?: (action: ActivitiesAction) => void;
  onRemoveQuickAction?: (action: ActivitiesAction) => void;
  onActionPress?: (action: ActivitiesAction) => void;
  style?: StyleProp<ViewStyle>;
};

export function ActivitiesGridSection({
  title,
  actions,
  variant = "default",
  isEditingQuick = false,
  onAddQuickAction,
  onRemoveQuickAction,
  onActionPress,
  style,
}: ActivitiesGridSectionProps) {
  const isQuick = variant === "quick";
  const handleActionPress = isEditingQuick
    ? isQuick
      ? onRemoveQuickAction
      : onAddQuickAction
    : onActionPress;

  return (
    <View style={style}>
      {title ? (
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}

      <View style={isQuick ? styles.quickPanel : styles.sectionGrid}>
        {isQuick ? (
          <>
            <AppIcon
              name="featureQuickMaskPrimary"
              width={353}
              height={130}
              style={styles.mask}
            />
            <AppIcon
              name="featureQuickMaskSecondary"
              width={353}
              height={130}
              style={styles.mask}
            />
          </>
        ) : null}

        <View style={isQuick ? styles.quickGrid : styles.defaultGrid}>
          {actions.map((action) => (
            <View key={action.id} style={styles.itemWrapper}>
              <ActivitiesActionButton
                action={action}
                variant={variant}
                isEditingQuick={isEditingQuick}
                onPress={handleActionPress}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Colors.light.text,
    ...typography.subtitle,
  },
  quickPanel: {
    overflow: "hidden",
    borderRadius: radii.md,
    backgroundColor: Colors.light.header,
    ...effects.card,
  },
  mask: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    rowGap: 16,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  sectionGrid: {
    marginTop: 22,
  },
  defaultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  itemWrapper: {
    width: "25%",
    alignItems: "center",
  },
});
