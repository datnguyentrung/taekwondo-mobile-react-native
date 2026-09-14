import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, radii } from "@/theme";

export function LogoutConfirmModal({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.modalOverlay}>
      <View
        style={styles.modalCard}
        accessibilityViewIsModal
        accessibilityRole="alert"
      >
        <ThemedText type="title" style={styles.modalTitle}>
          Bạn có chắc muốn đăng xuất?
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.modalDescription}>
          Phiên hiện tại trên thiết bị này sẽ kết thúc.
        </ThemedText>
        <View style={styles.modalActions}>
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.modalCancel,
              activeEffect(pressed, "pressed"),
            ]}
          >
            <ThemedText type="action" style={styles.modalCancelText}>
              Hủy
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.modalConfirm,
              activeEffect(pressed, "pressed"),
            ]}
          >
            <ThemedText type="action" style={styles.modalConfirmText}>
              Đăng xuất
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 23, 0.54)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: Colors.light.text,
  },
  modalDescription: {
    color: Colors.light.textSecondary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: Colors.light.text,
  },
  modalConfirm: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: Colors.light.surface,
  },
});
