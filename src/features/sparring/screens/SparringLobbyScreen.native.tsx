import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, effects, radii } from '@/theme';
import { isSparringRoomCode } from '../domain/sparringRoom';
import { sparringApi } from '../data/sparringApi';

export function SparringLobbyScreen() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const canJoin = isSparringRoomCode(roomCode) && !joining;

  const changeRoomCode = (value: string) => {
    const nextRoomCode = value.replace(/\D/g, '').slice(0, 4);
    setRoomCode(nextRoomCode);
    if (nextRoomCode.length === 4) Keyboard.dismiss();
  };

  const join = async () => {
    Keyboard.dismiss();
    if (!isSparringRoomCode(roomCode)) { Alert.alert('Mã không hợp lệ', 'Nhập đúng 4 chữ số của sàn đấu.'); return; }
    setJoining(true);
    try { await sparringApi.getRoom(roomCode); router.push(`/tkd/${roomCode}` as Href); }
    catch { Alert.alert('Không tìm thấy sàn đấu', 'Kiểm tra lại Ring Code rồi thử lại.'); }
    finally { setJoining(false); }
  };
  return <StackScreenLayout title="ĐỐI KHÁNG" headerVariant="dark" scrollEnabled={false} refreshEnabled={false} contentContainerStyle={styles.content}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12} style={styles.keyboardArea}>
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vào chế độ tập làm trọng tài"
            onPress={() => router.push('/tkd/practice' as Href)}
            style={({ pressed }) => [styles.practice, pressed && styles.pressed]}>
            <ThemedText type="subtitle" style={styles.practiceText}>TẬP LÀM TRỌNG TÀI</ThemedText>
          </Pressable>
          <ThemedText style={styles.hint}>Hoặc vào sàn Đối kháng thật</ThemedText>
          <View style={styles.joinForm}>
            <ThemedText type="subtitle">RING CODE</ThemedText>
            <TextInput value={roomCode} onChangeText={changeRoomCode} onSubmitEditing={() => { if (canJoin) void join(); }} keyboardType="number-pad" returnKeyType="done" maxLength={4} autoFocus accessibilityLabel="Mã sàn đấu" style={styles.input} placeholder="0000" placeholderTextColor={Colors.light.textSecondary} />
            <Pressable accessibilityRole="button" accessibilityLabel="Vào sàn đấu" accessibilityState={{ disabled: !canJoin }} disabled={!canJoin} onPress={() => void join()} style={({ pressed }) => [styles.join, !canJoin && styles.disabled, pressed && canJoin && styles.pressed]}>
              <ThemedText style={styles.joinText}>{joining ? 'ĐANG VÀO…' : 'JOIN'}</ThemedText>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </StackScreenLayout>;
}
const styles = StyleSheet.create({ content:{ flex:1, padding:20 }, keyboardArea:{ flex:1 }, card:{ flex:1, justifyContent:'center', alignItems:'center', gap:20 }, practice:{ width:'100%', minHeight:64, borderRadius:radii.lg, backgroundColor:Colors.light.primary, alignItems:'center', justifyContent:'center', ...effects.card }, practiceText:{ color:Colors.light.surface, fontSize:20 }, hint:{ color:Colors.light.textSecondary }, joinForm:{ width:'100%', gap:20 }, input:{ height:72, backgroundColor:Colors.light.surface, borderRadius:radii.md, color:Colors.light.text, fontSize:28, textAlign:'center', letterSpacing:8 }, join:{ minHeight:60, backgroundColor:Colors.light.success, borderRadius:radii.md, alignItems:'center', justifyContent:'center' }, joinText:{ color:Colors.light.surface, fontWeight:'800' }, pressed:{ opacity:.82, transform:[{scale:.98}] }, disabled:{ opacity:.42 } });
