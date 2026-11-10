import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii, Spacing, typography } from '@/theme';

import { deviceApi } from '../api/deviceApi';
import type { ManagedDevice } from '../domain/device.types';

type Props = { device: ManagedDevice | null; onClose: () => void; onSaved: () => void };

function readConfig(value: string): Record<string, unknown> {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

export function FogRuntimeConfigSheet({ device, onClose, onSaved }: Props) {
  const [ipAddress, setIpAddress] = useState('');
  const [fogHttpPort, setFogHttpPort] = useState('8000');
  const [mqttTcpPort, setMqttTcpPort] = useState('1883');
  const [mqttWsPort, setMqttWsPort] = useState('9001');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const config = readConfig(device?.desiredConfig ?? '{}');
    const configuredIp = typeof config.mqttTcpHost === 'string' ? config.mqttTcpHost : '';
    setIpAddress(configuredIp);
    if (typeof config.fogHttpUrl === 'string') {
      try { setFogHttpPort(String(new URL(config.fogHttpUrl).port || 8000)); } catch { setFogHttpPort('8000'); }
    } else setFogHttpPort('8000');
    setMqttTcpPort(String(typeof config.mqttTcpPort === 'number' ? config.mqttTcpPort : 1883));
    if (typeof config.mqttWsUrl === 'string') {
      try { setMqttWsPort(String(new URL(config.mqttWsUrl).port || 9001)); } catch { setMqttWsPort('9001'); }
    } else setMqttWsPort('9001');
    setError(null);
  }, [device]);

  const save = async () => {
    if (!device) return;
    const httpPort = Number(fogHttpPort);
    const tcpPort = Number(mqttTcpPort);
    const wsPort = Number(mqttWsPort);
    const normalizedIp = ipAddress.trim();
    const validIpv4 = normalizedIp.split('.').length === 4 && normalizedIp.split('.').every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
    if (!validIpv4 || /:\/\//.test(normalizedIp) || ![httpPort, tcpPort, wsPort].every((port) => Number.isInteger(port) && port >= 1 && port <= 65535)) {
      setError('Nhập IP và ba port hợp lệ trong khoảng 1–65535.');
      return;
    }
    setBusy(true); setError(null);
    try {
      await deviceApi.configuration(device.deviceId, JSON.stringify({ fogHttpUrl: `http://${normalizedIp}:${httpPort}`, mqttTcpHost: normalizedIp, mqttTcpPort: tcpPort, mqttWsUrl: `ws://${normalizedIp}:${wsPort}`, heartbeatSeconds: 30 }), device.desiredConfigVersion);
      onSaved(); onClose();
    } catch {
      setError('Không thể lưu cấu hình. Có thể cấu hình đã được thay đổi ở nơi khác; hãy refresh và thử lại.');
    } finally { setBusy(false); }
  };

  return <BottomSheetWindow visible={Boolean(device)} title="Kết nối Fog" onClose={onClose}>
    <View style={styles.form}>
      <ThemedText style={styles.hint}>Dùng IP LAN mà điện thoại và ESP32 cùng truy cập được. Không dùng localhost hoặc 0.0.0.0.</ThemedText>
      <Field label="Địa chỉ IP Fog" value={ipAddress} onChangeText={setIpAddress} placeholder="172.20.10.3" />
      <EndpointField label="Fog HTTP" prefix="http://" value={fogHttpPort} onChangeText={setFogHttpPort} placeholder="8000" />
      <EndpointField label="MQTT TCP" prefix="" value={mqttTcpPort} onChangeText={setMqttTcpPort} placeholder="1883" />
      <EndpointField label="MQTT WebSocket" prefix="ws://" value={mqttWsPort} onChangeText={setMqttWsPort} placeholder="9001" />
      {error ? <ThemedText selectable style={styles.error}>{error}</ThemedText> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void save()} style={[styles.save, busy && styles.disabled]}><ThemedText style={styles.saveText}>{busy ? 'Đang lưu…' : 'Lưu cấu hình Fog'}</ThemedText></Pressable>
    </View>
  </BottomSheetWindow>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'number-pad' }) { return <View style={styles.field}><ThemedText type="bodySmall">{props.label}</ThemedText><TextInput accessibilityLabel={props.label} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={Colors.light.textSecondary} autoCapitalize="none" autoCorrect={false} keyboardType={props.keyboardType} style={styles.input} /></View>; }
function EndpointField(props: { label: string; prefix: string; value: string; onChangeText: (value: string) => void; placeholder: string }) { return <View style={styles.field}><ThemedText type="bodySmall">{props.label}</ThemedText><View style={styles.endpointInput}><ThemedText style={styles.prefix}>{props.prefix}</ThemedText><TextInput accessibilityLabel={props.label} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={Colors.light.textSecondary} keyboardType="number-pad" style={styles.portInput} /></View></View>; }

const styles = StyleSheet.create({ form: { gap: Spacing.three, paddingBottom: Spacing.four }, hint: { color: Colors.light.textSecondary, ...typography.bodySmall }, field: { gap: Spacing.one }, input: { minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, color: Colors.light.text, paddingHorizontal: Spacing.two, ...typography.bodySmall }, endpointInput: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, paddingLeft: Spacing.two }, prefix: { color: Colors.light.textSecondary, ...typography.bodySmall }, portInput: { flex: 1, minHeight: 46, color: Colors.light.text, paddingHorizontal: Spacing.one, ...typography.bodySmall }, save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: Colors.light.primary }, saveText: { color: Colors.light.surface, fontWeight: '700' }, disabled: { opacity: 0.55 }, error: { color: Colors.light.error, ...typography.bodySmall } });
