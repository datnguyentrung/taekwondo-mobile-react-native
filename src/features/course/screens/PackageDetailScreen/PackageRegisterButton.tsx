import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, hexToRgba, radii } from "@/theme";

export function PackageRegisterButton({
  title = "Đăng ký",
  accessibilityLabel = "Đăng ký gói học",
  disabled = false,
  onPress,
}: {
  title?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.registerButton,
          disabled ? styles.registerButtonDisabled : null,
          !disabled ? activeEffect(pressed, "pressedScale") : null,
        ]}
      >
        <ThemedText
          type="heading"
          style={[styles.registerText, disabled ? styles.registerTextDisabled : null]}
        >
          {title}
        </ThemedText>
        {/* <AppIcon
          icon={<ChevronRight size={20} />}
          // width={9}
          // height={16}
          color={Colors.light.surface}
        /> */}
      </Pressable>
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
    backgroundColor: hexToRgba(Colors.light.background, 0.92),
  },
  registerButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: radii.xl,
    backgroundColor: Colors.light.primary,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.light.divider,
  },
  registerText: {
    color: Colors.light.surface,
  },
  registerTextDisabled: {
    color: Colors.light.textSecondary,
  },
});
