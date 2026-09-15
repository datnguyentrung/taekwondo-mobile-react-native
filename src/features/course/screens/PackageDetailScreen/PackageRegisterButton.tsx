import { ChevronRight } from "reicon-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, hexToRgba, radii } from "@/theme";

export function PackageRegisterButton({ onPress }: { onPress: () => void }) {
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
        accessibilityLabel="Đăng ký gói học"
        onPress={onPress}
        style={({ pressed }) => [
          styles.registerButton,
          activeEffect(pressed, "pressedScale"),
        ]}
      >
        <ThemedText type="heading" style={styles.registerText}>
          Đăng ký
        </ThemedText>
        <AppIcon icon={<ChevronRight />}
          width={9}
          height={16}
          color={Colors.light.surface}
        />
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
  registerText: {
    color: Colors.light.surface,
  },
});
