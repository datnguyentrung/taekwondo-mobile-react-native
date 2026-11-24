import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

const TBOT_AVATAR = require("../../../../assets/images/chibi/avatar-chatbot.png");

function TypingDot({ delayMs }: { delayMs: number }) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = 0;
      return;
    }
    translateY.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(-4, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [delayMs, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function ChatTypingIndicator({ peerName }: { peerName: string }) {
  return (
    <View style={styles.row}>
      <Image source={TBOT_AVATAR} style={styles.avatar} resizeMode="cover" />
      <View style={styles.bubbleCol}>
        <ThemedText type="caption" style={styles.nameLabel}>
          {peerName}
        </ThemedText>
        <View style={styles.bubble}>
          <TypingDot delayMs={0} />
          <TypingDot delayMs={140} />
          <TypingDot delayMs={280} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.backgroundElement,
  },
  bubbleCol: {
    gap: 4,
  },
  nameLabel: {
    color: Colors.light.text,
    fontWeight: "700",
    marginLeft: 2,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFEFF2",
    borderRadius: radii.xl,
    borderTopLeftRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.light.textSecondary,
  },
});
