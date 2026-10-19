import { Pressable, StyleSheet, View } from "react-native";

import { Colors, Spacing, radii } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";
import type { KneeCounterProfile, KneeCounterSessionConfig } from "../types/kneeCounter.types";

type AnalysisSettingsProps = {
  config: KneeCounterSessionConfig;
  backendOptions: string[];
  cameraLabels?: string[];
  selectedCameraId?: string;
  expanded: boolean;
  onToggle: () => void;
  onConfigChange: (patch: Partial<KneeCounterSessionConfig>) => void;
  onCameraChange?: (deviceId: string) => void;
};

export function AnalysisSettings({ config, backendOptions, cameraLabels = [], selectedCameraId, expanded, onToggle, onConfigChange, onCameraChange }: AnalysisSettingsProps) {
  return <View style={styles.panel}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
      <View><ThemedText type="title" style={styles.title}>Cài đặt phân tích</ThemedText><ThemedText type="caption" style={styles.summary}>{config.participantCount} người · ngưỡng {config.thresholdPercent}% · {config.profile}</ThemedText></View>
      <ThemedText type="title" style={styles.chevron}>{expanded ? "⌃" : "⌄"}</ThemedText>
    </Pressable>
    {expanded ? <View style={styles.body}>
      <ControlGroup title="Số người"><OptionRow values={[2, 3, 4, 5, 6].map(String)} selected={String(config.participantCount)} onSelect={(value) => onConfigChange({ participantCount: Number(value) })} /></ControlGroup>
      <ControlGroup title={`Ngưỡng gối: ${config.thresholdPercent}%`}><OptionRow values={[-30, -20, -10, 0, 10, 20, 30].map((value) => `${value}%`)} selected={`${config.thresholdPercent}%`} onSelect={(value) => onConfigChange({ thresholdPercent: Number.parseInt(value, 10) })} /></ControlGroup>
      <ControlGroup title="Backend"><OptionRow values={["Tự động", ...backendOptions]} selected={config.backendPreference === "auto" ? "Tự động" : config.backendPreference} onSelect={(value) => onConfigChange({ backendPreference: value === "Tự động" ? "auto" : value as KneeCounterSessionConfig["backendPreference"] })} /></ControlGroup>
      <ControlGroup title="Profile"><OptionRow values={["performance", "balanced", "quality"]} selected={config.profile} onSelect={(value) => onConfigChange({ profile: value as KneeCounterProfile })} /></ControlGroup>
      <ControlGroup title="Chế độ đếm"><OptionRow values={["Cá nhân", "Nhóm đạt", "Đồng bộ"]} selected={config.mode === "individual" ? "Cá nhân" : config.mode === "current-group-pass" ? "Nhóm đạt" : "Đồng bộ"} onSelect={(value) => onConfigChange({ mode: value === "Cá nhân" ? "individual" : value === "Nhóm đạt" ? "current-group-pass" : "synchronized-group" })} /></ControlGroup>
      {cameraLabels.length > 1 ? <ControlGroup title="Camera"><OptionRow values={cameraLabels} selected={cameraLabels[cameraLabels.findIndex((label) => label === selectedCameraId)] ?? cameraLabels[0]} onSelect={(value) => onCameraChange?.(value)} /></ControlGroup> : null}
    </View> : null}
  </View>;
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.group}><ThemedText type="bodySmall" style={styles.groupTitle}>{title}</ThemedText>{children}</View>; }
function OptionRow({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.options}>{values.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === selected }} onPress={() => onSelect(value)} style={({ pressed }) => [styles.option, value === selected && styles.optionSelected, pressed && styles.pressed]}><ThemedText type="bodySmall" style={value === selected ? styles.optionSelectedText : styles.optionText}>{value}</ThemedText></Pressable>)}</View>; }

const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.light.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.light.divider, overflow: "hidden" },
  header: { minHeight: 64, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two },
  title: { color: Colors.light.text }, summary: { color: Colors.light.textSecondary, marginTop: 2 }, chevron: { color: Colors.light.primary, fontSize: 22 },
  body: { gap: Spacing.three, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.divider },
  group: { gap: Spacing.one }, groupTitle: { color: Colors.light.text, fontWeight: "600" }, options: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  option: { minHeight: 40, flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.two, borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider }, optionSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, optionText: { color: Colors.light.textSecondary }, optionSelectedText: { color: Colors.light.surface }, pressed: { opacity: 0.78 },
});
