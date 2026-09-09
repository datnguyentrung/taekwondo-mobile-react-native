import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useAuthSession, useLogout } from "@/features/authentication";
import { Permission, useCan } from "@/features/authorization";
import BottomTabScreenLayout from "@/routes/navigation/layouts/BottomTabScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import {
  Colors,
  colorPrimitives,
  effects,
  figmaColors,
  hexToRgba,
  radii,
  typography,
} from "@/theme";
import type { AppIconName } from "@/theme/icons";

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
  if (personCode?.startsWith("VQ_")) return "Học viên";
  if (personCode?.startsWith("VQT_")) return "Nhân viên";
  return "Học viên";
}

export default function AccountScreen() {
  const router = useRouter();
  const { activeContext, user, availableContextCount } = useAuthSession();
  const canReadNotifications = useCan(Permission.NOTIFICATION_RECIPIENT_READ);
  const logout = useLogout();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const displayName = (
    activeContext?.displayName ??
    user?.phoneNumber ??
    "NGUYỄN HOÀNG MINH QUÂN"
  ).toLocaleUpperCase("vi-VN");
  const profileLabel = contextRoleLabel(activeContext?.personCode);

  const profileItems = useMemo<AccountMenuItem[]>(
    () => [
      {
        label: "Thông tin chung",
        icon: "personOutline",
        onPress: () => router.push("/account/general-info"),
      },
      { label: "Ví điện tử", icon: "wallet" },
      { label: "Thành tích", icon: "verified" },
    ],
    [router],
  );

  const settingItems = useMemo<AccountMenuItem[]>(
    () => {
      const items: AccountMenuItem[] = [
        { label: "Đổi mật khẩu", icon: "lockOpen" },
        { label: "Liên hệ", icon: "headphones" },
      ];
      if (canReadNotifications) {
        items.splice(1, 0, {
          label: "Thông báo",
          icon: "bellOutline",
        });
      }
      return items;
    },
    [canReadNotifications],
  );

  const switchAccount = () => {
    router.push({ pathname: "/(context)/select", params: { mode: "switch" } });
  };

  const confirmLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => setConfirmingLogout(false),
    });
  };

  return (
    <BottomTabScreenLayout title="Tài khoản" activeTab="account">
      <ImageBackground
        source={require("@/assets/images/headline.png")}
        style={styles.profileCard}
        imageStyle={styles.profileCardImage}
      >
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
            ]}
          >
            <ThemedText type="action" style={styles.switchText}>
              Chuyển tài khoản
            </ThemedText>
            <AppIcon
              name="chevronRight"
              width={7}
              height={13}
              color={Colors.light.primary}
            />
          </Pressable>
        </View>
      </ImageBackground>

      <AccountMenuSection title="Hồ sơ cá nhân" items={profileItems} />
      <AccountMenuSection title="Cài đặt" items={settingItems} />

      <View style={styles.ratingCard}>
        <View style={styles.ratingHeader}>
          <Image
            source={require("@/assets/images/evaluation-app.png")}
            style={styles.ratingImage}
            contentFit="cover"
            accessibilityLabel="Đánh giá ứng dụng"
          />
          <ThemedText type="subtitle" style={styles.ratingTitle}>
            Đánh giá của bạn
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.ratingDescription}>
            Bạn hài lòng với trải nghiệm trên ứng dụng chứ ?
          </ThemedText>
        </View>
        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={`rating-star-${index}`} style={styles.starIcon}>
              <AppIcon name="star" size={38} color="#FFC700" />
            </View>
          ))}
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
        ]}
      >
        {logout.isPending ? (
          <ActivityIndicator color={Colors.light.surface} />
        ) : (
          <>
            <AppIcon
              name="logoutLight"
              size={29}
              color={Colors.light.surface}
            />
            <ThemedText type="body" style={styles.logoutText}>
              Đăng xuất
            </ThemedText>
            <AppIcon
              name="chevronRight"
              width={9}
              height={15}
              color={Colors.light.surface}
            />
          </>
        )}
      </Pressable>

      <Modal
        visible={confirmingLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingLogout(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalCard}
            accessibilityViewIsModal
            accessibilityRole="alert"
          >
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
                ]}
              >
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
                ]}
              >
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
            ]}
          >
            <AppIcon name={item.icon} size={29} color={Colors.light.icon} />
            <ThemedText type="body" style={styles.menuText}>
              {item.label}
            </ThemedText>
            <AppIcon
              name="chevronRight"
              width={9}
              height={15}
              color={Colors.light.icon}
            />
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    overflow: "hidden",
    ...effects.card,
  },
  profileCardImage: {
    borderRadius: radii.md,
    resizeMode: "cover",
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: colorPrimitives.red[300],
    alignItems: "center",
    justifyContent: "center",
  },
  profileContent: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: Colors.light.text,
    ...typography.title,
  },
  profileLabel: {
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  switchAccount: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  switchText: {
    color: Colors.light.primary,
  },
  section: {
    marginTop: 20,
    minHeight: 240,
    borderRadius: radii.md,
    backgroundColor: hexToRgba(figmaColors.color1, 0.3),
    overflow: "hidden",
  },
  sectionHeader: {
    height: 60,
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 11,
    paddingRight: 8,
    gap: 15,
  },
  menuText: {
    flex: 1,
    color: Colors.light.text,
    ...typography.body,
  },
  divider: {
    position: "absolute",
    left: 55,
    right: 22,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
  },
  ratingCard: {
    marginTop: 20,
    height: 161,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    overflow: "hidden",
    ...effects.card,
  },
  ratingHeader: {
    height: 115,
    backgroundColor: "rgba(215, 17, 19, 0.1)",
    paddingLeft: 12,
    paddingTop: 14,
  },
  ratingTitle: {
    color: Colors.light.primary,
  },
  ratingDescription: {
    width: 224,
    marginTop: 11,
    color: Colors.light.primary,
  },
  stars: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: 46,
    paddingHorizontal: 22,
    paddingTop: 7,
  },
  starIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingImage: {
    position: "absolute",
    top: 3,
    right: 34,
    width: 82,
    height: 82,
  },
  logoutButton: {
    marginTop: 20,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    paddingRight: 25,
    gap: 10,
    ...effects.card,
  },
  logoutText: {
    flex: 1,
    color: Colors.light.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 23, 0.54)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
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
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: Colors.light.text,
  },
  modalConfirm: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
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
