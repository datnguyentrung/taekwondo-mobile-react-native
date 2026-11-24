import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { InfoCircle } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba } from "@/theme";

type SupportRequestTab = "processing" | "completed";

const REQUEST_TABS: readonly { value: SupportRequestTab; label: string }[] = [
  { value: "processing", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn thành" },
];

export function SupportRequestsSection() {
  const [tab, setTab] = useState<SupportRequestTab>("processing");

  return (
    <View style={styles.container}>
      <SegmentedControl value={tab} options={REQUEST_TABS} onChange={setTab} />

      <View style={styles.emptyState}>
        <View style={styles.emptyIconBox}>
          <AppIcon
            icon={<InfoCircle />}
            size={42}
            color={hexToRgba(Colors.light.textSecondary, 0.55)}
          />
        </View>
        <ThemedText type="bodySmall" style={styles.emptyText}>
          {tab === "processing"
            ? "Không có yêu cầu cần xử lý"
            : "Chưa có yêu cầu đã hoàn thành"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
