import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import {
  Bell,
  Headphones,
  LockOpen,
  Logout,
  Trash6,
  User,
  Verified,
  Wallet,
} from "reicon-react-native";

import { useAuthSession, useLogout } from "@/features/authentication";
import { deviceProvisioningStorage } from "@/features/device-management";
import { mqttClient } from "@/infrastructure/mqtt/mqttClient";
import SideDrawerWindow from "@/routes/navigation/layouts/SideDrawerWindow";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ConfirmationDialog } from "@/shared/ui/ConfirmationDialog";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { showComingSoon } from "@/shared/utils/comingSoon";
import { Colors, activeEffect, effects, radii } from "@/theme";

import {
  AccountMenuSection,
  type AccountMenuItem,
} from "../components/AccountMenuSection";
import { AccountProfileCard } from "../components/AccountProfileCard";
import { AccountRatingCard } from "../components/AccountRatingCard";

function contextRoleLabel(personCode?: string | null) {
  if (personCode?.startsWith("VQ_")) return "Học viên";
  if (personCode?.startsWith("VQT_")) return "Nhân viên";
  return "Học viên";
}

export type AccountDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onRouteChangeClose?: () => void;
};

export function AccountDrawer({
  visible,
  onClose,
  onRouteChangeClose,
}: AccountDrawerProps) {
  const router = useRouter();
  const toast = useToast();
  const { activeContext, user, isAuthenticated } = useAuthSession();
  const canOpenNotifications = isAuthenticated;
  const logout = useLogout();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [confirmingKioskUnregister, setConfirmingKioskUnregister] =
    useState(false);
  const [hasRegisteredKiosk, setHasRegisteredKiosk] = useState(false);
  const [isUnregisteringKiosk, setIsUnregisteringKiosk] = useState(false);
  const displayName = (
    activeContext?.displayName ??
    user?.phoneNumber ??
    "NGUYỄN HOÀNG MINH QUÂN"
  ).toLocaleUpperCase("vi-VN");
  const profileLabel = contextRoleLabel(activeContext?.personCode);

  useEffect(() => {
    if (!visible) return undefined;

    let disposed = false;
    void deviceProvisioningStorage.read().then((profile) => {
      if (!disposed) setHasRegisteredKiosk(Boolean(profile));
    });

    return () => {
      disposed = true;
    };
  }, [visible]);

  const profileItems = useMemo<AccountMenuItem[]>(
    () => [
      {
        label: "Thông tin chung",
        icon: <User />,
        onPress: () => router.push("/account/general-info"),
      },
      {
        label: "Ví điện tử",
        icon: <Wallet />,
        onPress: () => router.push("/account/wallet" as Href),
      },
      {
        label: "Thành tích",
        icon: <Verified />,
        onPress: () => showComingSoon(toast),
      },
    ],
    [router, toast],
  );

  const settingItems = useMemo<AccountMenuItem[]>(() => {
    const items: AccountMenuItem[] = [
      {
        label: "Đổi mật khẩu",
        icon: <LockOpen />,
        onPress: () => router.push("/account/change-password" as Href),
      },
      {
        label: "Email khôi phục",
        icon: <Verified />,
        onPress: () => router.push("/account/recovery-email" as Href),
      },
      {
        label: "Liên hệ",
        icon: <Headphones />,
        onPress: () => showComingSoon(toast),
      },
    ];
    if (canOpenNotifications) {
      items.splice(1, 0, {
        label: "Thông báo",
        icon: <Bell />,
        onPress: () => showComingSoon(toast),
      });
    }
    return items;
  }, [canOpenNotifications, router, toast]);

  const switchAccount = () => {
    router.push({ pathname: "/(context)/select", params: { mode: "switch" } });
  };

  const confirmLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => setConfirmingLogout(false),
    });
  };

  const unregisterKiosk = async () => {
    setIsUnregisteringKiosk(true);
    try {
      await deviceProvisioningStorage.clear();
      mqttClient.disconnect();
      setHasRegisteredKiosk(false);
      setConfirmingKioskUnregister(false);
      toast.show({
        message: "Đã hủy đăng ký Kiosk trên thiết bị này",
        variant: "success",
      });
    } catch {
      toast.show({
        message: "Không thể hủy đăng ký Kiosk trên thiết bị này",
        variant: "error",
      });
    } finally {
      setIsUnregisteringKiosk(false);
    }
  };

  return (
    <SideDrawerWindow
      visible={visible}
      title="Tài khoản"
      onClose={onClose}
      onRouteChangeClose={onRouteChangeClose}
    >
      <View style={styles.drawerContent}>
        <AccountProfileCard
          displayName={displayName}
          profileLabel={profileLabel}
          imageUrl={activeContext?.faceImagePath}
          gender={activeContext?.gender}
          canSwitchAccount={true}
          onSwitchAccount={switchAccount}
        />

        <AccountMenuSection title="Hồ sơ cá nhân" items={profileItems} />
        <AccountMenuSection title="Cài đặt" items={settingItems} />
        <AccountRatingCard />

        {hasRegisteredKiosk ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hủy đăng ký Kiosk trên thiết bị này"
            accessibilityState={{ busy: isUnregisteringKiosk }}
            disabled={isUnregisteringKiosk}
            onPress={() => setConfirmingKioskUnregister(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              styles.unregisterKioskButton,
              activeEffect(pressed, "pressedScale"),
              isUnregisteringKiosk ? styles.disabled : null,
            ]}
          >
            <AppIcon icon={<Trash6 />} size={29} color={Colors.light.surface} />
            <ThemedText type="body" style={styles.logoutText}>
              {isUnregisteringKiosk
                ? "Đang hủy đăng ký Kiosk…"
                : "Hủy đăng ký Kiosk"}
            </ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
          accessibilityState={{ busy: logout.isPending }}
          disabled={logout.isPending}
          onPress={() => setConfirmingLogout(true)}
          style={({ pressed }) => [
            styles.logoutButton,
            activeEffect(pressed, "pressedScale"),
            logout.isPending ? styles.disabled : null,
          ]}
        >
          {logout.isPending ? (
            <ActivityIndicator color={Colors.light.surface} />
          ) : (
            <>
              <AppIcon
                icon={<Logout />}
                size={29}
                color={Colors.light.surface}
              />
              <ThemedText type="body" style={styles.logoutText}>
                Đăng xuất
              </ThemedText>
            </>
          )}
        </Pressable>

        <ConfirmationDialog
          visible={confirmingLogout}
          title="Bạn có chắc muốn đăng xuất?"
          description="Phiên hiện tại trên thiết bị này sẽ kết thúc."
          confirmLabel="Đăng xuất"
          pending={logout.isPending}
          confirmVariant="danger"
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={confirmLogout}
        />

        <ConfirmationDialog
          visible={confirmingKioskUnregister}
          title="Hủy đăng ký Kiosk?"
          description="Thiết bị này sẽ không còn tự kết nối và nhận lệnh Kiosk cho đến khi được đăng ký lại."
          confirmLabel="Hủy đăng ký"
          pending={isUnregisteringKiosk}
          confirmVariant="danger"
          onCancel={() => setConfirmingKioskUnregister(false)}
          onConfirm={() => void unregisterKiosk()}
        />
      </View>
    </SideDrawerWindow>
  );
}

export default function AccountScreen() {
  const router = useRouter();

  return (
    <AccountDrawer
      visible
      onClose={() =>
        router.canGoBack() ? router.back() : router.replace("/" as Href)
      }
      onRouteChangeClose={() => undefined}
    />
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 10,
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
  unregisterKioskButton: {
    backgroundColor: Colors.light.error,
  },
  logoutText: {
    flex: 1,
    color: Colors.light.surface,
  },
  disabled: {
    opacity: 0.5,
  },
});
