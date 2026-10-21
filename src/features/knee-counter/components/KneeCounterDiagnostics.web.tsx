import { StyleSheet, View } from "react-native";

import { Colors, Spacing } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

import { Pressable } from "react-native";
import type { ComputeCapabilities, KneeTraceSample } from "../types/kneeCounter.types";

export function KneeCounterDiagnostics({ capabilities, trace = [] }: { capabilities: ComputeCapabilities | null; trace?: KneeTraceSample[] }) {
  if (!capabilities) return null;
  const latest = trace.at(-1);
  const download = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `knee-trace-${Date.now()}.json`; anchor.click(); URL.revokeObjectURL(url); };
  return <View style={styles.panel}><ThemedText type="title" style={styles.title}>Chẩn đoán</ThemedText><ThemedText type="bodySmall" style={styles.text}>Backend: {capabilities.selectedBackend ?? "Chưa chọn"} · Input: {capabilities.modelInputSize ?? "—"}</ThemedText><ThemedText type="bodySmall" style={styles.text}>WebGL: {capabilities.webglSupported ? "Có" : "Không"} · WebGPU adapter: {capabilities.webgpuAdapterAvailable ? "Có" : "Không"}</ThemedText><ThemedText type="bodySmall" style={styles.text}>GPU: {capabilities.gpuRenderer ?? "Không cung cấp bởi trình duyệt"}</ThemedText><ThemedText type="bodySmall" style={styles.text}>Trace buổi tập: {trace.length} frame{latest ? ` · gối T/P ${latest.points.leftKnee.score.toFixed(2)}/${latest.points.rightKnee.score.toFixed(2)} · ${latest.left.reason}/${latest.right.reason} · phase ${latest.left.phaseAfter}/${latest.right.phaseAfter}` : ""}</ThemedText><Pressable accessibilityRole="button" onPress={download} style={styles.export}><ThemedText type="bodySmall" style={styles.exportText}>Tải trace JSON</ThemedText></Pressable></View>;
}

const styles = StyleSheet.create({ panel: { gap: Spacing.one, padding: Spacing.three, backgroundColor: Colors.light.backgroundElement, borderRadius: 10 }, title: { color: Colors.light.text }, text: { color: Colors.light.textSecondary }, export: { alignSelf: "flex-start", marginTop: Spacing.one, paddingVertical: Spacing.one, paddingHorizontal: Spacing.two, borderRadius: 6, backgroundColor: Colors.light.primary }, exportText: { color: Colors.light.surface } });
