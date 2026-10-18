import { StyleSheet, View } from "react-native";

import { Colors, Spacing } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

import type { ComputeCapabilities } from "../types/kneeCounter.types";

export function KneeCounterDiagnostics({ capabilities }: { capabilities: ComputeCapabilities | null }) {
  if (!capabilities) return null;
  return <View style={styles.panel}><ThemedText type="title" style={styles.title}>Chẩn đoán</ThemedText><ThemedText type="bodySmall" style={styles.text}>Backend: {capabilities.selectedBackend ?? "Chưa chọn"} · Input: {capabilities.modelInputSize ?? "—"}</ThemedText><ThemedText type="bodySmall" style={styles.text}>WebGL: {capabilities.webglSupported ? "Có" : "Không"} · WebGPU adapter: {capabilities.webgpuAdapterAvailable ? "Có" : "Không"}</ThemedText><ThemedText type="bodySmall" style={styles.text}>GPU: {capabilities.gpuRenderer ?? "Không cung cấp bởi trình duyệt"}</ThemedText><ThemedText type="bodySmall" style={styles.text}>CUDA: Không thể xác minh trong browser</ThemedText></View>;
}

const styles = StyleSheet.create({ panel: { gap: Spacing.one, padding: Spacing.three, backgroundColor: Colors.light.backgroundElement, borderRadius: 10 }, title: { color: Colors.light.text }, text: { color: Colors.light.textSecondary } });
