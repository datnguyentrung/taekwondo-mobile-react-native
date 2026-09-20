import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import type { UserStatus } from "../constants/user.constants";
import { userApi } from "../api/userApi";
import { userStatusLabel } from "../domain/userViewModel";
import { userKeys, useUser } from "../queries/userQueries";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import {
  AdminButton,
  AdminCard,
  AdminChip,
  AdminConfirmDialog,
  AdminField,
  AdminInfoBanner,
  AdminSectionHeader,
  adminStyles,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { formatDateTime } from "@/shared/utils/dateTime";

import { useUserId, userStatuses } from "./userAdministrationShared";

export function UserEditScreen() {
  const router = useRouter();
  const userId = useUserId();
  const user = useUser(userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [confirming, setConfirming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user.data) return;
    // Async server state seeds an editable draft when the record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhone(user.data.phoneNumber ?? "");
    setStatus(user.data.status ?? "PENDING");
  }, [user.data]);

  const save = useMutation({
    mutationFn: () =>
      userApi.update(userId as string, {
        phoneNumber: phone.trim(),
        passwordHash: user.data?.passwordHash ?? "",
        status,
        lastLoginAt: user.data?.lastLoginAt ?? "1970-01-01T00:00:00",
        authorizationVersion: user.data?.authorizationVersion ?? 0,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(userId ?? "") });
      toast.show({ message: "Đã cập nhật người dùng", variant: "success" });
      setConfirming(false);
      router.replace(`/admin/users/${userId}` as Href);
    },
    onError: () =>
      toast.show({ message: "Không thể cập nhật người dùng", variant: "error" }),
  });
  const remove = useMutation({
    mutationFn: () => userApi.remove(userId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      router.replace("/admin/users" as Href);
    },
    onError: () =>
      toast.show({ message: "Không thể xóa người dùng", variant: "error" }),
  });

  return (
    <StackScreenLayout title="Sửa người dùng" contentContainerStyle={adminStyles.screen}>
      <AdminField
        label="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <AdminSectionHeader title="Trạng thái" />
      <View style={adminStyles.chips}>
        {userStatuses.map((value) => (
          <AdminChip
            key={value}
            label={userStatusLabel(value)}
            selected={status === value}
            onPress={() => setStatus(value)}
          />
        ))}
      </View>
      <AdminCard style={adminStyles.gap}>
        <View style={adminStyles.labelValue}>
          <ThemedText type="featureLabel">Đăng nhập gần nhất</ThemedText>
          <ThemedText type="bodySmall" style={adminStyles.muted}>
            {formatDateTime(user.data?.lastLoginAt)}
          </ThemedText>
        </View>
        <View style={adminStyles.labelValue}>
          <ThemedText type="featureLabel">Phiên bản phân quyền</ThemedText>
          <ThemedText type="bodySmall" style={adminStyles.muted}>
            v{user.data?.authorizationVersion ?? 0}
          </ThemedText>
        </View>
      </AdminCard>
      <AdminInfoBanner>
        Khóa hoặc vô hiệu hóa tài khoản có thể khiến các phiên đăng nhập hiện tại mất quyền truy cập.
      </AdminInfoBanner>
      <AdminButton
        label="Lưu thay đổi"
        disabled={phone.trim().length < 9 || !user.data?.passwordHash}
        onPress={() => setConfirming(true)}
      />
      {!user.data?.passwordHash && user.isSuccess ? (
        <AdminInfoBanner tone="warning">
          API không trả về dữ liệu mật khẩu cần thiết cho hợp đồng cập nhật hiện tại, nên thao tác lưu đã được khóa để tránh ghi đè mật khẩu.
        </AdminInfoBanner>
      ) : null}
      <AdminButton label="Xóa người dùng" variant="text" onPress={() => setConfirmDelete(true)} />
      <AdminConfirmDialog
        confirming={confirming}
        title="Lưu thay đổi?"
        message="Số điện thoại và trạng thái tài khoản sẽ được cập nhật ngay."
        confirmLabel="Lưu"
        loading={save.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => save.mutate()}
      />
      <AdminConfirmDialog
        confirming={confirmDelete}
        title="Xóa người dùng?"
        message="Tài khoản và các liên kết liên quan sẽ bị ảnh hưởng. Thao tác này không thể hoàn tác."
        confirmLabel="Xóa"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </StackScreenLayout>
  );
}
