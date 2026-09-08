import { useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, effects, radii } from '@/theme';
import { AppIcon } from './AppIcon';
import { ThemedText } from './ThemedText';

export type BottomSheetWindowProps = {
  visible: boolean;
  title: string;
  accessibilityLabel?: string;
  backdropAccessibilityLabel?: string;
  closeAccessibilityLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
};

function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function BottomSheetWindow({
  visible,
  title,
  accessibilityLabel,
  backdropAccessibilityLabel = 'Đóng cửa sổ',
  closeAccessibilityLabel = 'Đóng',
  children,
  footer,
  onClose,
}: BottomSheetWindowProps) {
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const sheetHeight = useSharedValue(Math.max(height - 110, 480));
  const translateY = useSharedValue(0);
  const context = useSharedValue(0);

  useEffect(() => {
    translateY.set(visible || reducedMotion ? 0 : sheetHeight.get());
  }, [reducedMotion, sheetHeight, translateY, visible]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart(() => {
          context.set(translateY.get());
        })
        .onUpdate((event) => {
          const next = context.get() + event.translationY;
          translateY.set(next >= 0 ? next : rubberband(next, sheetHeight.get()));
        })
        .onEnd((event) => {
          const heightValue = sheetHeight.get();
          const projected = translateY.get() + project(event.velocityY);

          if (projected > heightValue * 0.4) {
            translateY.set(
              withSpring(
                heightValue,
                {
                  duration: 300,
                  dampingRatio: 1,
                  velocity: event.velocityY,
                  overshootClamping: true,
                  reduceMotion: ReduceMotion.System,
                },
                (finished) => {
                  if (finished) scheduleOnRN(onClose);
                },
              ),
            );
          } else {
            translateY.set(
              withSpring(0, {
                duration: 300,
                dampingRatio: 0.8,
                velocity: event.velocityY,
                reduceMotion: ReduceMotion.System,
              }),
            );
          }
        }),
    [context, onClose, sheetHeight, translateY],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.get(),
      [0, Math.max(sheetHeight.get(), 1)],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backdropAccessibilityLabel}
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityViewIsModal
            style={[styles.sheet, sheetStyle]}
            onLayout={(event) => {
              sheetHeight.set(event.nativeEvent.layout.height);
            }}
          >
            <View style={styles.header}>
              <View style={styles.handle} />
              <ThemedText type="body" style={styles.title}>
                {title}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeAccessibilityLabel}
                hitSlop={10}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppIcon name="plus" size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    maxHeight: '88%',
    minHeight: '78%',
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    overflow: 'hidden',
    ...effects.glass,
  },
  header: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  handle: {
    position: 'absolute',
    top: 7,
    width: 61,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.text,
  },
  title: {
    color: Colors.light.text,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 18,
    top: 13,
    width: 29,
    height: 29,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.divider,
    transform: [{ rotate: '45deg' }],
  },
  body: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
  },
  pressed: {
    opacity: 0.75,
  },
});
