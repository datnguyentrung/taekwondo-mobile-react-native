import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { PermissionsTabContent } from "@/features/permissions";
import { groupPermissions } from "@/features/permissions/domain/permissionViewModel";
import { usePermissionsCatalog } from "@/features/permissions/queries/permissionQueries";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import {
  AdminButton,
  AdminCard,
  AdminChip,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminField,
  AdminInfoBanner,
  AdminIntro,
  AdminListRow,
  AdminLoadingState,
  AdminSearchField,
  AdminSectionHeader,
  AdminTabs,
  adminStyles,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { containsSearch } from "@/shared/utils/string";
import { Colors, radii } from "@/theme";
import { roleApi } from "../api/roleApi";
import { rolePermissionApi } from "../api/rolePermissionApi";
import { permissionCodesForRole } from "../domain/roleViewModel";
import {
  roleKeys,
  useRole,
  useRolePermissions,
  useRoles,
} from "../queries/roleQueries";

const tabs = [
  { value: "roles", label: "Vai trò" },
  { value: "permissions", label: "Quyền" },
] as const;

function go(router: ReturnType<typeof useRouter>, path: string) {
  router.push(path as Href);
}

function useRoleCode() {
  const { roleCode } = useLocalSearchParams<{ roleCode: string }>();
  return Array.isArray(roleCode) ? roleCode[0] : roleCode;
}

function RolesTabContent() {
  const router = useRouter();
  const roles = useRoles();
  const assignments = useRolePermissions();
  const [search, setSearch] = useState("");
  const visibleRoles = (roles.data?.content ?? []).filter((role) =>
    containsSearch(search, role.name, role.code),
  );

  return (
    <>
      <AdminSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo tên hoặc mã vai trò"
      />
      <AdminSectionHeader
        title={`${visibleRoles.length} vai trò`}
        actionLabel="Tạo vai trò"
        onAction={() => go(router, "/admin/roles/create")}
      />
      {roles.isPending || assignments.isPending ? (
        <AdminLoadingState />
      ) : visibleRoles.length === 0 ? (
        <AdminEmptyState message="Không tìm thấy vai trò phù hợp" />
      ) : (
        <View style={styles.list}>
          {visibleRoles.map((role) => {
            const count = (assignments.data?.content ?? []).filter(
              (item) => item.roleCode === role.code,
            ).length;
            return (
              <AdminListRow
                key={role.code}
                title={role.name}
                subtitle={`${role.code} · ${count} quyền`}
                onPress={() => go(router, `/admin/roles/${role.code}`)}
              />
            );
          })}
        </View>
      )}
    </>
  );
}

export function RoleListScreen({
  initialTab,
}: { initialTab?: "roles" | "permissions" } = {}) {
  const { tab } = useLocalSearchParams<{ tab?: "roles" | "permissions" }>();
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">(() => {
    if (initialTab) return initialTab;
    if (tab === "permissions" || tab === "roles") return tab;
    return "roles";
  });

  return (
    <StackScreenLayout
      title="Vai trò & quyền"
      contentContainerStyle={adminStyles.screen}
    >
      <AdminTabs
        items={tabs}
        value={activeTab}
        onChange={(value) => setActiveTab(value as "roles" | "permissions")}
      />
      <AdminIntro>
        {activeTab === "roles"
          ? "Quản lý vai trò và tập quyền truy cập trong hệ thống."
          : "Danh mục quyền kỹ thuật được dùng để cấu hình các vai trò."}
      </AdminIntro>
      {activeTab === "roles" ? <RolesTabContent /> : <PermissionsTabContent />}
    </StackScreenLayout>
  );
}

