import {
  Image,
  Pressable,
  StyleSheet,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, effects, radii } from "@/theme";
import type { AppIconElement } from "@/theme/icons";

export type FloatingActionButtonProps = {
  icon?: AppIconElement;
  imageSource?: ImageSourcePropType;
  imageSize?: number;
  imageStyle?: StyleProp<ImageStyle>;
  label?: string;
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function FloatingActionButton({
  icon,
  imageSource,
  imageSize = 32,
  imageStyle,
  label,
  accessibilityLabel,
  onPress,
  testID,
  style,
}: FloatingActionButtonProps) {
  const isIconOnly = !label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isIconOnly ? styles.iconOnly : null,
        activeEffect(pressed, "pressedScale"),
        style,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[{ width: imageSize, height: imageSize }, imageStyle]}
          resizeMode="contain"
        />
      ) : icon ? (
        <AppIcon icon={icon} size={20} color={Colors.light.surface} />
      ) : null}
      {label ? (
        <ThemedText type="bodySmall" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 20,
    bottom: 24,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.primary,
    ...effects.floating,
  },
  iconOnly: {
    width: 52,
    height: 52,
    paddingHorizontal: 0,
  },
  image: {
    width: 32,
    height: 32,
  },
  label: {
    color: Colors.light.surface,
    fontWeight: "700",
  },
});
