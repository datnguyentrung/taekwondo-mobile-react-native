import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii, Spacing, typography } from '@/theme';

import { deviceApi } from '../api/deviceApi';
import type { ManagedDevice } from '../domain/device.types';
import { deviceProvisioningStorage } from '../services/deviceProvisioningStorage';

type DeviceType = 'FOG_GATEWAY' | 'KIOSK' | 'ESP32';
const typeLabel: Record<DeviceType, string> = { FOG_GATEWAY: 'Fog', KIOSK: 'Kiosk', ESP32: 'ESP32' };

type Props = { visible: boolean; devices: ManagedDevice[]; onClose: () => void; onCreated: () => void };

export function DeviceProvisioningSheet({ visible, devices, onClose, onCreated }: Props) {
  const [deviceType, setDeviceType] = useState<DeviceType>('FOG_GATEWAY');
  const [displayName, setDisplayName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [fogGatewayId, setFogGatewayId] = useState<string | null>(null);
  const [pairedKioskId, setPairedKioskId] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState<{ deviceCode: string; code: string } | null>(null);
  const [kioskClaimed, setKioskClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gateways = useMemo(() => devices.filter((d) => d.deviceType === 'FOG_GATEWAY'), [devices]);
  const kiosks = useMemo(() => devices.filter((d) => d.deviceType === 'KIOSK' && d.fogGatewayId === fogGatewayId), [devices, fogGatewayId]);
  const requiresBranch = deviceType !== 'FOG_GATEWAY';

  const close = () => { if (!busy) { setProvisioning(null); setKioskClaimed(false); setError(null); onClose(); } };
  const submit = async () => {
    setError(null);
    if (!displayName.trim()) { setError('Nhập tên để dễ nhận biết thiết bị.'); return; }
    if (requiresBranch && (!branchId || Number.isNaN(Number(branchId)))) { setError('Nhập mã cơ sở (branch ID).'); return; }
    if (deviceType !== 'FOG_GATEWAY' && !fogGatewayId) { setError('Chọn Fog Gateway.'); return; }
    if (deviceType === 'ESP32' && !pairedKioskId) { setError('Chọn Kiosk nhận lệnh quét.'); return; }
    setBusy(true);
    try {
      const device = await deviceApi.create({ displayName: displayName.trim(), deviceType, branchId: requiresBranch ? Number(branchId) : null, fogGatewayId, pairedKioskId });
      const result = await deviceApi.provisionCode(device.deviceId);
      setProvisioning({ deviceCode: device.deviceCode, code: result.code }); setKioskClaimed(false);
      onCreated();
    } catch {
      setError('Không thể tạo thiết bị hoặc sinh mã. Kiểm tra quyền quản trị và dữ liệu đã nhập.');
    } finally { setBusy(false); }
  };

  const claimThisKiosk = async () => {
    if (!provisioning) return;
    setError(null); setBusy(true);
    try {
      const installationId = Crypto.randomUUID();
      const claim = await deviceApi.claim({ code: provisioning.code, deviceType: 'KIOSK', installationId });
      await deviceProvisioningStorage.write({ deviceCode: claim.deviceCode, secret: claim.secret, installationId });
      setKioskClaimed(true); onCreated();
    } catch {
      setError('Không thể đăng ký Kiosk trên điện thoại này. Nếu mã đã dùng, hãy sinh mã mới và thử lại.');
    } finally { setBusy(false); }
  };

  if (provisioning) return <BottomSheetWindow visible={visible} title="Mã provisioning" onClose={close}>
    <View style={styles.form}><ThemedText type="title">Lưu mã này ngay</ThemedText><ThemedText style={styles.muted}>Mã kỹ thuật thiết bị</ThemedText><ThemedText selectable style={styles.code}>{provisioning.deviceCode}</ThemedText><ThemedText style={styles.muted}>Mã provisioning chỉ dùng một lần và hết hạn sau 10 phút.</ThemedText><ThemedText selectable style={styles.code}>{provisioning.code}</ThemedText>{deviceType === 'KIOSK' ? (kioskClaimed ? <ThemedText style={styles.success}>Kiosk đã đăng ký trên điện thoại này. Kích hoạt Kiosk ở danh sách thiết bị để bắt đầu nhận lệnh quét.</ThemedText> : <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void claimThisKiosk()} style={[styles.primary, busy && styles.disabled]}><ThemedText style={styles.primaryText}>{busy ? 'Đang đăng ký…' : 'Đăng ký điện thoại này làm Kiosk'}</ThemedText></Pressable>) : <Pressable accessibilityRole="button" onPress={() => void Clipboard.setStringAsync(provisioning.code)} style={styles.primary}><ThemedText style={styles.primaryText}>Sao chép mã provisioning</ThemedText></Pressable>}{error ? <ThemedText selectable style={styles.error}>{error}</ThemedText> : null}<ThemedText style={styles.muted}>{deviceType === 'ESP32' ? 'Mở Serial Monitor và gửi lệnh PROVISION với mã này.' : deviceType === 'FOG_GATEWAY' ? 'Dùng mã này để claim Fog Gateway bằng CLI.' : 'Thiết bị chỉ kết nối MQTT sau khi được kích hoạt.'}</ThemedText></View>
  </BottomSheetWindow>;

  return <BottomSheetWindow visible={visible} title="Đăng ký thiết bị" onClose={close}>
    <View style={styles.form}>
      <ThemedText style={styles.muted}>Tạo bản ghi trước, sau đó dùng mã provisioning để thiết bị tự nhận credential.</ThemedText>
      <View style={styles.typeRow}>{(Object.keys(typeLabel) as DeviceType[]).map((type) => <Pressable key={type} onPress={() => { setDeviceType(type); setFogGatewayId(null); setPairedKioskId(null); }} style={[styles.typeButton, deviceType === type && styles.typeButtonActive]}><ThemedText style={deviceType === type ? styles.typeTextActive : styles.muted}>{typeLabel[type]}</ThemedText></Pressable>)}</View>
      <Field label="Tên thiết bị" value={displayName} onChangeText={setDisplayName} placeholder="Ví dụ: PIR cửa chính" />
      <ThemedText style={styles.muted}>Mã kỹ thuật sẽ do hệ thống tự cấp sau khi tạo.</ThemedText>
      {requiresBranch ? <Field label="Branch ID" value={branchId} onChangeText={setBranchId} placeholder="Ví dụ: 1" keyboardType="number-pad" /> : null}
      {deviceType !== 'FOG_GATEWAY' ? <Selector label="Fog Gateway" empty="Chưa có Fog Gateway — hãy tạo Fog trước." items={gateways} selectedId={fogGatewayId} onSelect={setFogGatewayId} /> : null}
      {deviceType === 'ESP32' ? <Selector label="Kiosk nhận lệnh quét" empty="Chọn Fog trước rồi tạo Kiosk thuộc Fog đó." items={kiosks} selectedId={pairedKioskId} onSelect={setPairedKioskId} /> : null}
      {error ? <ThemedText selectable style={styles.error}>{error}</ThemedText> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void submit()} style={[styles.primary, busy && styles.disabled]}><ThemedText style={styles.primaryText}>{busy ? 'Đang tạo…' : 'Tạo và sinh mã'}</ThemedText></Pressable>
    </View>
  </BottomSheetWindow>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; autoCapitalize?: 'none'; keyboardType?: 'number-pad' }) { return <View style={styles.field}><ThemedText type="bodySmall">{props.label}</ThemedText><TextInput accessibilityLabel={props.label} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={Colors.light.textSecondary} autoCapitalize={props.autoCapitalize} keyboardType={props.keyboardType} style={styles.input} /></View>; }
