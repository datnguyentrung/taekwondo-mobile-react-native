import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii } from '@/theme';
import { sparringApi } from '../data/sparringApi';
import { isSparringRoomCode } from '../domain/sparringRoom';

export function SparringLobbyScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canJoin = isSparringRoomCode(code) && !busy;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const room = await sparringApi.createRoom();
      router.push(`/tkd/${room.roomCode}` as Href);
    } catch {
      setError('Không thể tạo sàn đấu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!isSparringRoomCode(code)) {
      setError('Nhập đúng 4 chữ số.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sparringApi.getRoom(code);
      router.push(`/tkd/${code}` as Href);
    } catch {
      setError('Không tìm thấy sàn đấu.');
    } finally {
      setBusy(false);
    }
  };

  return <StackScreenLayout title="ĐỐI KHÁNG" headerVariant="dark" scrollEnabled={false} refreshEnabled={false} contentContainerStyle={styles.page}>
      <View style={styles.main}>
        <View style={styles.column}>
          <ThemedText style={styles.title}>REFEREE PRACTICE</ThemedText>
          <Pressable
            onPress={() => router.push('/tkd/practice' as Href)}
            style={styles.button}>
            <ThemedText>TẬP LÀM TRỌNG TÀI</ThemedText>
          </Pressable>
        </View>
        <View style={styles.column}>
          <ThemedText style={styles.title}>START A NEW RING</ThemedText>
          <Pressable
            disabled={busy}
            onPress={() => void create()}
            style={styles.button}>
            <ThemedText>{busy ? 'CREATING...' : 'CREATE'}</ThemedText>
          </Pressable>
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          <ThemedText style={styles.title}>JOIN A RING</ThemedText>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
            onSubmitEditing={() => { if (canJoin) void join(); }}
            placeholder="0000"
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={4}
            accessibilityLabel="Mã sàn đấu"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vào sàn đấu"
            accessibilityState={{ disabled: !canJoin }}
            disabled={!canJoin}
            onPress={() => void join()}
            style={({ pressed }) => [styles.join, !canJoin && styles.disabled, pressed && canJoin && styles.pressed]}>
            <ThemedText style={styles.joinText}>{busy ? 'ĐANG VÀO…' : 'JOIN'}</ThemedText>
          </Pressable>
        </View>
      </View>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
  </StackScreenLayout>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  main: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 48,
  },
  column: { width: 360, alignItems: 'center', gap: 18 },
  title: { fontSize: 30, fontWeight: '800' },
  button: {
    width: '85%',
    height: 42,
    borderRadius: radii.lg,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: 72,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    textAlign: 'center',
    color: Colors.light.text,
    fontSize: 28,
    letterSpacing: 8,
  },
  join: { width: '85%', minHeight: 60, borderRadius: radii.md, backgroundColor: Colors.light.success, alignItems: 'center', justifyContent: 'center' },
  joinText: { color: Colors.light.surface, fontWeight: '800' },
  pressed: { opacity: .82, transform: [{ scale: .98 }] },
  disabled: { opacity: .42 },
  divider: { width: 2, height: 280, backgroundColor: '#999' },
  hint: { color: Colors.light.textSecondary },
  error: {
    position: 'absolute',
    top: 76,
    alignSelf: 'center',
    color: Colors.light.primary,
  },
});
