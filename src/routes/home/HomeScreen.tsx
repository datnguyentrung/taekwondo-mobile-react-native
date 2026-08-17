import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight, UserRoundCog } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoutButton, useAuthSession } from '@/features/authentication';

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeContext, availableContextCount } = useAuthSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.brandRow}>
          <Image
            source={require('@/assets/taekwondo-removebg-preview.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Taekwondo Văn Quán"
          />
          <View style={styles.brandCopy}>
            <Text style={styles.eyebrow}>TAEKWONDO VĂN QUÁN</Text>
            <Text style={styles.greeting}>Xin chào</Text>
          </View>
        </View>

        <View style={styles.identityBand}>
          <Text style={styles.name}>{activeContext?.displayName ?? user?.phoneNumber ?? 'Thành viên'}</Text>
          <Text style={styles.meta}>
            {activeContext
              ? `${activeContext.contextType} · ${activeContext.userCode ?? user?.phoneNumber ?? ''}`
              : user?.phoneNumber ?? ''}
          </Text>
        </View>

        {availableContextCount > 1 ? (
          <Pressable
            onPress={() => router.push('/(context)/select')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}>
            <View style={styles.actionIcon}>
              <UserRoundCog size={22} color="#A9151A" aria-hidden />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Chuyển hồ sơ</Text>
              <Text style={styles.actionDescription}>Thay đổi ngữ cảnh và quyền đang sử dụng</Text>
            </View>
            <ChevronRight size={21} color="#73737B" aria-hidden />
          </Pressable>
        ) : null}

        <View style={styles.sessionSection}>
          <Text style={styles.sectionTitle}>Phiên đăng nhập</Text>
          <Text style={styles.sectionDescription}>
            Tài khoản và ngữ cảnh được bảo vệ trên thiết bị này.
          </Text>
          <LogoutButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 110, gap: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 82, height: 66 },
  brandCopy: { flex: 1, gap: 3 },
  eyebrow: { color: '#A9151A', fontSize: 11, fontWeight: '800' },
  greeting: { color: '#202024', fontSize: 25, fontWeight: '800' },
  identityBand: {
    borderLeftWidth: 4,
    borderLeftColor: '#A9151A',
    paddingVertical: 12,
    paddingLeft: 16,
    backgroundColor: '#FAFAFB',
    gap: 5,
  },
  name: { color: '#18181B', fontSize: 21, fontWeight: '800' },
  meta: { color: '#65656C', fontSize: 14 },
  action: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: '#E0E0E4',
    borderRadius: 8,
    padding: 14,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 8, backgroundColor: '#FCEBEC', alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { color: '#252529', fontSize: 16, fontWeight: '700' },
  actionDescription: { color: '#68686F', fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.78 },
  sessionSection: { gap: 10, marginTop: 6 },
  sectionTitle: { color: '#252529', fontSize: 17, fontWeight: '800' },
  sectionDescription: { color: '#68686F', fontSize: 14, lineHeight: 20, marginBottom: 4 },
});
