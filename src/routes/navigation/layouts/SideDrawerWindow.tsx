import { usePathname } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Plus } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, radii } from "@/theme";

const DEFAULT_WIDTH_RATIO = 0.86;
const MIN_WIDTH_RATIO = 0.6;
const MAX_WIDTH_RATIO = 0.94;

export type SideDrawerWindowProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Width as a viewport ratio, clamped between 60% and 94%. */
  widthRatio?: number;
  scrollEnabled?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  backdropAccessibilityLabel?: string;
  closeAccessibilityLabel?: string;
  /** Called after the drawer dismisses itself because navigation changed. */
  onRouteChangeClose?: () => void;
};

function clampWidthRatio(widthRatio: number) {
  return Math.min(Math.max(widthRatio, MIN_WIDTH_RATIO), MAX_WIDTH_RATIO);
}

export default function SideDrawerWindow({
  visible,
  title,
  children,
  onClose,
  widthRatio = DEFAULT_WIDTH_RATIO,
  scrollEnabled = true,
  contentContainerStyle,
  accessibilityLabel,
  backdropAccessibilityLabel = "Đóng cửa sổ bên",
  closeAccessibilityLabel = "Đóng",
  onRouteChangeClose,
}: SideDrawerWindowProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const drawerWidth = useMemo(
    () => Math.round(width * clampWidthRatio(widthRatio)),
    [width, widthRatio],
  );
  const [presented, setPresented] = useState(visible);
  const [dismissedForNavigation, setDismissedForNavigation] = useState(false);
  const presentedPathname = useRef(visible ? pathname : null);
  const translateX = useSharedValue(visible ? 0 : -drawerWidth);
  const dragStartX = useSharedValue(0);

  const finishDismiss = useCallback(
    (notify: boolean) => {
      setPresented(false);
      if (notify) onClose();
    },
    [onClose],
  );

  const dismiss = useCallback(
    (notify: boolean) => {
      translateX.set(
        withSpring(
          -drawerWidth,
          {
            duration: 260,
            dampingRatio: 0.9,
            overshootClamping: true,
            reduceMotion: ReduceMotion.System,
          },
          (finished) => {
            if (finished) scheduleOnRN(finishDismiss, notify);
          },
        ),
      );
    },
    [drawerWidth, finishDismiss, translateX],
  );

  useEffect(() => {
    if (!visible) {
      presentedPathname.current = null;
      const frame = requestAnimationFrame(() =>
        setDismissedForNavigation(false),
      );
      return () => cancelAnimationFrame(frame);
    }
    if (presentedPathname.current === null) {
      presentedPathname.current = pathname;
    }
  }, [pathname, visible]);

  useEffect(() => {
    if (
      !visible ||
      dismissedForNavigation ||
      presentedPathname.current === null ||
      presentedPathname.current === pathname
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => setDismissedForNavigation(true));
    dismiss(false);
    (onRouteChangeClose ?? onClose)();
    return () => cancelAnimationFrame(frame);
  }, [
    dismiss,
    dismissedForNavigation,
    onClose,
    onRouteChangeClose,
    pathname,
    visible,
  ]);

  useEffect(() => {
    if (!visible && presented) {
      dismiss(false);
      return;
    }

    if (visible && !presented) {
      const frame = requestAnimationFrame(() => setPresented(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [dismiss, presented, visible]);

  useEffect(() => {
    if (!visible || !presented) return;

    translateX.set(-drawerWidth);
    translateX.set(
      reducedMotion
        ? 0
        : withSpring(0, {
            duration: 300,
            dampingRatio: 0.85,
            reduceMotion: ReduceMotion.System,
          }),
    );
  }, [drawerWidth, presented, reducedMotion, translateX, visible]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-15, 15])
        .onStart(() => {
          dragStartX.set(translateX.get());
        })
        .onUpdate((event) => {
          translateX.set(Math.min(0, dragStartX.get() + event.translationX));
        })
        .onEnd((event) => {
          const shouldDismiss =
            translateX.get() < -drawerWidth * 0.35 || event.velocityX < -500;

          if (shouldDismiss) {
            translateX.set(
              withSpring(
                -drawerWidth,
                {
                  duration: 260,
                  dampingRatio: 0.9,
                  velocity: event.velocityX,
                  overshootClamping: true,
                  reduceMotion: ReduceMotion.System,
                },
                (finished) => {
                  if (finished) scheduleOnRN(finishDismiss, true);
                },
              ),
            );
            return;
          }

          translateX.set(
            withSpring(0, {
              duration: 260,
              dampingRatio: 0.85,
              velocity: event.velocityX,
              reduceMotion: ReduceMotion.System,
            }),
          );
        }),
    [dragStartX, drawerWidth, finishDismiss, translateX],
  );

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-Math.max(drawerWidth, 1), 0],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const isPresented = (visible && !dismissedForNavigation) || presented;

  if (!isPresented) return null;

  return (
    <Modal
      visible={isPresented}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismiss(true)}
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backdropAccessibilityLabel}
            style={StyleSheet.absoluteFill}
            onPress={() => dismiss(true)}
          />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityViewIsModal
            style={[styles.drawer, { width: drawerWidth }, drawerStyle]}
          >
            <View
              style={[
                styles.safeArea,
                {
                  paddingTop: insets.top,
                  paddingLeft: insets.left,
                },
              ]}
            >
              <View style={styles.header}>
                <ThemedText
                  type="heading"
                  numberOfLines={1}
                  style={styles.title}
                >
                  {title}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={closeAccessibilityLabel}
                  hitSlop={10}
                  onPress={() => dismiss(true)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <AppIcon
                    icon={<Plus />}
                    size={22}
                    color={Colors.light.text}
                  />
                </Pressable>
              </View>
              {scrollEnabled ? (
                <ScrollView
                  testID="side-drawer-scroll-content"
                  contentContainerStyle={[
                    styles.content,
                    contentContainerStyle,
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>
              ) : (
                <View
                  testID="side-drawer-fixed-content"
                  style={[
                    styles.content,
                    styles.fixedContent,
                    contentContainerStyle,
                  ]}
                >
                  {children}
                </View>
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawer: {
    flex: 1,
    maxWidth: "100%",
    overflow: "hidden",
    backgroundColor: Colors.light.surface,
    borderTopRightRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    ...effects.glass,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  title: {
    flex: 1,
    color: Colors.light.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    // backgroundColor: Colors.light.divider,
    transform: [{ rotate: "45deg" }],
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  fixedContent: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
