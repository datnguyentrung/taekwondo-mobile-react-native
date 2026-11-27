import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { FloatingActionButton } from "@/shared/ui/FloatingActionButton";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, radii } from "@/theme";

import {
  CHATBOT_RADIAL_ACTIONS,
  ChatbotRadialMenu,
  resolveRadialSelection,
} from "./ChatbotRadialMenu";

const CHATBOT_AVATAR = require("../../../../assets/images/chibi/goat-4.gif");
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function ChatbotFab({
  onPress,
  onSelectAction,
}: {
  onPress?: () => void;
  onSelectAction?: (href: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const floatY = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const openProgress = useSharedValue(0);
  const selectedIndex = useSharedValue(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      floatY.set(0);
      return;
    }

    floatY.set(
      withRepeat(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [floatY, reducedMotion]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.get() },
      { scale: pressScale.get() },
    ],
  }));

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [onPress]);

  const handleOpenMenu = useCallback(() => {
    setMenuOpen(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleSelectionTick = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleCommitAction = useCallback(
    (index: number) => {
      setMenuOpen(false);
      const action = CHATBOT_RADIAL_ACTIONS[index];
      if (!action) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (onSelectAction) {
        onSelectAction(action.href);
      } else {
        onPress?.();
      }
    },
    [onPress, onSelectAction],
  );

  const gesture = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .maxDuration(195)
      .onBegin(() => {
        pressScale.set(
          withTiming(0.95, {
            duration: 100,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        );
      })
      .onEnd((_event, success) => {
        if (success) {
          scheduleOnRN(handlePress);
        }
      })
      .onFinalize(() => {
        pressScale.set(
          withTiming(1, {
            duration: 140,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        );
      });

    const holdPanGesture = Gesture.Pan()
      .activateAfterLongPress(200)
      .onStart(() => {
        selectedIndex.set(-1);
        pressScale.set(
          withSpring(1.06, {
            duration: 240,
            dampingRatio: 0.85,
            reduceMotion: ReduceMotion.System,
          }),
        );
        openProgress.set(
          withSpring(1, {
            duration: 300,
            dampingRatio: 0.82,
            reduceMotion: ReduceMotion.System,
          }),
        );
        scheduleOnRN(handleOpenMenu);
      })
      .onUpdate((event) => {
        const nextIndex = resolveRadialSelection(
          event.translationX,
          event.translationY,
        );
        if (nextIndex !== selectedIndex.get()) {
          selectedIndex.set(nextIndex);
          if (nextIndex >= 0) {
            scheduleOnRN(handleSelectionTick);
          }
        }
      })
      .onEnd(() => {
        const finalIndex = selectedIndex.get();
        selectedIndex.set(-1);
        pressScale.set(
          withTiming(1, {
            duration: 160,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        );
        openProgress.set(
          withTiming(0, {
            duration: 180,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        );
        if (finalIndex >= 0) {
          scheduleOnRN(handleCommitAction, finalIndex);
        } else {
          scheduleOnRN(handleCloseMenu);
        }
      })
      .onFinalize(() => {
        selectedIndex.set(-1);
        pressScale.set(
          withTiming(1, {
            duration: 160,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        );
        openProgress.set(
          withTiming(0, {
            duration: 180,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        );
        scheduleOnRN(handleCloseMenu);
      });

    return Gesture.Race(tapGesture, holdPanGesture);
  }, [
    handleCloseMenu,
    handleCommitAction,
    handleOpenMenu,
    handlePress,
    handleSelectionTick,
    openProgress,
    pressScale,
    selectedIndex,
  ]);

  return (
    <>
      <ChatbotRadialMenu
        openProgress={openProgress}
        selectedIndex={selectedIndex}
        isOpen={menuOpen}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessibilityRole="button"
          accessibilityLabel="Trợ lý ảo"
          accessibilityHint="Nhấn để mở hỗ trợ, hoặc nhấn giữ và kéo để chọn nhanh"
          testID="tabs-chatbot-fab"
          style={[styles.wrapper, containerAnimatedStyle]}
        >
          <View pointerEvents="none" style={styles.fabContent}>
            <FloatingActionButton
              imageSource={CHATBOT_AVATAR}
              imageSize={80}
              accessibilityLabel="Trợ lý ảo"
              onPress={handlePress}
              style={styles.fab}
            />
            <View pointerEvents="none" style={styles.sparkleBadge}>
              <ThemedText type="caption" style={styles.sparkleText}>
                AI
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: "14%",
    right: "5%",
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  fabContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "relative",
    right: 0,
    bottom: 0,
    width: 80,
    height: 80,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  sparkleBadge: {
    position: "absolute",
    top: 1,
    right: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.primary,
    borderWidth: 1.5,
    borderColor: Colors.light.surface,
    ...effects.soft,
  },
  sparkleText: {
    color: Colors.light.surface,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
  },
});
