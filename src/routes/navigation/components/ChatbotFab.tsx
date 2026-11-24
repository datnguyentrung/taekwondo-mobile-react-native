import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { FloatingActionButton } from "@/shared/ui/FloatingActionButton";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, radii } from "@/theme";

const CHATBOT_AVATAR = require("../../../../assets/images/chibi/goat-4.gif");

export function ChatbotFab({ onPress }: { onPress?: () => void }) {
  const reducedMotion = useReducedMotion();
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      floatY.value = 0;
      return;
    }

    floatY.value = withRepeat(
      withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [floatY, reducedMotion]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, containerAnimatedStyle]}
    >
      <FloatingActionButton
        imageSource={CHATBOT_AVATAR}
        imageSize={80}
        accessibilityLabel="Trợ lý ảo"
        testID="tabs-chatbot-fab"
        onPress={handlePress}
        style={styles.fab}
      />
      <View pointerEvents="none" style={styles.sparkleBadge}>
        <ThemedText type="caption" style={styles.sparkleText}>
          AI
        </ThemedText>
      </View>
    </Animated.View>
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
