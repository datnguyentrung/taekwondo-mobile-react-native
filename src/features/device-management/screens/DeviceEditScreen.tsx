import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { branchApi } from '@/features/branch/api/branchApi';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { CancellableLoadingOverlay } from '@/shared/ui/CancellableLoadingOverlay';
import { ConfirmationDialog } from '@/shared/ui/ConfirmationDialog';
import { FloatingActionBar } from '@/shared/ui/FloatingActionBar';
import { ThemedText } from '@/shared/ui/ThemedText';
import { useToast } from '@/shared/ui/Toast';
import { Colors, radii, Spacing, typography } from '@/theme';

import { deviceApi } from '../api/deviceApi';
import type { ManagedDevice } from '../domain/device.types';

export function DeviceEditScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const toast = useToast(); const client = useQueryClient();
  const device = useQuery({ queryKey: ['managed-device', deviceId], queryFn: () => deviceApi.get(deviceId), enabled: Boolean(deviceId) });
  const devices = useQuery({ queryKey: ['managed-devices'], queryFn: deviceApi.list });
  const branches = useQuery({ queryKey: ['branches', 'device-edit'], queryFn: () => branchApi.list({ size: 100 }) });
  const [draft, setDraft] = useState({ displayName: '', branchId: '', groupCode: '', areaLabel: '', locationLabel: '', fogGatewayId: '', pairedKioskId: '' });
  const [confirmLock, setConfirmLock] = useState(false);
  useEffect(() => { if (device.data) setDraft({ displayName: device.data.displayName, branchId: device.data.branchId?.toString() ?? '', groupCode: device.data.groupCode ?? '', areaLabel: device.data.areaLabel ?? '', locationLabel: device.data.locationLabel ?? '', fogGatewayId: device.data.fogGatewayId ?? '', pairedKioskId: device.data.pairedKioskId ?? '' }); }, [device.data]);
  const gateways = useMemo(() => (devices.data ?? []).filter((item) => item.deviceType === 'FOG_GATEWAY'), [devices.data]);
  const kiosks = useMemo(() => (devices.data ?? []).filter((item) => item.deviceType === 'KIOSK' && item.fogGatewayId === draft.fogGatewayId), [devices.data, draft.fogGatewayId]);
  const save = useMutation({ mutationFn: () => deviceApi.update(deviceId, { displayName: draft.displayName.trim(), branchId: draft.branchId ? Number(draft.branchId) : null, groupCode: draft.groupCode || null, areaLabel: draft.areaLabel || null, locationLabel: draft.locationLabel || null, fogGatewayId: draft.fogGatewayId || null, pairedKioskId: draft.pairedKioskId || null }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['managed-devices'] }); await client.invalidateQueries({ queryKey: ['managed-device', deviceId] }); toast.show({ message: 'Đã cập nhật thiết bị', variant: 'success' }); router.back(); }, onError: () => toast.show({ message: 'Không thể lưu: kiểm tra branch và quan hệ ghép nối.', variant: 'error' }) });
  const lifecycle = useMutation({ mutationFn: (targetStatus: string) => deviceApi.lifecycle(deviceId, targetStatus), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['managed-devices'] }); await client.invalidateQueries({ queryKey: ['managed-device', deviceId] }); setConfirmLock(false); toast.show({ message: 'Đã cập nhật trạng thái kết nối', variant: 'success' }); }, onError: () => toast.show({ message: 'Không thể thay đổi trạng thái thiết bị', variant: 'error' }) });
  const current = device.data;
  const isFog = current?.deviceType === 'FOG_GATEWAY'; const isEsp = current?.deviceType === 'ESP32';
  const valid = Boolean(draft.displayName.trim() && (isFog || (draft.branchId && draft.fogGatewayId)) && (!isEsp || draft.pairedKioskId));
  if (device.isLoading) return <StackScreenLayout title="Chỉnh sửa thiết bị"><ThemedText>Đang tải thiết bị…</ThemedText></StackScreenLayout>;
  if (!current) return <StackScreenLayout title="Chỉnh sửa thiết bị"><ThemedText>Không tìm thấy thiết bị.</ThemedText></StackScreenLayout>;
  const target = current.lifecycleStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
  return <StackScreenLayout title="Chỉnh sửa thiết bị" floatingContent={<FloatingActionBar actions={[{ key: 'lock', label: target === 'SUSPENDED' ? 'Khóa' : 'Mở khóa', variant: 'outline', onPress: () => setConfirmLock(true) }, { key: 'save', label: 'Lưu thay đổi', disabled: !valid || save.isPending, loading: save.isPending, onPress: () => save.mutate() }]} />} contentContainerStyle={styles.page}>
    <ThemedText type="bodySmall" style={styles.muted}>{current.deviceCode} · {current.deviceType}. Mã và loại thiết bị không thể thay đổi.</ThemedText>
    <Field label="Tên thiết bị" value={draft.displayName} onChangeText={(value) => setDraft({ ...draft, displayName: value })} />
    {!isFog ? <Selector label="Cơ sở" items={(branches.data?.content ?? []).map((b) => ({ id: b.branchId.toString(), label: b.name }))} selected={draft.branchId} onSelect={(branchId) => setDraft({ ...draft, branchId })} /> : null}
    {!isFog ? <Selector label="Fog Gateway" items={gateways.map((item) => ({ id: item.deviceId, label: `${item.displayName} · ${item.deviceCode}` }))} selected={draft.fogGatewayId} onSelect={(fogGatewayId) => setDraft({ ...draft, fogGatewayId, pairedKioskId: '' })} /> : null}
    {isEsp ? <Selector label="Kiosk nhận lệnh" items={kiosks.map((item) => ({ id: item.deviceId, label: `${item.displayName} · ${item.deviceCode}` }))} selected={draft.pairedKioskId} onSelect={(pairedKioskId) => setDraft({ ...draft, pairedKioskId })} /> : null}
    <Field label="Nhóm" value={draft.groupCode} onChangeText={(groupCode) => setDraft({ ...draft, groupCode })} />
    <Field label="Khu vực" value={draft.areaLabel} onChangeText={(areaLabel) => setDraft({ ...draft, areaLabel })} />
    <Field label="Vị trí" value={draft.locationLabel} onChangeText={(locationLabel) => setDraft({ ...draft, locationLabel })} />
    <ConfirmationDialog visible={confirmLock} title={target === 'SUSPENDED' ? 'Khóa thiết bị?' : 'Mở khóa thiết bị?'} description={target === 'SUSPENDED' ? 'Thiết bị sẽ bị ngắt kết nối MQTT sau lần Fog đồng bộ kế tiếp.' : 'Thiết bị sẽ được phép kết nối lại bằng credential hiện tại.'} confirmLabel={target === 'SUSPENDED' ? 'Khóa' : 'Mở khóa'} confirmVariant={target === 'SUSPENDED' ? 'danger' : 'primary'} pending={lifecycle.isPending} onCancel={() => setConfirmLock(false)} onConfirm={() => lifecycle.mutate(target)} />
    <CancellableLoadingOverlay visible={save.isPending || lifecycle.isPending} message="Đang cập nhật thiết bị…" />
  </StackScreenLayout>;
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) { return <View style={styles.field}><ThemedText type="bodySmall">{label}</ThemedText><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor={Colors.light.textSecondary} /></View>; }
function Selector({ label, items, selected, onSelect }: { label: string; items: { id: string; label: string }[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.field}><ThemedText type="bodySmall">{label}</ThemedText>{items.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: selected === item.id }} onPress={() => onSelect(item.id)} style={[styles.option, selected === item.id && styles.optionSelected]}><ThemedText type="bodySmall">{item.label}</ThemedText></Pressable>)}</View>; }
const styles = StyleSheet.create({ page: { gap: Spacing.three, paddingBottom: 128 }, muted: { color: Colors.light.textSecondary, ...typography.bodySmall }, field: { gap: Spacing.one }, input: { minHeight: 48, borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, paddingHorizontal: Spacing.two, color: Colors.light.text, ...typography.bodySmall }, option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, paddingHorizontal: Spacing.two }, optionSelected: { borderColor: Colors.light.primary, backgroundColor: '#FDEBEC' } });
