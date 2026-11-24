import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii, Spacing, typography } from '@/theme';

import { deviceApi, type Esp32PairingSession } from '../api/deviceApi';
import type { ManagedDevice } from '../domain/device.types';
import { deviceProvisioningStorage } from '../services/deviceProvisioningStorage';
import { buildFogRuntimeConfig } from '../services/fogRuntimeConfig';

type DeviceType = 'FOG_GATEWAY' | 'KIOSK' | 'ESP32';
const typeLabel: Record<DeviceType, string> = { FOG_GATEWAY: 'Fog', KIOSK: 'Kiosk', ESP32: 'ESP32' };

type Props = { visible: boolean; devices: ManagedDevice[]; onClose: () => void; onCreated: () => void };

function fogHttpUrl(gateway: ManagedDevice | undefined): string | null {
  if (!gateway) return null;
  try {
    const value = JSON.parse(gateway.desiredConfig) as { fogHttpUrl?: unknown };
    return typeof value.fogHttpUrl === 'string' && value.fogHttpUrl.startsWith('http') ? value.fogHttpUrl : null;
  } catch {
    return null;
  }
}

export function DeviceProvisioningSheet({ visible, devices, onClose, onCreated }: Props) {
  const [deviceType, setDeviceType] = useState<DeviceType>('FOG_GATEWAY');
  const [displayName, setDisplayName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [fogIpAddress, setFogIpAddress] = useState('');
  const [fogHttpPort, setFogHttpPort] = useState('8000');
  const [fogGatewayId, setFogGatewayId] = useState<string | null>(null);
  const [pairedKioskId, setPairedKioskId] = useState<string | null>(null);
  const [pairingSessions, setPairingSessions] = useState<Esp32PairingSession[]>([]);
  const [pairingSessionId, setPairingSessionId] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState<{ deviceCode: string; code: string } | null>(null);
  const [kioskClaimed, setKioskClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gateways = useMemo(() => devices.filter((d) => d.deviceType === 'FOG_GATEWAY'), [devices]);
  const kiosks = useMemo(() => devices.filter((d) => d.deviceType === 'KIOSK' && d.fogGatewayId === fogGatewayId), [devices, fogGatewayId]);
  const selectedGateway = useMemo(() => gateways.find((gateway) => gateway.deviceId === fogGatewayId), [gateways, fogGatewayId]);
  const requiresBranch = deviceType !== 'FOG_GATEWAY';

  const close = () => { if (!busy) { setProvisioning(null); setKioskClaimed(false); setPairingSessions([]); setPairingSessionId(null); setError(null); onClose(); } };
  const refreshEsp32Pairing = async () => {
    const endpoint = fogHttpUrl(selectedGateway);
    if (!endpoint) { setError('Fog chưa có cấu hình HTTP. Hãy cấu hình kết nối Fog trước.'); return; }
    setBusy(true); setError(null);
    try {
      const sessions = await deviceApi.esp32PairingSessions(endpoint);
      setPairingSessions(sessions.filter((session) => session.status === 'WAITING'));
      if (!sessions.some((session) => session.sessionId === pairingSessionId)) setPairingSessionId(null);
    } catch {
      setError('Không thể tìm ESP đang chờ ghép. Kiểm tra điện thoại và Fog cùng mạng.');
    } finally { setBusy(false); }
  };
  const submit = async () => {
    setError(null);
    if (!displayName.trim()) { setError('Nhập tên để dễ nhận biết thiết bị.'); return; }
    if (requiresBranch && (!branchId || Number.isNaN(Number(branchId)))) { setError('Nhập mã cơ sở (branch ID).'); return; }
    if (deviceType !== 'FOG_GATEWAY' && !fogGatewayId) { setError('Chọn Fog Gateway.'); return; }
    if (deviceType === 'ESP32' && !pairedKioskId) { setError('Chọn Kiosk nhận lệnh quét.'); return; }
    if (deviceType === 'ESP32' && !pairingSessionId) { setError('Giữ BOOT trên ESP trong 3 giây, làm mới danh sách rồi chọn ESP.'); return; }
    const fogPort = Number(fogHttpPort);
    const validFogAddress = fogIpAddress.trim().split('.').length === 4 && fogIpAddress.trim().split('.').every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
    if (deviceType === 'FOG_GATEWAY' && (!validFogAddress || !Number.isInteger(fogPort) || fogPort < 1 || fogPort > 65535)) { setError('Nhập IP và cổng HTTP hợp lệ của máy Fog.'); return; }
    setBusy(true);
    try {
      const device = await deviceApi.create({ displayName: displayName.trim(), deviceType, branchId: requiresBranch ? Number(branchId) : null, fogGatewayId, pairedKioskId });
      if (deviceType === 'FOG_GATEWAY') {
        // Kiosk runtime is derived from this Fog configuration. Persist it before
        // the Fog claims its credential so no terminal-side setup is needed.
        await deviceApi.configuration(
          device.deviceId,
          buildFogRuntimeConfig(fogIpAddress, fogPort),
          device.desiredConfigVersion,
        );
      }
      const result = await deviceApi.provisionCode(device.deviceId);
      if (deviceType === 'FOG_GATEWAY') {
        await deviceApi.claimFogAt(fogIpAddress.trim(), fogPort, result.code);
        onCreated();
        onClose();
        return;
      }
      if (deviceType === 'ESP32') {
        const endpoint = fogHttpUrl(selectedGateway);
        if (!endpoint) throw new Error('Fog HTTP endpoint is missing');
        await deviceApi.approveEsp32Pairing(endpoint, pairingSessionId!, result.code);
        onCreated();
        onClose();
        return;
      }
      setProvisioning({ deviceCode: device.deviceCode, code: result.code }); setKioskClaimed(false);
      onCreated();
    } catch {
      setError(deviceType === 'FOG_GATEWAY' ? 'Không thể kết nối hoặc đăng ký máy Fog. Kiểm tra IP, cổng 8000 và việc Fog đang chạy trong cùng mạng.' : deviceType === 'ESP32' ? 'Không thể gửi đăng ký tới ESP. Phiên ghép có thể đã hết hạn; hãy giữ BOOT rồi thử lại.' : 'Không thể tạo thiết bị hoặc sinh mã. Kiểm tra quyền quản trị và dữ liệu đã nhập.');
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
      <ThemedText style={styles.muted}>{deviceType === 'FOG_GATEWAY' ? 'App sẽ đăng ký trực tiếp vào máy Fog; credential chỉ được lưu trên máy Fog.' : deviceType === 'ESP32' ? 'Giữ BOOT trên ESP 3 giây, làm mới danh sách và chọn thiết bị. App sẽ cấp credential kín cho ESP.' : 'Tạo bản ghi trước, sau đó dùng mã provisioning để thiết bị tự nhận credential.'}</ThemedText>
      <View style={styles.typeRow}>{(Object.keys(typeLabel) as DeviceType[]).map((type) => <Pressable key={type} onPress={() => { setDeviceType(type); setFogGatewayId(null); setPairedKioskId(null); setPairingSessions([]); setPairingSessionId(null); }} style={[styles.typeButton, deviceType === type && styles.typeButtonActive]}><ThemedText style={deviceType === type ? styles.typeTextActive : styles.muted}>{typeLabel[type]}</ThemedText></Pressable>)}</View>
      <Field label="Tên thiết bị" value={displayName} onChangeText={setDisplayName} placeholder="Ví dụ: PIR cửa chính" />
      {deviceType === 'FOG_GATEWAY' ? <><Field label="Địa chỉ IP Fog" value={fogIpAddress} onChangeText={setFogIpAddress} placeholder="Ví dụ: 172.20.10.3" keyboardType="url" /><Field label="Cổng HTTP Fog" value={fogHttpPort} onChangeText={setFogHttpPort} placeholder="8000" keyboardType="number-pad" /></> : null}
      <ThemedText style={styles.muted}>Mã kỹ thuật sẽ do hệ thống tự cấp sau khi tạo.</ThemedText>
      {requiresBranch ? <Field label="Branch ID" value={branchId} onChangeText={setBranchId} placeholder="Ví dụ: 1" keyboardType="number-pad" /> : null}
      {deviceType !== 'FOG_GATEWAY' ? <Selector label="Fog Gateway" empty="Chưa có Fog Gateway — hãy tạo Fog trước." items={gateways} selectedId={fogGatewayId} onSelect={(id) => { setFogGatewayId(id); setPairedKioskId(null); setPairingSessions([]); setPairingSessionId(null); }} /> : null}
      {deviceType === 'ESP32' ? <Selector label="Kiosk nhận lệnh quét" empty="Chọn Fog trước rồi tạo Kiosk thuộc Fog đó." items={kiosks} selectedId={pairedKioskId} onSelect={setPairedKioskId} /> : null}
      {deviceType === 'ESP32' ? <View style={styles.field}><ThemedText type="bodySmall">ESP đang chờ ghép</ThemedText><Pressable accessibilityRole="button" disabled={!fogGatewayId || busy} onPress={() => void refreshEsp32Pairing()} style={[styles.secondary, (!fogGatewayId || busy) && styles.disabled]}><ThemedText style={styles.secondaryText}>{busy ? 'Đang tìm…' : 'Làm mới danh sách ESP'}</ThemedText></Pressable>{pairingSessions.length ? pairingSessions.map((session) => <Pressable key={session.sessionId} onPress={() => setPairingSessionId(session.sessionId)} style={[styles.option, pairingSessionId === session.sessionId && styles.optionActive]}><ThemedText type="bodySmall">ESP32 · {session.hardwareId} · hết hạn {new Date(session.expiresAt).toLocaleTimeString('vi-VN')}</ThemedText></Pressable>) : <ThemedText style={styles.muted}>Giữ BOOT 3 giây trên ESP, rồi làm mới.</ThemedText>}</View> : null}
      {error ? <ThemedText selectable style={styles.error}>{error}</ThemedText> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void submit()} style={[styles.primary, busy && styles.disabled]}><ThemedText style={styles.primaryText}>{busy ? 'Đang đăng ký…' : deviceType === 'FOG_GATEWAY' ? 'Đăng ký Fog' : deviceType === 'ESP32' ? 'Đăng ký ESP' : 'Tạo và sinh mã'}</ThemedText></Pressable>
    </View>
  </BottomSheetWindow>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; autoCapitalize?: 'none'; keyboardType?: 'number-pad' | 'url' }) { return <View style={styles.field}><ThemedText type="bodySmall">{props.label}</ThemedText><TextInput accessibilityLabel={props.label} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={Colors.light.textSecondary} autoCapitalize={props.autoCapitalize} keyboardType={props.keyboardType} style={styles.input} /></View>; }
function Selector({ label, empty, items, selectedId, onSelect }: { label: string; empty: string; items: ManagedDevice[]; selectedId: string | null; onSelect: (id: string) => void }) { return <View style={styles.field}><ThemedText type="bodySmall">{label}</ThemedText>{items.length ? items.map((item) => <Pressable key={item.deviceId} onPress={() => onSelect(item.deviceId)} style={[styles.option, selectedId === item.deviceId && styles.optionActive]}><ThemedText type="bodySmall">{item.displayName} · {item.deviceCode}</ThemedText></Pressable>) : <ThemedText style={styles.muted}>{empty}</ThemedText>}</View>; }

const styles = StyleSheet.create({ form: { gap: Spacing.three, paddingBottom: Spacing.four }, muted: { color: Colors.light.textSecondary, ...typography.bodySmall }, typeRow: { flexDirection: 'row', gap: Spacing.one }, typeButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md }, typeButtonActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, typeTextActive: { color: Colors.light.surface, ...typography.bodySmall }, field: { gap: Spacing.one }, input: { minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, color: Colors.light.text, paddingHorizontal: Spacing.two, ...typography.bodySmall }, option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, paddingHorizontal: Spacing.two }, optionActive: { borderColor: Colors.light.primary, backgroundColor: '#FDEBEC' }, primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: Colors.light.primary }, primaryText: { color: Colors.light.surface, fontWeight: '700' }, secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.primary }, secondaryText: { color: Colors.light.primary, fontWeight: '700' }, disabled: { opacity: 0.55 }, code: { borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, padding: Spacing.two, color: Colors.light.text, fontFamily: 'monospace' }, error: { color: Colors.light.error, ...typography.bodySmall }, success: { color: Colors.light.success, ...typography.bodySmall } });
