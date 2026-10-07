import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, Spacing, radii, typography, effects } from '@/theme';
import { env } from '@/config/env';
import { useMqttSubscription } from '@/infrastructure/mqtt';

export function SensorStreamScreen() {
  const [lastPayload, setLastPayload] = useState<string>('Chưa nhận dữ liệu nào');
  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--');

  const handleMessage = useCallback((message: { rawPayload: string }) => {
    setLastPayload(message.rawPayload);
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);
  useMqttSubscription(env.mqttDefaultTopic, handleMessage);

  return (
    <StackScreenLayout title="Cảm biến ESP32">
      <View style={styles.container}>
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>
            Trạng thái lắng nghe MQTT
          </ThemedText>
          <ThemedText style={styles.statusText}>
            Topic:{' '}
            <ThemedText style={styles.highlightText}>
              {env.mqttDefaultTopic ?? 'Chưa cấu hình'}
            </ThemedText>
          </ThemedText>
          <ThemedText style={styles.statusText}>
            Cập nhật lần cuối: {lastUpdated}
          </ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>
            Dữ liệu nhận được (Payload)
          </ThemedText>
          <View style={styles.payloadBox}>
            <ThemedText style={styles.payloadText}>{lastPayload}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.hintText}>
          * Dữ liệu được nhận từ topic MQTT chung đã cấu hình cho app.
        </ThemedText>
      </View>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.three,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    ...effects.soft,
    gap: Spacing.two,
  },
  cardTitle: {
    ...typography.heading,
    color: Colors.light.text,
  },
  statusText: {
    ...typography.body,
    color: Colors.light.textSecondary,
  },
  highlightText: {
    ...typography.body,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  payloadBox: {
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.three,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: Colors.light.divider,
  },
  payloadText: {
    ...typography.body,
    fontFamily: 'monospace',
    color: Colors.light.text,
  },
  hintText: {
    ...typography.caption,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.one,
    lineHeight: 18,
  },
});
