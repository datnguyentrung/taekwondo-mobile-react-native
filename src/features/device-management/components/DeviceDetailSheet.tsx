import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Refresh, Trash6 } from 'reicon-react-native';

import { Permission, usePermissions } from '@/features/authorization';
import { mqttClient } from '@/infrastructure/mqtt/mqttClient';
import { ConfirmationDialog } from '@/shared/ui/ConfirmationDialog';
import { FloatingActionBar } from '@/shared/ui/FloatingActionBar';
import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { useToast } from '@/shared/ui/Toast';
import { Colors, Spacing, typography } from '@/theme';

import { deviceApi } from '../api/deviceApi';
import { deviceProvisioningStorage } from '../services/deviceProvisioningStorage';

type Props = { deviceId: string | null; onClose: () => void };
const queryKey = (id: string) => ['managed-device', id] as const;

export function DeviceDetailSheet({ deviceId, onClose }: Props) {
  const permissions = usePermissions();
  const canUpdate = permissions?.includes(Permission.DEVICE_UPDATE) ?? false;
  const canDelete = permissions?.includes(Permission.DEVICE_DELETE) ?? false;
  const client = useQueryClient();
  const toast = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const detail = useQuery({ queryKey: queryKey(deviceId ?? ''), queryFn: () => deviceApi.get(deviceId as string), enabled: Boolean(deviceId) });
  const remove = async () => {
    if (!detail.data) return;
    try {
      const profile = await deviceProvisioningStorage.read();
      await deviceApi.remove(detail.data.deviceId);
      if (profile?.deviceCode === detail.data.deviceCode) {
        await deviceProvisioningStorage.clear();
        mqttClient.disconnect();
      }
      await client.invalidateQueries({ queryKey: ['managed-devices'] });
      await client.invalidateQueries({ queryKey: ['device-events'] });
      toast.show({ message: 'Đã xóa thiết bị', variant: 'success' });
      setConfirmingDelete(false); onClose();
    } catch {
      toast.show({ message: 'Không thể xóa: hãy xử lý các thiết bị đang liên kết trước.', variant: 'error' });
      setConfirmingDelete(false);
    }
  };
  const device = detail.data;
  return <BottomSheetWindow visible={Boolean(deviceId)} title="Thông tin thiết bị" onClose={onClose}
    footer={<FloatingActionBar placement="sheet" actions={[
      { key: 'refresh', label: 'Làm mới', variant: 'outline', loading: detail.isFetching, disabled: detail.isFetching, icon: <Refresh />, onPress: () => void detail.refetch() },
      ...(canUpdate ? [{ key: 'edit', label: 'Chỉnh sửa', variant: 'primary' as const, onPress: () => { if (device) { onClose(); router.push(`/admin/devices/${device.deviceId}/edit` as Href); } } }] : []),
      ...(canDelete ? [{ key: 'delete', label: '', variant: 'ghost' as const, icon: <Trash6 />, accessibilityLabel: 'Xóa thiết bị', flex: 0, onPress: () => setConfirmingDelete(true) }] : []),
    ]} />}
    overlay={<ConfirmationDialog presentation="inline" visible={confirmingDelete} title="Xóa thiết bị?" description="Thiết bị và lịch sử cảnh báo liên quan sẽ bị xóa vĩnh viễn." confirmLabel="Xóa" confirmVariant="danger" pending={false} onCancel={() => setConfirmingDelete(false)} onConfirm={() => void remove()} />}
  >
    {detail.isLoading ? <View style={styles.state}><ActivityIndicator color={Colors.light.primary} /><ThemedText>Đang tải thông tin thiết bị…</ThemedText></View> : null}
    {detail.isError ? <ThemedText style={styles.error}>Không thể tải thông tin. Nhấn Làm mới để thử lại.</ThemedText> : null}
    {device ? <View style={styles.content}>
      <Info label="Mã / loại" value={`${device.deviceCode} · ${device.deviceType}`} />
      <Info label="Trạng thái" value={`${device.lifecycleStatus} · ${device.connectivity} · ${device.lastHealth}`} />
      <Info label="Cơ sở" value={device.branchId ? `Branch #${device.branchId}` : 'Chưa gán'} />
      <Info label="Vị trí" value={[device.groupCode, device.areaLabel, device.locationLabel].filter(Boolean).join(' · ') || 'Chưa gán'} />
      <Info label="Phiên bản" value={`${device.hardwareVersion ?? 'Chưa báo hardware'} · ${device.firmwareVersion ?? 'Chưa báo firmware'}`} />
      <Info label="Heartbeat gần nhất" value={device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Chưa từng nhận'} />
      <Info label="Cấu hình" value={`v${device.desiredConfigVersion}`} />
    </View> : null}
  </BottomSheetWindow>;
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><ThemedText type="bodySmall" style={styles.label}>{label}</ThemedText><ThemedText type="bodySmall">{value}</ThemedText></View>; }
const styles = StyleSheet.create({ content: { gap: Spacing.two, paddingBottom: Spacing.three }, info: { gap: Spacing.one }, label: { color: Colors.light.textSecondary, ...typography.bodySmall }, state: { minHeight: 120, justifyContent: 'center', alignItems: 'center', gap: Spacing.two }, error: { color: Colors.light.error, ...typography.bodySmall } });
