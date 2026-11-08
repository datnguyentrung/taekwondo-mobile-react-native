import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Colors, radii } from "@/theme";

import { ThemedText } from "./ThemedText";

export function InfiniteListFooter({
  hasItems,
  isLoading,
  isError,
  onRetry,
}: {
  hasItems: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (!hasItems) return null;
  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator color={Colors.light.primary} /></View>;
  }
  if (!isError) return <View style={styles.spacer} />;
  return (
    <View style={styles.container}>
      <ThemedText type="bodySmall" style={styles.error}>Không thể tải thêm dữ liệu.</ThemedText>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <ThemedText type="action" style={styles.retryText}>Thử lại</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 8, paddingVertical: 18 },
  spacer: { height: 8 },
  error: { color: Colors.light.textSecondary },
  retry: { borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Colors.light.primary },
  retryText: { color: Colors.light.surface },
});
