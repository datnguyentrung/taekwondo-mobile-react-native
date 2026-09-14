import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import {
  Colors,
  effects,
  hexToRgba,
  radii,
  typography,
  type AppIconName,
} from "@/theme";

type WalletSectionGroupProps = {
  icon: AppIconName;
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
  footerLabel: string;
  onFooterPress: () => void;
};

export function WalletSectionGroup({
  icon,
  title,
  subtitle,
  count,
  children,
  footerLabel,
  onFooterPress,
}: WalletSectionGroupProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <AppIcon name={icon} size={28} color={Colors.light.primary} />
        </View>
        <View style={styles.headerCopy}>
          <ThemedText type="subtitle" style={styles.title}>
            {title} ({count})
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        </View>
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        onPress={onFooterPress}
        style={({ pressed }) => [styles.footer, pressed ? styles.pressed : null]}
      >
        <ThemedText type="action" style={styles.footerText}>
          {footerLabel}
        </ThemedText>
        <AppIcon name="chevronRight" width={8} height={14} color={Colors.light.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.divider, 0.58),
    borderRadius: radii.lg,
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.light.text,
  },
  subtitle: {
    color: Colors.light.textSecondary,
  },
  body: {
    gap: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: hexToRgba(Colors.light.divider, 0.85),
  },
  footer: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  footerText: {
    color: Colors.light.primary,
    ...typography.action,
  },
  pressed: {
    opacity: 0.75,
  },
});
