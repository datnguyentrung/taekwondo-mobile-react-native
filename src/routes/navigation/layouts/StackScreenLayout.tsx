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
import { DefaultHeaderActions } from "../components/DefaultHeaderActions";
import { HeaderActionButton } from "../components/HeaderActionButton";

const { height } = getWindowDimensions();

export type StackHeaderAction = {
  icon: AppIconName;
  label: string;
  badge?: string | number;
  badgeVariant?: "dot" | "count";
  color?: string;
  onPress?: () => void;
  testID?: string;
};

export type StackScreenLayoutProps = {
  title: string;
  children: ReactNode;
  rightActions?: ReactNode | StackHeaderAction[];
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
  const actionColor = Colors.light.text;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 59) }]}>
        <View style={styles.headerContent}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            hitSlop={8}
            onPress={() =>
              router.canGoBack() ? router.back() : router.push("/")
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <AppIcon
              name="chevronLeft"
              width={12}
              height={20}
              color={actionColor}
            />
          </Pressable>
          <ThemedText type="heading" style={styles.title}>
            {title}
          </ThemedText>
          <View style={styles.actions}>
            {Array.isArray(rightActions)
              ? rightActions.map((action) => (
                  <HeaderActionButton
                    key={`${action.label}-${action.icon}`}
                    {...action}
                    color={action.color ?? actionColor}
                  />
                ))
              : rightActions ?? <DefaultHeaderActions color={actionColor} />}
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
    minWidth: 44,
    minHeight: 44,
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
    gap: 2,
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
