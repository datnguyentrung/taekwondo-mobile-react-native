import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, radii, typography } from "@/theme";

import {
  ActivitiesActionButton,
  type ActivitiesAction,
  type ActivitiesActionVariant,
} from "./ActivitiesActionButton";

type ActivitiesGridSectionProps = {
  title?: string;
  actions: ActivitiesAction[];
  variant?: ActivitiesActionVariant;
  style?: StyleProp<ViewStyle>;
};

export function ActivitiesGridSection({
  title,
  actions,
  variant = "default",
  style,
}: ActivitiesGridSectionProps) {
  const isQuick = variant === "quick";

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
            <View key={action.label} style={styles.itemWrapper}>
              <ActivitiesActionButton action={action} variant={variant} />
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
    height: 130,
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
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 30,
    paddingHorizontal: 8,
  },
  sectionGrid: {
    marginTop: 32,
  },
  defaultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 19,
  },
  itemWrapper: {
    width: "25%",
    alignItems: "center",
  },
});
