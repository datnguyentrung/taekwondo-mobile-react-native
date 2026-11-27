import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Calendar, Chat, InfoCircle } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, hexToRgba, radii } from "@/theme";
import type { AppIconElement } from "@/theme/icons";

export type ChatbotRadialCoord = {
  /** Offset of the circular icon center relative to the FAB center (px). */
  offsetX: number;
  offsetY: number;
};

export type ChatbotRadialAction = ChatbotRadialCoord & {
  id: string;
  title: string;
  href: string;
  icon: AppIconElement;
};

/** Pure numeric coordinates only so Reanimated worklets never capture React elements/FiberNodes. */
export const CHATBOT_RADIAL_COORDS: readonly ChatbotRadialCoord[] = [
  { offsetX: 0, offsetY: -218 },
  { offsetX: 0, offsetY: -154 },
  { offsetX: 0, offsetY: -90 },
] as const;

export const CHATBOT_RADIAL_ACTIONS: readonly ChatbotRadialAction[] = [
  {
    id: "ask-tbot",
    title: "Hỏi TBot",
    href: "/chat/tbot",
    icon: <Chat />,
    ...CHATBOT_RADIAL_COORDS[0],
  },
  {
    id: "view-schedule",
    title: "Xem lịch học",
    href: "/schedule",
    icon: <Calendar />,
    ...CHATBOT_RADIAL_COORDS[1],
  },
  {
    id: "center-info",
    title: "Thông tin trung tâm",
    href: "/admin/knowledge",
    icon: <InfoCircle />,
    ...CHATBOT_RADIAL_COORDS[2],
  },
] as const;

const CIRCLE_SIZE = 52;
const ITEM_ROW_WIDTH = 280;
const BACKDROP_COLOR = "rgba(18, 20, 26, 0.56)";
const PRIMARY_COLOR = Colors.light.primary;
const SURFACE_COLOR = Colors.light.surface;
const CIRCLE_BORDER_DEFAULT = hexToRgba(PRIMARY_COLOR, 0.22);
const PILL_BORDER_ACTIVE = hexToRgba(PRIMARY_COLOR, 0.35);
const PILL_BORDER_DEFAULT = "rgba(255, 255, 255, 0.9)";
const PILL_BG_ACTIVE = "#FFF5F5";
const EASE_OUT_LINEAR = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Resolves which vertical menu item is targeted by a finger displacement `(dx, dy)`
 * from the touch origin on the FAB. Nudging upward immediately selects the bottom item
 * and slides smoothly through middle -> top without needing to hit the icon directly.
 */
export function resolveRadialSelection(dx: number, dy: number): number {
  "worklet";
  const dist = Math.hypot(dx, dy);
  if (dist < 22) {
    return -1;
  }

  // Cancel zone if finger moves downward or far to the right away from the stack.
  if (dy > -22 || dx > 64) {
    return -1;
  }

  // Midpoints between [-218, -154, -90] are -186 and -122.
  if (dy <= -186) {
    return 0;
  }
  if (dy <= -122) {
    return 1;
  }
  return 2;
}

type ChatbotRadialMenuProps = {
  openProgress: SharedValue<number>;
  selectedIndex: SharedValue<number>;
  isOpen: boolean;
};

export function ChatbotRadialMenu({
  openProgress,
  selectedIndex,
  isOpen,
}: ChatbotRadialMenuProps) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!isOpen || reducedMotion) {
      pulse.set(0);
      return;
    }

    pulse.set(
      withRepeat(
        withTiming(1, {
          duration: 1400,
          easing: EASE_OUT_LINEAR,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        false,
      ),
    );
  }, [isOpen, pulse, reducedMotion]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: openProgress.get(),
  }));

  const auraStyle = useAnimatedStyle(() => {
    const p = openProgress.get();
    const scale = reducedMotion ? 1 : interpolate(p, [0, 1], [0.85, 1]);
    return {
      opacity: p,
      transform: [{ scale }],
    };
  });

  const pulseRing1Style = useAnimatedStyle(() => {
    const open = openProgress.get();
    if (reducedMotion || open <= 0.01) {
      return { opacity: 0, transform: [{ scale: 0.9 }] };
    }
    const t = pulse.get();
    return {
      opacity: open * interpolate(t, [0, 0.25, 1], [0, 0.45, 0]),
      transform: [{ scale: interpolate(t, [0, 1], [0.92, 1.75]) }],
    };
  });

  const pulseRing2Style = useAnimatedStyle(() => {
    const open = openProgress.get();
    if (reducedMotion || open <= 0.01) {
      return { opacity: 0, transform: [{ scale: 0.9 }] };
    }
    const t = (pulse.get() + 0.5) % 1;
    return {
      opacity: open * interpolate(t, [0, 0.25, 1], [0, 0.35, 0]),
      transform: [{ scale: interpolate(t, [0, 1], [0.92, 1.75]) }],
    };
  });

  const { height: screenHeight } = useWindowDimensions();
  // Match ChatbotFab's exact anchor: bottom: "14%", right: "5%", width: 84, height: 84
  const fabCenterBottom = screenHeight * 0.14 + 42;

  return (
    <View
      pointerEvents={isOpen ? "auto" : "none"}
      style={styles.overlayRoot}
      accessibilityViewIsModal={isOpen}
    >
      {/* Dimmed gray backdrop */}
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, backdropStyle]}
      />

      {/* Anchor container aligned with ChatbotFab center */}
      <View
        pointerEvents="none"
        style={[styles.anchor, { bottom: fabCenterBottom }]}
      >
        {/* Soft radial red aura behind the mascot */}
        <Animated.View style={[styles.auraContainer, auraStyle]}>
          <View style={styles.auraOuterGlow} />
          <View style={styles.auraInnerGlow} />
        </Animated.View>

        {/* Expanding concentric pulse rings ("tỏa tỏa") */}
        <Animated.View style={[styles.pulseRing, pulseRing1Style]} />
        <Animated.View style={[styles.pulseRing, pulseRing2Style]} />

        {/* 3 Vertical Stack Action Items */}
        {CHATBOT_RADIAL_ACTIONS.map((action, index) => (
          <RadialActionItem
            key={action.id}
            action={action}
            index={index}
            openProgress={openProgress}
            selectedIndex={selectedIndex}
            reducedMotion={Boolean(reducedMotion)}
          />
        ))}
      </View>
    </View>
  );
}