export function RoleDetailScreen() {
  const router = useRouter();
  const roleCode = useRoleCode();
  const role = useRole(roleCode);
  const assignments = useRolePermissions();
  const permissions = usePermissionsCatalog();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => roleApi.remove(roleCode as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.show({ message: "Đã xóa vai trò", variant: "success" });
      setConfirming(false);
      router.replace("/admin/roles" as Href);
    },
    onError: () =>
      toast.show({
        message: "Không thể xóa vai trò đang được sử dụng",
        variant: "error",
      }),
  });
  const codes = permissionCodesForRole(
    roleCode ?? "",
    assignments.data?.content ?? [],
  );
  const assigned = (permissions.data?.content ?? []).filter((permission) =>
    codes.includes(permission.code),
  );
  const grouped = groupPermissions(assigned);

  return (
    <StackScreenLayout
      title="Chi tiết vai trò"
      contentContainerStyle={adminStyles.screen}
    >
      {role.isPending ? (
        <AdminLoadingState />
      ) : !role.data ? (
        <AdminEmptyState message="Không tìm thấy vai trò" />
      ) : (
        <>
          <AdminCard style={adminStyles.gap}>
            <ThemedText type="heading">{role.data.name}</ThemedText>
            <ThemedText type="code" style={styles.code}>
              {role.data.code}
            </ThemedText>
            <ThemedText type="bodySmall" style={adminStyles.muted}>
              {role.data.description || "Chưa có mô tả"}
            </ThemedText>
            <View style={styles.stats}>
              <View>
                <ThemedText type="heading">{assigned.length}</ThemedText>
                <ThemedText type="bodySmall" style={adminStyles.muted}>
                  Quyền
                </ThemedText>
              </View>
              <View>
                <ThemedText type="heading">
                  v{role.data.permissionVersion}
                </ThemedText>
                <ThemedText type="bodySmall" style={adminStyles.muted}>
                  Phiên bản
                </ThemedText>
              </View>
            </View>
          </AdminCard>
          <View style={adminStyles.actions}>
            <AdminButton
              label="Chỉnh sửa"
              variant="secondary"
              onPress={() => go(router, `/admin/roles/${roleCode}/edit`)}
              style={adminStyles.grow}
            />
            <AdminButton
              label="Phân quyền"
              onPress={() => go(router, `/admin/roles/${roleCode}/permissions`)}
              style={adminStyles.grow}
            />
          </View>
          <AdminSectionHeader title="Quyền đã gán" />
          {Object.entries(grouped).length === 0 ? (
            <AdminEmptyState message="Vai trò chưa được gán quyền" />
          ) : (
            Object.entries(grouped).map(([model, items]) => (
              <AdminCard key={model} style={adminStyles.gap}>
                <ThemedText type="title">{model}</ThemedText>
                <View style={adminStyles.chips}>
                  {items.map((permission) => (
                    <AdminChip
                      key={permission.code}
                      label={permission.action}
                      tone="info"
                    />
                  ))}
                </View>
              </AdminCard>
            ))
          )}
          <AdminButton
            label="Xóa vai trò"
            variant="text"
            onPress={() => setConfirming(true)}
          />
        </>
      )}
      <AdminConfirmDialog
        confirming={confirming}
        title="Xóa vai trò?"
        message={`Vai trò “${role.data?.name ?? roleCode}” sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
      />
    </StackScreenLayout>
  );
}

type RoleFormProps = { mode: "create" | "edit" };

function RoleFormScreen({ mode }: RoleFormProps) {
  const router = useRouter();
  const roleCodeParam = useRoleCode();
  const role = useRole(mode === "edit" ? roleCodeParam : undefined);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("0");
  const [confirming, setConfirming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!role.data) return;
    // Async server state seeds an editable draft when the record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(role.data.code);
    setName(role.data.name);
    setDescription(role.data.description);
    setVersion(String(role.data.permissionVersion));
  }, [role.data]);

  const save = useMutation({
    mutationFn: async () =>
      mode === "create"
        ? roleApi.create({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            description: description.trim(),
            permissionVersion: Number(version) || 0,
          })
        : roleApi.update(roleCodeParam as string, {
            name: name.trim(),
            description: description.trim(),
            permissionVersion: Number(version) || 0,
          }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.show({
        message: mode === "create" ? "Đã tạo vai trò" : "Đã cập nhật vai trò",
        variant: "success",
      });
      setConfirming(false);
      router.replace(
        (mode === "create"
          ? `/admin/roles/${saved.code}/permissions`
          : `/admin/roles/${saved.code}`) as Href,
      );
    },
    onError: () =>
      toast.show({
        message: "Không thể lưu vai trò. Vui lòng kiểm tra dữ liệu.",
        variant: "error",
      }),
  });
  const remove = useMutation({
    mutationFn: () => roleApi.remove(roleCodeParam as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      router.replace("/admin/roles" as Href);
    },
    onError: () =>
      toast.show({ message: "Không thể xóa vai trò", variant: "error" }),
  });
  const valid = code.trim().length > 1 && name.trim().length > 1;

  return (
    <StackScreenLayout
      title={mode === "create" ? "Tạo vai trò" : "Sửa vai trò"}
      contentContainerStyle={adminStyles.screen}
    >
      <AdminField
        label="Mã vai trò"
        value={code}
        onChangeText={setCode}
        editable={mode === "create"}
        placeholder="Ví dụ: ROLE_MANAGER"
        helper={
          mode === "edit"
            ? "Mã vai trò không thể thay đổi."
            : "Dùng chữ in hoa và dấu gạch dưới."
        }
      />
      <AdminField
        label="Tên vai trò"
        value={name}
        onChangeText={setName}
        placeholder="Nhập tên hiển thị"
      />
      <AdminField
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Mô tả phạm vi trách nhiệm"
      />
      <AdminField
        label="Phiên bản quyền"
        value={version}
        onChangeText={setVersion}
        keyboardType="number-pad"
        helper="Tăng phiên bản để buộc phiên đăng nhập làm mới quyền."
      />
      {mode === "edit" ? (
        <AdminInfoBanner>
          Mọi thay đổi quyền cần được kiểm tra với các tài khoản đang mang vai
          trò này.
        </AdminInfoBanner>
      ) : null}
      <AdminButton
        label={mode === "create" ? "Tạo vai trò" : "Lưu thay đổi"}
        disabled={!valid}
        onPress={() => setConfirming(true)}
      />
      {mode === "edit" ? (
        <AdminButton
          label="Xóa vai trò"
          variant="text"
          onPress={() => setConfirmDelete(true)}
        />
      ) : (
        <AdminButton
          label="Hủy"
          variant="secondary"
          onPress={() => router.back()}
        />
      )}
      <AdminConfirmDialog
        confirming={confirming}
        title={mode === "create" ? "Tạo vai trò mới?" : "Lưu thay đổi?"}
        message={
          mode === "create"
            ? `Vai trò “${name}” sẽ được tạo và chuyển sang bước phân quyền.`
            : "Thông tin vai trò sẽ được cập nhật ngay."
        }
        confirmLabel={mode === "create" ? "Tạo mới" : "Lưu"}
        loading={save.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => save.mutate()}
      />
      <AdminConfirmDialog
        confirming={confirmDelete}
        title="Xóa vai trò?"
        message="Vai trò sẽ bị xóa vĩnh viễn và không thể hoàn tác."
        confirmLabel="Xóa"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </StackScreenLayout>
  );
}

export function RoleCreateScreen() {
  return <RoleFormScreen mode="create" />;
}
export function RoleEditScreen() {
  return <RoleFormScreen mode="edit" />;
}

export function RolePermissionsScreen() {
  const router = useRouter();
  const roleCode = useRoleCode();
  const role = useRole(roleCode);
  const permissions = usePermissionsCatalog();
  const assignments = useRolePermissions();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    // The selection draft is initialized from the separately loaded assignment resource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(
      permissionCodesForRole(roleCode ?? "", assignments.data?.content ?? []),
    );
  }, [assignments.data, roleCode]);
  const filtered = (permissions.data?.content ?? []).filter((item) =>
    containsSearch(search, item.code, item.model, item.action),
  );
  const groups = groupPermissions(filtered);
  const save = useMutation({
    mutationFn: () =>
      rolePermissionApi.replaceForRole(roleCode as string, {
        permissionCodes: selected,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.permissions });
      toast.show({
        message: "Đã cập nhật quyền của vai trò",
        variant: "success",
      });
      router.replace(`/admin/roles/${roleCode}` as Href);
    },
    onError: () =>
      toast.show({
        message: "Không thể cập nhật phân quyền",
        variant: "error",
      }),
  });
  const toggle = (code: string) =>
    setSelected((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );

  return (
    <StackScreenLayout
      title="Phân quyền"
      contentContainerStyle={adminStyles.screen}
    >
      <AdminCard>
        <ThemedText type="title">{role.data?.name ?? roleCode}</ThemedText>
        <ThemedText type="bodySmall" style={adminStyles.muted}>
          {selected.length} quyền được chọn
        </ThemedText>
      </AdminCard>
      <AdminSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm quyền hoặc phân hệ"
      />
      {permissions.isPending || assignments.isPending ? (
        <AdminLoadingState />
      ) : (
        Object.entries(groups).map(([model, items]) => (
          <AdminCard key={model} style={adminStyles.gap}>
            <ThemedText type="title">{model}</ThemedText>
            <View style={adminStyles.chips}>
              {items.map((permission) => (
                <AdminChip
                  key={permission.code}
                  label={permission.action}
                  selected={selected.includes(permission.code)}
                  onPress={() => toggle(permission.code)}
                />
              ))}
            </View>
          </AdminCard>
        ))
      )}
      <View style={adminStyles.actions}>
        <AdminButton
          label="Đặt lại"
          variant="secondary"
          onPress={() =>
            setSelected(
              permissionCodesForRole(
                roleCode ?? "",
                assignments.data?.content ?? [],
              ),
            )
          }
          style={adminStyles.grow}
        />
        <AdminButton
          label="Lưu phân quyền"
          loading={save.isPending}
          onPress={() => save.mutate()}
          style={adminStyles.grow}
        />
      </View>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { overflow: "hidden", borderRadius: radii.md },
  code: {
    alignSelf: "flex-start",
    color: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
  },
});
