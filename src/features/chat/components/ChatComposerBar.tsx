import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { CloseCircle, Gallery, Send, Sparkle } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, hexToRgba, radii, typography } from "@/theme";

import type { ChatReplyPreview } from "../domain/chat.types";

type ChatComposerBarProps = {
  peerName: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onToggleQuickActions: () => void;
  showQuickActions: boolean;
  pendingImageUri: string | null;
  onClearPendingImage: () => void;
  replyingTo: ChatReplyPreview | null;
  onCancelReply: () => void;
};

export function ChatComposerBar({
  peerName,
  value,
  onChangeText,
  onSend,
  onPickImage,
  onToggleQuickActions,
  showQuickActions,
  pendingImageUri,
  onClearPendingImage,
  replyingTo,
  onCancelReply,
}: ChatComposerBarProps) {
  const canSend = value.trim().length > 0 || Boolean(pendingImageUri);

  return (
    <View style={styles.container}>
      {replyingTo ? (
        <View style={styles.previewBanner}>
          <View style={styles.replyAccent} />
          <View style={styles.previewTextWrap}>
            <ThemedText type="caption" style={styles.previewTitle}>
              Đang trả lời {replyingTo.senderName}
            </ThemedText>
            <ThemedText
              type="caption"
              numberOfLines={1}
              style={styles.previewSubtitle}
            >
              {replyingTo.snippet}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hủy trả lời"
            hitSlop={8}
            onPress={onCancelReply}
          >
            <AppIcon
              icon={<CloseCircle />}
              size={20}
              color={Colors.light.textSecondary}
            />
          </Pressable>
        </View>
      ) : null}

      {pendingImageUri ? (
        <View style={styles.imagePreviewRow}>
          <View style={styles.imagePreviewWrap}>
            <Image
              source={{ uri: pendingImageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bỏ ảnh đính kèm"
              onPress={onClearPendingImage}
              style={styles.removeImageButton}
            >
              <AppIcon
                icon={<CloseCircle weight="Filled" />}
                size={20}
                color={Colors.light.primary}
              />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showQuickActions ? "Ẩn gợi ý nhanh" : "Hiện gợi ý nhanh"
          }
          onPress={onToggleQuickActions}
          style={({ pressed }) => [
            styles.sparkleButton,
            showQuickActions ? styles.sparkleButtonActive : null,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon icon={<Sparkle />} size={20} color={Colors.light.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đính kèm hình ảnh"
          onPress={onPickImage}
          style={({ pressed }) => [
            styles.attachButton,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon
            icon={<Gallery />}
            size={20}
            color={Colors.light.textSecondary}
          />
        </Pressable>

        <View style={styles.inputBox}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={`Hỏi ${peerName} bất cứ điều gì...`}
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={onSend}
            style={styles.input}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi tin nhắn"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={onSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend ? styles.sendButtonDisabled : null,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon icon={<Send />} size={20} color={Colors.light.surface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.divider,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  replyAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  previewTextWrap: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  previewSubtitle: {
    color: Colors.light.textSecondary,
  },
  imagePreviewRow: {
    flexDirection: "row",
  },
  imagePreviewWrap: {
    position: "relative",
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sparkleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleButtonActive: {
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.primary, 0.28),
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBox: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: radii.pill,
    backgroundColor: "#F2F3F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
  },
  input: {
    color: Colors.light.text,
    paddingVertical: 0,
    ...typography.bodySmall,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