function RadialActionItem({
  action,
  index,
  openProgress,
  selectedIndex,
  reducedMotion,
}: {
  action: ChatbotRadialAction;
  index: number;
  openProgress: SharedValue<number>;
  selectedIndex: SharedValue<number>;
  reducedMotion: boolean;
}) {
  // Destructure primitives so worklets never capture `action.icon` (FiberNode).
  const { offsetY } = action;

  const itemAnimatedStyle = useAnimatedStyle(() => {
    const p = openProgress.get();
    const currentSelected = selectedIndex.get();
    const isSelected = currentSelected === index;
    const hasSelection = currentSelected >= 0;

    // Staggered bottom-to-top entrance from FAB center
    const staggerOrder = CHATBOT_RADIAL_COORDS.length - 1 - index;
    const staggerStart = staggerOrder * 0.08;
    const localProgress = Math.min(
      1,
      Math.max(0, (p - staggerStart) / (1 - staggerStart)),
    );

    const ty = reducedMotion
      ? offsetY
      : interpolate(localProgress, [0, 1], [0, offsetY]);

    const baseScale = reducedMotion
      ? 1
      : interpolate(localProgress, [0, 1], [0.9, 1]);
    const selectionScale = isSelected ? 1.06 : hasSelection ? 0.96 : 1;
    const opacity =
      localProgress * (hasSelection && !isSelected ? 0.78 : 1);

    return {
      opacity,
      transform: [
        { translateY: ty },
        { scale: baseScale * selectionScale },
      ],
    };
  });

  const circleHighlightStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.get() === index;
    return {
      borderColor: isSelected ? PRIMARY_COLOR : CIRCLE_BORDER_DEFAULT,
      borderWidth: isSelected ? 2.5 : 1.5,
    };
  });

  const circleGlowStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.get() === index;
    return {
      opacity: isSelected ? 0.85 : 0,
      transform: [{ scale: isSelected ? 1.16 : 0.95 }],
    };
  });

  const pillHighlightStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.get() === index;
    return {
      backgroundColor: isSelected ? PILL_BG_ACTIVE : SURFACE_COLOR,
      borderColor: isSelected ? PILL_BORDER_ACTIVE : PILL_BORDER_DEFAULT,
    };
  });

  return (
    <Animated.View style={[styles.itemRow, itemAnimatedStyle]}>
      <Animated.View style={[styles.pillCard, pillHighlightStyle]}>
        <ThemedText type="featureLabel" style={styles.pillTitle} numberOfLines={1}>
          {action.title}
        </ThemedText>
      </Animated.View>

      <View style={styles.circleWrapper}>
        <Animated.View style={[styles.circleGlow, circleGlowStyle]} />
        <Animated.View style={[styles.iconCircle, circleHighlightStyle]}>
          <AppIcon icon={action.icon} size={24} color={PRIMARY_COLOR} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 19,
    elevation: 19,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: BACKDROP_COLOR,
  },
  anchor: {
    position: "absolute",
    // Match ChatbotFab right: "5%", width: 84 -> center is 5% + 42px from right
    right: "5%",
    marginRight: 42,
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  auraContainer: {
    position: "absolute",
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  auraOuterGlow: {
    position: "absolute",
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: hexToRgba(PRIMARY_COLOR, 0.08),
  },
  auraInnerGlow: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: hexToRgba(PRIMARY_COLOR, 0.14),
  },
  pulseRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: hexToRgba(PRIMARY_COLOR, 0.5),
    backgroundColor: hexToRgba(PRIMARY_COLOR, 0.1),
  },
  itemRow: {
    position: "absolute",
    right: -CIRCLE_SIZE / 2,
    top: -CIRCLE_SIZE / 2,
    width: ITEM_ROW_WIDTH,
    height: CIRCLE_SIZE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  pillCard: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    ...effects.card,
  },
  pillTitle: {
    color: Colors.light.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  circleGlow: {
    position: "absolute",
    width: CIRCLE_SIZE + 14,
    height: CIRCLE_SIZE + 14,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(PRIMARY_COLOR, 0.22),
  },
  iconCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: SURFACE_COLOR,
    alignItems: "center",
    justifyContent: "center",
    ...effects.floating,
  },
});
