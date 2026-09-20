import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  AdminChip,
  AdminEmptyState,
  AdminIntro,
  AdminListRow,
  AdminLoadingState,
  AdminSearchField,
  AdminSectionHeader,
  adminStyles,
} from "@/shared/ui/admin/AdministrationPrimitives";
import type { UserSimpleResponse } from "../api/user.dto";
import type { UserStatus } from "../constants/user.constants";
import { useUsers } from "../queries/userQueries";

import {
  Avatar,
  getPrimaryPerson,
  navigate,
  StatusChip,
  userAdminStyles,
} from "./userAdministrationShared";

export function UserListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | UserStatus>("ALL");

  const debouncedSearch = useDebounce(search.trim(), 400);
  const queryParams = useMemo(
    () => (debouncedSearch ? { search: debouncedSearch } : undefined),
    [debouncedSearch],
  );
  const users = useUsers(queryParams);

  const visible = (users.data?.content ?? []).filter(
    (user: UserSimpleResponse) =>
      status === "ALL" || user.status === status,
  );

  return (
    <StackScreenLayout
      title="Người dùng"
      contentContainerStyle={adminStyles.screen}
    >
      <AdminIntro>
        Quản lý tài khoản, hồ sơ liên kết và vai trò truy cập.
      </AdminIntro>
      <AdminSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm số điện thoại hoặc tên hồ sơ"
      />
      <View style={adminStyles.chips}>
        <AdminChip
          label="Tất cả"
          selected={status === "ALL"}
          onPress={() => setStatus("ALL")}
        />
        <AdminChip
          label="Hoạt động"
          selected={status === "ACTIVE"}
          onPress={() => setStatus("ACTIVE")}
        />
        <AdminChip
          label="Chờ kích hoạt"
          selected={status === "PENDING"}
          onPress={() => setStatus("PENDING")}
        />
      </View>
      <AdminSectionHeader
        title={`${users.data?.totalElements ?? 0} người dùng`}
        actionLabel="Tạo người dùng"
        onAction={() => navigate(router, "/admin/users/create")}
      />
      {users.isPending ? (
        <AdminLoadingState />
      ) : visible.length === 0 ? (
        <AdminEmptyState message="Không tìm thấy người dùng phù hợp" />
      ) : (
        <View style={userAdminStyles.list}>
          {visible.map((user: UserSimpleResponse) => {
            const person = getPrimaryPerson(user);
            return (
              <AdminListRow
                key={user.userId}
                leading={<Avatar name={person?.fullName ?? user.phoneNumber} />}
                title={user.phoneNumber}
                subtitle={
                  user.persons && user.persons.length > 0
                    ? user.persons.map((p) => `• ${p.fullName}`).join("\n")
                    : "• Chưa liên kết hồ sơ"
                }
                meta={<StatusChip status={user.status} />}
                onPress={() => navigate(router, `/admin/users/${user.userId}`)}
              />
            );
          })}
        </View>
      )}
    </StackScreenLayout>
  );
}