function Selector({ label, empty, items, selectedId, onSelect }: { label: string; empty: string; items: ManagedDevice[]; selectedId: string | null; onSelect: (id: string) => void }) { return <View style={styles.field}><ThemedText type="bodySmall">{label}</ThemedText>{items.length ? items.map((item) => <Pressable key={item.deviceId} onPress={() => onSelect(item.deviceId)} style={[styles.option, selectedId === item.deviceId && styles.optionActive]}><ThemedText type="bodySmall">{item.displayName} · {item.deviceCode}</ThemedText></Pressable>) : <ThemedText style={styles.muted}>{empty}</ThemedText>}</View>; }

const styles = StyleSheet.create({ form: { gap: Spacing.three, paddingBottom: Spacing.four }, muted: { color: Colors.light.textSecondary, ...typography.bodySmall }, typeRow: { flexDirection: 'row', gap: Spacing.one }, typeButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md }, typeButtonActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, typeTextActive: { color: Colors.light.surface, ...typography.bodySmall }, field: { gap: Spacing.one }, input: { minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, color: Colors.light.text, paddingHorizontal: Spacing.two, ...typography.bodySmall }, option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, paddingHorizontal: Spacing.two }, optionActive: { borderColor: Colors.light.primary, backgroundColor: '#FDEBEC' }, primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: Colors.light.primary }, primaryText: { color: Colors.light.surface, fontWeight: '700' }, disabled: { opacity: 0.55 }, code: { borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, padding: Spacing.two, color: Colors.light.text, fontFamily: 'monospace' }, error: { color: Colors.light.error, ...typography.bodySmall }, success: { color: Colors.light.success, ...typography.bodySmall } });
