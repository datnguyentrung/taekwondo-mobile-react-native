import { Pressable, StyleSheet, View } from "react-native";
import {
  Copy,
  Flag,
  Forward,
  InfoCircle,
  Reply,
  Trash,
} from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, radii } from "@/theme";

import { REACTION_EMOJIS } from "../constants/chat.constants";
import type { ChatMessage, MessageReactionEmoji } from "../domain/chat.types";

type ChatMessageActionSheetProps = {
  message: ChatMessage | null;
  onClose: () => void;
  onReact: (messageId: string, emoji: MessageReactionEmoji) => void;
  onReply: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onInfo: (message: ChatMessage) => void;
  onRecall: (messageId: string) => void;
  onReport: (message: ChatMessage) => void;
};

export function ChatMessageActionSheet({
  message,
  onClose,
  onReact,
  onReply,
  onCopy,
  onForward,
  onInfo,
  onRecall,
  onReport,
}: ChatMessageActionSheetProps) {
  if (!message) return null;

  const isUser = message.sender === "user";
  const canRecall = isUser && !message.isRecalled;
  const canReport = !isUser && !message.isRecalled;

  return (
    <BottomSheetWindow
      visible={Boolean(message)}
      title="Tùy chọn tin nhắn"
      onClose={onClose}
    >
      <View style={styles.content}>
        {!message.isRecalled ? (
          <View style={styles.reactionRow}>
            {REACTION_EMOJIS.map((emoji) => {
              const selected = message.reactions?.includes(emoji);
              return (
                <Pressable
                  key={emoji}
                  accessibilityRole="button"
                  accessibilityLabel={`Thả cảm xúc ${emoji}`}
                  onPress={() => onReact(message.id, emoji)}
                  style={({ pressed }) => [
                    styles.reactionButton,
                    selected ? styles.reactionButtonSelected : null,
                    activeEffect(pressed, "pressedScale"),
                  ]}
                >
                  <ThemedText type="subtitle" style={styles.reactionEmoji}>
                    {emoji}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!message.isRecalled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trả lời tin nhắn"
            onPress={() => onReply(message)}
            style={({ pressed }) => [
              styles.actionRow,
              activeEffect(pressed, "pressedHighlight"),
            ]}
          >
            <AppIcon icon={<Reply />} size={20} color={Colors.light.text} />
            <ThemedText type="body" style={styles.actionText}>
              Trả lời
            </ThemedText>
          </Pressable>
        ) : null}

        {message.text && !message.isRecalled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sao chép nội dung"
            onPress={() => onCopy(message)}
            style={({ pressed }) => [
              styles.actionRow,
              activeEffect(pressed, "pressedHighlight"),
            ]}
          >
            <AppIcon icon={<Copy />} size={20} color={Colors.light.text} />
            <ThemedText type="body" style={styles.actionText}>
              Sao chép
            </ThemedText>
          </Pressable>
        ) : null}

        {!message.isRecalled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chuyển tiếp tin nhắn"
            onPress={() => onForward(message)}
            style={({ pressed }) => [
              styles.actionRow,
              activeEffect(pressed, "pressedHighlight"),
            ]}
          >
            <AppIcon icon={<Forward />} size={20} color={Colors.light.text} />
            <ThemedText type="body" style={styles.actionText}>
              Chuyển tiếp
            </ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thông tin tin nhắn"
          onPress={() => onInfo(message)}
          style={({ pressed }) => [
            styles.actionRow,
            activeEffect(pressed, "pressedHighlight"),
          ]}
        >
          <AppIcon icon={<InfoCircle />} size={20} color={Colors.light.text} />
          <ThemedText type="body" style={styles.actionText}>
            Thông tin
          </ThemedText>
        </Pressable>

        {canRecall ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thu hồi tin nhắn"
            onPress={() => onRecall(message.id)}
            style={({ pressed }) => [
              styles.actionRow,
              activeEffect(pressed, "pressedHighlight"),
            ]}
          >
            <AppIcon icon={<Trash />} size={20} color={Colors.light.error} />
            <ThemedText type="body" style={styles.dangerText}>
              Thu hồi
            </ThemedText>
          </Pressable>
        ) : null}

        {canReport ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Báo cáo tin nhắn"
            onPress={() => onReport(message)}
            style={({ pressed }) => [
              styles.actionRow,
              activeEffect(pressed, "pressedHighlight"),
            ]}
          >
            <AppIcon icon={<Flag />} size={20} color={Colors.light.error} />
            <ThemedText type="body" style={styles.dangerText}>
              Báo cáo
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingBottom: 8,
  },
  reactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionButtonSelected: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  reactionEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  actionRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  actionText: {
    color: Colors.light.text,
    fontWeight: "500",
  },
  dangerText: {
    color: Colors.light.error,
    fontWeight: "600",
  },
});
