import { StyleSheet, View } from 'react-native';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, Spacing, radii, typography, effects } from '@/theme';

export function SensorStreamScreen() {
  return (
    <StackScreenLayout
      title="Cảm biến ESP32"
      rightActions={[]}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>
            Màn chẩn đoán MQTT
          </ThemedText>
          <ThemedText style={styles.statusText}>
            MQTT không còn được bật bằng biến môi trường hay màn hình này.
          </ThemedText>
          <ThemedText style={styles.statusText}>
            Hãy đăng ký thiết bị này làm Kiosk trong “Thiết bị & cảnh báo”.
          </ThemedText>
        </View>

        <ThemedText style={styles.hintText}>
          * Kiosk đã kích hoạt sẽ tự nhận lệnh quét qua cấu hình runtime an toàn.
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
  disabledText: {
    ...typography.body,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  hintText: {
    ...typography.caption,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.one,
    lineHeight: 18,
  },
});
