import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import type { PersonSimpleResponse } from "@/features/person";
import { useRoles } from "@/features/roles/queries/roleQueries";
import { userApi } from "../api/userApi";
import type { UserSimpleResponse } from "../api/user.dto";
import { roleCodesForUser } from "../domain/userViewModel";
import {
  userKeys,
  useUser,
  useUserRoles,
  useUsers,
} from "../queries/userQueries";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import {
  AdminButton,
  AdminCard,
  AdminChip,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminListRow,
  AdminLoadingState,
  AdminSectionHeader,
  adminStyles,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { formatDateTime } from "@/shared/utils/dateTime";

import {
  Avatar,
  getPrimaryPerson,
  navigate,
  StatusChip,
  useUserId,
  userAdminStyles,
} from "./userAdministrationShared";

export function UserDetailScreen() {
  const router = useRouter();
  const userId = useUserId();
  const user = useUser(userId);
  const users = useUsers();
  const assignments = useUserRoles();
  const roles = useRoles();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const userListItem = (users.data?.content ?? []).find(
    (item: UserSimpleResponse) => item.userId === userId,
  );
  const primaryPerson = getPrimaryPerson(userListItem);
  const linkedPeople = userListItem?.persons ?? [];
  const codes = roleCodesForUser(userId ?? "", assignments.data?.content ?? []);
  const assignedRoles = (roles.data?.content ?? []).filter((role) =>
    codes.includes(role.code),
  );

  const remove = useMutation({
    mutationFn: () => userApi.remove(userId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.show({ message: "Đã xóa người dùng", variant: "success" });
      router.replace("/admin/users" as Href);
    },
    onError: () =>
      toast.show({ message: "Không thể xóa người dùng này", variant: "error" }),
  });

  return (
    <StackScreenLayout
      title="Chi tiết người dùng"
      contentContainerStyle={adminStyles.screen}
    >
      {user.isPending || users.isPending ? (
        <AdminLoadingState />
      ) : !user.data ? (
        <AdminEmptyState message="Không tìm thấy người dùng" />
      ) : (
        <>
          <AdminCard style={adminStyles.gap}>
            <View style={userAdminStyles.titleRow}>
              <Avatar name={primaryPerson?.fullName ?? user.data.phoneNumber} />
              <View style={adminStyles.grow}>
                <ThemedText type="heading">
                  {primaryPerson?.fullName ?? user.data.phoneNumber ?? "Người dùng"}
                </ThemedText>
                <ThemedText type="bodySmall" style={adminStyles.muted}>
                  {user.data.phoneNumber}
                </ThemedText>
              </View>
              <StatusChip status={user.data.status} />
            </View>
            <View style={adminStyles.labelValue}>
              <ThemedText type="featureLabel">Đăng nhập gần nhất</ThemedText>
              <ThemedText type="bodySmall" style={adminStyles.muted}>
                {formatDateTime(user.data.lastLoginAt)}
              </ThemedText>
            </View>
            <View style={adminStyles.labelValue}>
              <ThemedText type="featureLabel">Phiên bản phân quyền</ThemedText>
              <ThemedText type="bodySmall" style={adminStyles.muted}>
                v{user.data.authorizationVersion ?? 0}
              </ThemedText>
            </View>
          </AdminCard>
          <View style={adminStyles.actions}>
            <AdminButton
              label="Chỉnh sửa"
              variant="secondary"
              onPress={() => navigate(router, `/admin/users/${userId}/edit`)}
              style={adminStyles.grow}
            />
            <AdminButton
              label="Gán vai trò"
              onPress={() => navigate(router, `/admin/users/${userId}/roles`)}
              style={adminStyles.grow}
            />
          </View>
          <AdminSectionHeader
            title="Hồ sơ liên kết"
            actionLabel="Quản lý"
            onAction={() => navigate(router, `/admin/users/${userId}/profiles`)}
          />
          {linkedPeople.length === 0 ? (
            <AdminEmptyState message="Chưa liên kết hồ sơ" />
          ) : (
            <AdminCard style={userAdminStyles.zeroPadding}>
              {linkedPeople.map((person: PersonSimpleResponse) => (
                <AdminListRow
                  key={person.personId}
                  leading={<Avatar name={person.fullName} />}
                  title={person.fullName}
                  subtitle={person.personCode}
                  meta={
                    <AdminChip
                      label={person.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
                      tone={person.status === "ACTIVE" ? "success" : "neutral"}
                    />
                  }
                />
              ))}
            </AdminCard>
          )}
          <AdminSectionHeader title="Vai trò được gán" />
          {assignedRoles.length === 0 ? (
            <AdminEmptyState message="Chưa được gán vai trò" />
          ) : (
            <View style={adminStyles.chips}>
              {assignedRoles.map((role) => (
                <AdminChip key={role.code} label={role.name} tone="info" />
              ))}
            </View>
          )}
          <AdminButton
            label="Xóa người dùng"
            variant="text"
            onPress={() => setConfirming(true)}
          />
        </>
      )}
      <AdminConfirmDialog
        confirming={confirming}
        title="Xóa người dùng?"
        message="Tài khoản, vai trò và các liên kết hồ sơ của người dùng sẽ bị ảnh hưởng. Thao tác này không thể hoàn tác."
        confirmLabel="Xóa"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
      />
    </StackScreenLayout>
  );
}
