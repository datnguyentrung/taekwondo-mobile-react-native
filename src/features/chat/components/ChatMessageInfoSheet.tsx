import { StyleSheet, View } from "react-native";

import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

import type { ChatMessage } from "../domain/chat.types";
import { formatChatTime } from "../domain/tbotResponder";

type ChatMessageInfoSheetProps = {
  message: ChatMessage | null;
  onClose: () => void;
};

function formatEpochTime(epochMs?: number): string {
  if (!epochMs) return "—";
  return formatChatTime(new Date(epochMs));
}

export function ChatMessageInfoSheet({
  message,
  onClose,
}: ChatMessageInfoSheetProps) {
  if (!message) return null;

  const isUser = message.sender === "user";
  const sentLabel = message.serverAcceptedAt
    ? formatEpochTime(message.serverAcceptedAt)
    : message.status === "FAILED"
      ? "Gửi thất bại"
      : "Đang gửi…";

  const deliveredLabel = message.deliveredAt
    ? formatEpochTime(message.deliveredAt)
    : isUser
      ? "Chưa nhận"
      : formatEpochTime(message.createdAt);

  const readLabel = message.readAt
    ? formatEpochTime(message.readAt)
    : "Chưa xem";

  return (
    <BottomSheetWindow
      visible={Boolean(message)}
      title="Thông tin tin nhắn"
      onClose={onClose}
    >
      <View style={styles.content}>
        <View style={styles.previewCard}>
          <ThemedText
            type="bodySmall"
            numberOfLines={3}
            style={styles.previewText}
          >
            {message.text || (message.imageUri ? "[Hình ảnh]" : "Tin nhắn")}
          </ThemedText>
        </View>

        <View style={styles.sectionList}>
          <InfoRow label="ĐÃ XEM" value={readLabel} />
          <View style={styles.divider} />
          <InfoRow label="ĐÃ NHẬN" value={deliveredLabel} />
          <View style={styles.divider} />
          <InfoRow label="ĐÃ GỬI" value={sentLabel} />
        </View>
      </View>
    </BottomSheetWindow>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="caption" style={styles.infoLabel}>
        {label}
      </ThemedText>
      <ThemedText type="bodySmall" style={styles.infoValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 8,
  },
  previewCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
  },
  previewText: {
    color: Colors.light.text,
  },
  sectionList: {
    backgroundColor: Colors.light.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  infoLabel: {
    color: Colors.light.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  infoValue: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
  },
});
