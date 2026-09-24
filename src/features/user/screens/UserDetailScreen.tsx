import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import type { PersonBriefResponse } from "@/features/person";
import { useScreenRefresh } from "@/infrastructure/query/useScreenRefresh";
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
import { formatDateDMY, formatDateTime } from "@/shared/utils/dateTime";
import { userApi } from "../api/userApi";
import { userKeys, useUser } from "../queries/userQueries";

import {
  Avatar,
  getPrimaryPerson,
  navigate,
  StatusChip,
  userAdminStyles,
  useUserId,
} from "./userAdministrationShared";

export function UserDetailScreen() {
  const router = useRouter();
  const userId = useUserId();
  const user = useUser(userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const { refreshing, onRefresh } = useScreenRefresh([user]);

  const primaryPerson = getPrimaryPerson(user.data);
  const linkedPeople: PersonBriefResponse[] = user.data?.persons ?? [];
  const assignedRoles = user.data?.roles ?? [];

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
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {user.isPending ? (
        <AdminLoadingState />
      ) : !user.data ? (
        <AdminEmptyState message="Không tìm thấy người dùng" />
      ) : (
        <>
          <AdminCard style={adminStyles.gap}>
            <View style={userAdminStyles.titleRow}>
              <Avatar name={user.data.phoneNumber?.substring(8)} />
              <View style={adminStyles.grow}>
                <ThemedText type="heading">{user.data.phoneNumber}</ThemedText>
                <ThemedText type="bodySmall" style={adminStyles.muted}>
                  Được tạo: {formatDateDMY(user.data.createdAt)}
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
              {linkedPeople.map((person: PersonBriefResponse) => (
                <AdminListRow
                  key={person.personId}
                  leading={<Avatar name={person.fullName} />}
                  title={person.fullName}
                  subtitle={person.personCode}
                  meta={
                    <AdminChip
                      label={
                        person.status === "ACTIVE"
                          ? "Hoạt động"
                          : "Ngừng hoạt động"
                      }
                      tone={person.status === "ACTIVE" ? "success" : "neutral"}
                    />
                  }
                />
              ))}
            </AdminCard>
          )}
          <AdminSectionHeader
            title="Vai trò được gán"
            actionLabel="Quản lý"
            onAction={() => navigate(router, `/admin/users/${userId}/roles`)}
          />
          {assignedRoles.length === 0 ? (
            <AdminEmptyState message="Chưa được gán vai trò" />
          ) : (
            <AdminCard style={userAdminStyles.zeroPadding}>
              {assignedRoles.map((role) => (
                <AdminListRow
                  key={role.code}
                  leading={<Avatar name={role.name} />}
                  title={role.name}
                  subtitle={role.code}
                  meta={
                    role.permissionVersion !== undefined ? (
                      <AdminChip
                        label={`v${role.permissionVersion}`}
                        tone="info"
                      />
                    ) : (
                      <AdminChip label="Vai trò" tone="info" />
                    )
                  }
                  onPress={() =>
                    navigate(router, `/admin/users/${userId}/roles`)
                  }
                />
              ))}
            </AdminCard>
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
