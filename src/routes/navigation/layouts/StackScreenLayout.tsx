import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { getWindowDimensions } from "@/shared/utils/windowDimensions";
import { Colors, effects, typography } from "@/theme";
import type { AppIconName } from "@/theme/icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { height } = getWindowDimensions();

export type StackHeaderAction = {
  icon: AppIconName;
  label: string;
  onPress?: () => void;
};

export type StackScreenLayoutProps = {
  title: string;
  children: ReactNode;
  rightActions?: StackHeaderAction[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  floatingContent?: ReactNode;
  scrollEnabled?: boolean;
};

export default function StackScreenLayout({
  title,
  children,
  rightActions,
  contentContainerStyle,
  floatingContent,
  scrollEnabled = true,
}: StackScreenLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const actions = rightActions ?? [
    { icon: "bellOutline", label: "Thông báo" },
    {
      icon: "homeOutline",
      label: "Trang chủ",
      onPress: () => router.push("/"),
    },
  ];

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 59) }]}>
        <View style={styles.headerContent}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={() =>
              router.canGoBack() ? router.back() : router.push("/")
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <AppIcon name="chevronLeft" width={12} height={20} />
          </Pressable>
          <ThemedText type="heading" style={styles.title}>
            {title}
          </ThemedText>
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={`${action.label}-${action.icon}`}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppIcon name={action.icon} size={29} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {scrollEnabled ? (
        <ScrollView
          style={styles.scroll}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.content, contentContainerStyle]}>
          {children}
        </View>
      )}

      {floatingContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  headerContent: {
    height: height * 0.08,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 32,
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    color: Colors.light.text,
    textAlign: "center",
    ...typography.heading,
  },
  actions: {
    position: "absolute",
    right: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  pressed: {
    opacity: 0.75,
  },
});
