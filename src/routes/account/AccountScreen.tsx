import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useAuthSession, useLogout } from '@/features/authentication';
import BottomTabScreenLayout from '@/routes/navigation/layouts/BottomTabScreenLayout';
import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, colorPrimitives, effects, radii } from '@/theme';
import type { AppIconName } from '@/theme/icons';

type AccountMenuItem = {
  label: string;
  icon: AppIconName;
  onPress?: () => void;
};

type AccountMenuSectionProps = {
  title: string;
  items: AccountMenuItem[];
};

function contextRoleLabel(personCode?: string | null) {
  if (personCode?.startsWith('VQ_')) return 'Học viên';
  if (personCode?.startsWith('VQT_')) return 'Nhân viên';
  return 'Học viên';
}

export default function AccountScreen() {
  const router = useRouter();
  const { activeContext, user, availableContextCount } = useAuthSession();
  const logout = useLogout();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const displayName =
    activeContext?.displayName ?? user?.phoneNumber ?? 'NGUYỄN HOÀNG MINH QUÂN';
  const profileLabel = contextRoleLabel(activeContext?.personCode);

  const profileItems = useMemo<AccountMenuItem[]>(
    () => [
      { label: 'Thông tin chung', icon: 'personFill' },
      { label: 'Ví điện tử', icon: 'wallet' },
      { label: 'Thành tích', icon: 'verified' },
    ],
    [],
  );

  const settingItems = useMemo<AccountMenuItem[]>(
    () => [
      { label: 'Đổi mật khẩu', icon: 'lockOpen' },
      { label: 'Thông báo', icon: 'bellOutline' },
      { label: 'Liên hệ', icon: 'headphones' },
    ],
    [],
  );

  const switchAccount = () => {
    router.push({ pathname: '/(context)/select', params: { mode: 'switch' } });
  };

  const confirmLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => setConfirmingLogout(false),
    });
  };

  return (
    <BottomTabScreenLayout title="Tài khoản" activeTab="account">
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <AppIcon name="personFill" size={48} color={Colors.light.surface} />
        </View>
        <View style={styles.profileContent}>
          <ThemedText type="title" numberOfLines={2} style={styles.profileName}>
            {displayName}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.profileLabel}>
            {profileLabel}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chuyển tài khoản"
            disabled={availableContextCount <= 1}
            onPress={switchAccount}
            style={({ pressed }) => [
              styles.switchAccount,
              availableContextCount <= 1 ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}>
            <ThemedText type="action" style={styles.switchText}>
              Chuyển tài khoản
            </ThemedText>
            <AppIcon name="chevronRight" width={7} height={13} color={Colors.light.primary} />
          </Pressable>
        </View>
      </View>

      <AccountMenuSection title="Hồ sơ cá nhân" items={profileItems} />
      <AccountMenuSection title="Cài đặt" items={settingItems} />

      <View style={styles.ratingCard}>
        <View style={styles.ratingCopy}>
          <ThemedText type="subtitle" style={styles.ratingTitle}>
            Đánh giá của bạn
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.ratingDescription}>
            Sự hài lòng của bạn là động lực để chúng tôi phát triển.
          </ThemedText>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, index) => (
              <AppIcon
                key={`rating-star-${index}`}
                name="star"
                size={38}
                color={colorPrimitives.red[300]}
              />
            ))}
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <AppIcon name="cup" size={58} color={Colors.light.primary} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đăng xuất"
        accessibilityState={{ busy: logout.isPending }}
        disabled={logout.isPending}
        onPress={() => setConfirmingLogout(true)}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed ? styles.pressed : null,
          logout.isPending ? styles.disabled : null,
        ]}>
        {logout.isPending ? (
          <ActivityIndicator color={Colors.light.surface} />
        ) : (
          <>
            <ThemedText type="body" style={styles.logoutText}>
              Đăng xuất
            </ThemedText>
            <AppIcon name="logoutRounded" size={29} color={Colors.light.surface} />
            <AppIcon name="chevronRight" width={9} height={15} color={Colors.light.surface} />
          </>
        )}
      </Pressable>

      <Modal
        visible={confirmingLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingLogout(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal accessibilityRole="alert">
            <ThemedText type="title" style={styles.modalTitle}>
              Bạn có chắc muốn đăng xuất?
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.modalDescription}>
              Phiên hiện tại trên thiết bị này sẽ kết thúc.
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={logout.isPending}
                onPress={() => setConfirmingLogout(false)}
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed ? styles.pressed : null,
                ]}>
                <ThemedText type="action" style={styles.modalCancelText}>
                  Hủy
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={logout.isPending}
                onPress={confirmLogout}
                style={({ pressed }) => [
                  styles.modalConfirm,
                  pressed ? styles.pressed : null,
                ]}>
                <ThemedText type="action" style={styles.modalConfirmText}>
                  Đăng xuất
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </BottomTabScreenLayout>
  );
}

function AccountMenuSection({ title, items }: AccountMenuSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.sectionBody}>
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuRow,
              pressed ? styles.pressed : null,
            ]}>
            <AppIcon name={item.icon} size={29} color={Colors.light.icon} />
            <ThemedText type="body" style={styles.menuText}>
              {item.label}
            </ThemedText>
            <AppIcon name="chevronRight" width={9} height={15} color={Colors.light.icon} />
            {index < items.length - 1 ? <View style={styles.divider} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    minHeight: 120,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    ...effects.shadowSoft,
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: colorPrimitives.red[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: Colors.light.text,
  },
  profileLabel: {
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  switchAccount: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  switchText: {
    color: Colors.light.primary,
  },
  section: {
    marginTop: 20,
    minHeight: 240,
    borderRadius: radii.md,
    backgroundColor: 'rgba(215, 17, 19, 0.3)',
    overflow: 'hidden',
  },
  sectionHeader: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  sectionTitle: {
    color: Colors.light.surface,
  },
  sectionBody: {
    minHeight: 180,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    backgroundColor: Colors.light.surface,
  },
  menuRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    paddingRight: 8,
    gap: 15,
  },
  menuText: {
    flex: 1,
    color: Colors.light.text,
  },
  divider: {
    position: 'absolute',
    left: 55,
    right: 22,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
  },
  ratingCard: {
    marginTop: 20,
    minHeight: 161,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    flexDirection: 'row',
    overflow: 'hidden',
    ...effects.shadowSoft,
  },
  ratingCopy: {
    flex: 1,
    paddingLeft: 18,
    paddingTop: 17,
    paddingBottom: 18,
  },
  ratingTitle: {
    color: Colors.light.text,
  },
  ratingDescription: {
    maxWidth: 210,
    marginTop: 2,
    color: Colors.light.textSecondary,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 14,
  },
  ratingBadge: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215, 17, 19, 0.1)',
  },
  logoutButton: {
    marginTop: 20,
    minHeight: 60,
    borderRadius: radii.xl,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    ...effects.shadowCard,
  },
  logoutText: {
    color: Colors.light.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 23, 0.54)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: Colors.light.text,
  },
  modalDescription: {
    color: Colors.light.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: Colors.light.text,
  },
  modalConfirm: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: Colors.light.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
});
