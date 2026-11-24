import { Image, Pressable, StyleSheet } from "react-native";
const CHATBOT_AVATAR = require("../../../../assets/images/chibi/goat-3.png");

export function ChatbotHeaderButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Trợ lý ảo"
      hitSlop={8}
      onPress={onPress ?? (() => {})}
      testID="chatbot-header-button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Image
        source={CHATBOT_AVATAR}
        style={styles.avatar}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.75,
  },
  avatar: {
    width: 44,
    height: 44,
  },
});
