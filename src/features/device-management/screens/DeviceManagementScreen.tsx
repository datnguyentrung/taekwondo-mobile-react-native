import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, Spacing, radii } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Plus, Wifi, WifiOff } from "reicon-react-native";
import { usePermissions } from '@/features/authorization';
import { Permission } from '@/features/authorization/domain/permissions';
import { DeviceProvisioningSheet } from '../components/DeviceProvisioningSheet';
import { FogRuntimeConfigSheet } from '../components/FogRuntimeConfigSheet';
import { deviceApi } from "../api/deviceApi";
import type { ManagedDevice } from "../domain/device.types";

const queryKey = ["managed-devices"];
export function DeviceManagementScreen() {
  const [tab, setTab] = useState<"devices" | "alerts">("devices");
  const [createVisible, setCreateVisible] = useState(false);
  const [configuredFog, setConfiguredFog] = useState<ManagedDevice | null>(null);
  const permissions = usePermissions();
  const canCreate = permissions?.includes(Permission.DEVICE_CREATE) ?? false;
  const client = useQueryClient();
  const devices = useQuery({ queryKey, queryFn: deviceApi.list });
  const events = useQuery({ queryKey: ["device-events"], queryFn: deviceApi.events, enabled: tab === "alerts" });
  const activate = useMutation({
    mutationFn: (device: ManagedDevice) =>
      deviceApi.lifecycle(
        device.deviceId,
        device.lifecycleStatus === "ACTIVE" ? "MAINTENANCE" : "ACTIVE",
      ),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const summary = useMemo(() => {
    const all = devices.data ?? [];
    return {
      total: all.length,
      online: all.filter((d) => d.connectivity === "ONLINE").length,
      offline: all.filter((d) => d.connectivity === "OFFLINE").length,
      attention: all.filter(
        (d) => d.lifecycleStatus === "MAINTENANCE" || d.lastHealth === "FAULT",
      ).length,
    };
  }, [devices.data]);
  return (
    <StackScreenLayout
      title="Thiết bị & cảnh báo"
      refreshing={devices.isRefetching}
      onRefresh={async () => {
        await devices.refetch();
      }}
      rightActions={canCreate ? [<Pressable key="create-device" accessibilityRole="button" accessibilityLabel="Đăng ký thiết bị" hitSlop={8} onPress={() => setCreateVisible(true)} style={styles.createButton}><AppIcon icon={<Plus />} size={22} color={Colors.light.surface} /></Pressable>] : []}
    >
      <View style={styles.summary}>
        {Object.entries(summary).map(([label, value]) => (
          <View key={label} style={styles.metric}>
            <ThemedText type="heading">{value}</ThemedText>
            <ThemedText type="caption" style={styles.muted}>
              {label === "total"
                ? "Tổng thiết bị"
                : label === "online"
                  ? "Đang online"
                  : label === "offline"
                    ? "Offline"
                    : "Cần chú ý"}
            </ThemedText>
          </View>
        ))}
      </View>
      <View style={styles.tabs}>
        {(["devices", "alerts"] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setTab(value)}
            style={[styles.tab, tab === value && styles.tabActive]}
          >
            <ThemedText
              type="title"
              style={tab === value ? styles.tabTextActive : styles.muted}
            >
              {value === "devices" ? "Thiết bị" : "Cảnh báo"}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {tab === "devices" ? (
        <View style={styles.list}>
          {devices.isLoading ? (
            <ThemedText>Đang tải thiết bị…</ThemedText>
          ) : devices.isError ? (
            <ThemedText>Không thể tải thiết bị. Kéo để thử lại.</ThemedText>
          ) : (
            devices.data?.map((device) => (
              <View key={device.deviceId} style={styles.card}>
              <Pressable
                accessibilityRole="button"
                onPress={() => activate.mutate(device)}
              >
                <View style={styles.row}>
                  <AppIcon
                    icon={
                      device.connectivity === "ONLINE" ? <Wifi /> : <WifiOff />
                    }
                    color={
                      device.connectivity === "ONLINE"
                        ? Colors.light.success
                        : Colors.light.primary
                    }
                  />
                  <View style={styles.grow}>
                    <ThemedText type="title">{device.displayName}</ThemedText>
                    <ThemedText type="bodySmall" style={styles.muted}>
                      {device.deviceCode} · {device.deviceType}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={styles.status}>
                    {device.connectivity}
                  </ThemedText>
                </View>
                <ThemedText type="bodySmall" style={styles.muted}>
                  {device.lifecycleStatus} ·{" "}
                  {device.locationLabel ?? "Chưa gán vị trí"} ·{" "}
                  {device.firmwareVersion ?? "Chưa báo firmware"}
                </ThemedText>
              </Pressable>
              {device.deviceType === 'FOG_GATEWAY' && canCreate ? <Pressable accessibilityRole="button" accessibilityLabel={`Cấu hình kết nối ${device.displayName}`} onPress={() => setConfiguredFog(device)} style={styles.configureButton}><ThemedText type="bodySmall" style={styles.configureText}>Cấu hình kết nối</ThemedText></Pressable> : null}
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {events.isLoading ? <ThemedText>Đang tải cảnh báo…</ThemedText> : null}
          {events.isError ? <ThemedText>Không thể tải cảnh báo. Kéo để thử lại.</ThemedText> : null}
          {!events.isLoading && !events.isError && !events.data?.length ? (
            <View style={styles.empty}><ThemedText type="title">Chưa có cảnh báo</ThemedText><ThemedText style={styles.muted}>Cảnh báo offline xuất hiện sau 120 giây mất heartbeat.</ThemedText></View>
          ) : null}
          {events.data?.map((event) => (
            <View key={event.deviceEventId} style={styles.card}>
              <ThemedText type="title">{event.eventCode}</ThemedText>
              <ThemedText style={styles.muted}>{event.message}</ThemedText>
              <ThemedText type="caption" style={styles.status}>{event.alertStatus ?? event.eventKind} · {new Date(event.occurredAt).toLocaleString()}</ThemedText>
            </View>
          ))}
        </View>
      )}
      <DeviceProvisioningSheet visible={createVisible} devices={devices.data ?? []} onClose={() => setCreateVisible(false)} onCreated={() => { void client.invalidateQueries({ queryKey }); }} />
      <FogRuntimeConfigSheet device={configuredFog} onClose={() => setConfiguredFog(null)} onSaved={() => { void client.invalidateQueries({ queryKey }); }} />
    </StackScreenLayout>
  );
}
const styles = StyleSheet.create({
  summary: { flexDirection: "row", gap: Spacing.two },
  metric: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    padding: Spacing.two,
    gap: 4,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: Colors.light.divider,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: Spacing.two },
  tabActive: { borderBottomWidth: 2, borderColor: Colors.light.primary },
  tabTextActive: { color: Colors.light.primary },
  list: { gap: Spacing.two },
  card: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  grow: { flex: 1 },
  muted: { color: Colors.light.textSecondary },
  status: { color: Colors.light.primary },
  createButton: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary },
  configureButton: { alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: Spacing.two, justifyContent: 'center', borderRadius: radii.sm, backgroundColor: Colors.light.backgroundElement },
  configureText: { color: Colors.light.primary, fontWeight: '700' },
  empty: {
    backgroundColor: Colors.light.surface,
    borderRadius: radii.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
