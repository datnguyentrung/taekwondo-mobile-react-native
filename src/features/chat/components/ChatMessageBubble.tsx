import { Image, Pressable, StyleSheet, View } from "react-native";
import { AlertCircle } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, effects, hexToRgba, radii } from "@/theme";

import type { ChatMessage, ChatRenderItem } from "../domain/chat.types";

const TBOT_AVATAR = require("../../../../assets/images/chibi/avatar-chatbot.png");

type ChatMessageBubbleProps = {
  item: ChatRenderItem;
  peerName: string;
  isTimestampExpanded: boolean;
  onToggleTimestamp: (messageId: string) => void;
  onLongPress: (message: ChatMessage) => void;
  onRetry: (clientMessageId: string) => void;
};

export function ChatMessageBubble({
  item,
  peerName,
  isTimestampExpanded,
  onToggleTimestamp,
  onLongPress,
  onRetry,
}: ChatMessageBubbleProps) {
  const { message, isClusterStart, isClusterEnd, showTimeSeparator, receipt } =
    item;
  const isUser = message.sender === "user";
  const reactions = message.reactions ?? [];

  return (
    <View style={[styles.wrapper, isClusterEnd ? styles.clusterEndGap : styles.inClusterGap]}>
      {showTimeSeparator ? (
        <View style={styles.timeSeparator}>
          <ThemedText type="caption" style={styles.timeSeparatorText}>
            {message.timestamp}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.row, isUser ? styles.userRow : styles.peerRow]}>
        {!isUser ? (
          isClusterStart ? (
            <Image
              source={TBOT_AVATAR}
              style={styles.peerAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.peerAvatarSpacer} />
          )
        ) : null}

        <View
          style={[
            styles.bubbleColumn,
            isUser ? styles.userColumn : styles.peerColumn,
          ]}
        >
          {!isUser && isClusterStart ? (
            <ThemedText type="caption" style={styles.peerName}>
              {peerName}
            </ThemedText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Tin nhắn từ ${isUser ? "bạn" : peerName}: ${message.text}`}
            accessibilityHint="Chạm để xem giờ gửi hoặc nhấn giữ để mở tùy chọn"
            onPress={() => onToggleTimestamp(message.id)}
            onLongPress={() => onLongPress(message)}
            delayLongPress={260}
            style={({ pressed }) => [
              styles.bubbleWrap,
              activeEffect(pressed, "pressed"),
            ]}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.peerBubble,
                isUser
                  ? {
                      borderTopRightRadius: isClusterStart ? radii.xl : radii.sm,
                      borderBottomRightRadius: isClusterEnd ? radii.xl : radii.sm,
                    }
                  : {
                      borderTopLeftRadius: isClusterStart ? radii.xl : radii.sm,
                      borderBottomLeftRadius: isClusterEnd ? radii.xl : radii.sm,
                    },
                message.isRecalled ? styles.recalledBubble : null,
              ]}
            >
              {message.replyTo && !message.isRecalled ? (
                <View
                  style={[
                    styles.replyBox,
                    isUser ? styles.userReplyBox : styles.peerReplyBox,
                  ]}
                >
                  <ThemedText
                    type="caption"
                    numberOfLines={1}
                    style={[
                      styles.replySender,
                      isUser ? styles.userReplyText : null,
                    ]}
                  >
                    {message.replyTo.senderName}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    numberOfLines={1}
                    style={[
                      styles.replySnippet,
                      isUser ? styles.userReplyText : null,
                    ]}
                  >
                    {message.replyTo.snippet}
                  </ThemedText>
                </View>
              ) : null}

              {message.imageUri && !message.isRecalled ? (
                <Image
                  source={{ uri: message.imageUri }}
                  style={styles.attachedImage}
                  resizeMode="cover"
                />
              ) : null}

              {message.text ? (
                <ThemedText
                  type="bodySmall"
                  style={[
                    isUser ? styles.userText : styles.peerText,
                    message.isRecalled ? styles.recalledText : null,
                  ]}
                >
                  {message.text}
                </ThemedText>
              ) : null}
            </View>

            {reactions.length > 0 ? (
              <View
                style={[
                  styles.reactionPill,
                  isUser ? styles.userReactionPill : styles.peerReactionPill,
                ]}
              >
                <ThemedText type="caption" style={styles.reactionText}>
                  {reactions.join(" ")}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>

          {isTimestampExpanded || receipt ? (
            <View
              style={[
                styles.metaRow,
                isUser ? styles.userMetaRow : styles.peerMetaRow,
                reactions.length > 0 ? styles.metaWithReactions : null,
              ]}
            >
              {isTimestampExpanded ? (
                <ThemedText type="caption" style={styles.timestamp}>
                  {message.timestamp}
                </ThemedText>
              ) : null}

              {receipt ? (
                receipt.isError ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Không gửi được, chạm để thử lại"
                    onPress={() => onRetry(message.clientMessageId)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.retryButton,
                      activeEffect(pressed, "pressed"),
                    ]}
                  >
                    <AppIcon
                      icon={<AlertCircle />}
                      size={13}
                      color={Colors.light.error}
                    />
                    <ThemedText type="caption" style={styles.errorText}>
                      {receipt.label}
                    </ThemedText>
                  </Pressable>
                ) : (
                  <ThemedText type="caption" style={styles.statusText}>
                    {receipt.label}
                  </ThemedText>
                )
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  inClusterGap: {
    marginBottom: 4,
  },
  clusterEndGap: {
    marginBottom: 14,
  },
  timeSeparator: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  timeSeparatorText: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  peerRow: {
    justifyContent: "flex-start",
  },
  peerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginTop: 18,
    backgroundColor: Colors.light.backgroundElement,
  },
  peerAvatarSpacer: {
    width: 34,
  },
  bubbleColumn: {
    maxWidth: "74%",
    gap: 3,
  },
  userColumn: {
    alignItems: "flex-end",
  },
  peerColumn: {
    alignItems: "flex-start",
  },
  peerName: {
    color: Colors.light.text,
    fontWeight: "700",
    marginLeft: 2,
  },
  bubbleWrap: {
    position: "relative",
  },
  bubble: {
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
  },
  peerBubble: {
    backgroundColor: "#EFEFF2",
  },
  recalledBubble: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
  },
  userText: {
    color: Colors.light.surface,
    lineHeight: 20,
  },
  peerText: {
    color: Colors.light.text,
    lineHeight: 20,
  },
  recalledText: {
    color: Colors.light.textSecondary,
    fontStyle: "italic",
  },
  replyBox: {
    borderLeftWidth: 2.5,
    paddingLeft: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  userReplyBox: {
    borderLeftColor: hexToRgba(Colors.light.surface, 0.75),
    backgroundColor: hexToRgba(Colors.light.surface, 0.14),
    paddingRight: 8,
  },
  peerReplyBox: {
    borderLeftColor: Colors.light.primary,
    backgroundColor: hexToRgba(Colors.light.primary, 0.06),
    paddingRight: 8,
  },
  replySender: {
    fontWeight: "700",
    color: Colors.light.primary,
  },
  replySnippet: {
    color: Colors.light.textSecondary,
  },
  userReplyText: {
    color: Colors.light.surface,
  },
  attachedImage: {
    width: 196,
    height: 148,
    borderRadius: radii.md,
  },
  reactionPill: {
    position: "absolute",
    bottom: -10,
    backgroundColor: Colors.light.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    ...effects.soft,
  },
  userReactionPill: {
    left: 10,
  },
  peerReactionPill: {
    right: 10,
  },
  reactionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaWithReactions: {
    marginTop: 10,
  },
  userMetaRow: {
    justifyContent: "flex-end",
  },
  peerMetaRow: {
    justifyContent: "flex-start",
    marginLeft: 2,
  },
  timestamp: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  statusText: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 11,
    fontWeight: "600",
  },
});
