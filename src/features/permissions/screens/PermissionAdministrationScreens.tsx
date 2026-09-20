import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { permissionApi } from "../api/permissionApi";
import {
  PermissionActionValues,
  type PermissionAction,
} from "../constants/permissions.constants";
import { groupPermissions } from "../domain/permissionViewModel";
import {
  permissionKeys,
  usePermission,
  usePermissionsCatalog,
} from "../queries/permissionQueries";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import {
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminField,
  AdminInfoBanner,
  AdminIntro,
  AdminListRow,
  AdminLoadingState,
  AdminPickerField,
  AdminPickerSheet,
  AdminSearchField,
  AdminSectionHeader,
  AdminTabs,
  adminStyles,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { containsSearch } from "@/shared/utils/string";
import { Colors, radii } from "@/theme";

const tabs = [
  { value: "roles", label: "Vai trò" },
  { value: "permissions", label: "Quyền" },
] as const;

function go(router: ReturnType<typeof useRouter>, path: string) {
  router.push(path as Href);
}

function usePermissionId() {
  const { permissionId } = useLocalSearchParams<{ permissionId: string }>();
  const value = Array.isArray(permissionId) ? permissionId[0] : permissionId;
  const id = Number(value);
  return Number.isFinite(id) ? id : undefined;
}

export function PermissionListScreen() {
  const router = useRouter();
  const permissions = usePermissionsCatalog();
  const [search, setSearch] = useState("");
  const filtered = (permissions.data?.content ?? []).filter((item) =>
    containsSearch(search, item.code, item.model, item.action),
  );
  const groups = groupPermissions(filtered);

  return (
    <StackScreenLayout
      title="Vai trò & quyền"
      contentContainerStyle={adminStyles.screen}
    >
      <AdminIntro>
        Danh mục quyền kỹ thuật được dùng để cấu hình các vai trò.
      </AdminIntro>
      <AdminTabs
        items={tabs}
        value="permissions"
        onChange={(value) =>
          value === "roles" && router.replace("/admin/roles" as Href)
        }
      />
      <AdminSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo mã, phân hệ hoặc hành động"
      />
      <AdminSectionHeader
        title={`${filtered.length} quyền`}
        actionLabel="Tạo quyền"
        onAction={() => go(router, "/admin/permissions/create")}
      />
      {permissions.isPending ? (
        <AdminLoadingState />
      ) : Object.entries(groups).length === 0 ? (
        <AdminEmptyState message="Không tìm thấy quyền phù hợp" />
      ) : (
        Object.entries(groups).map(([model, items]) => (
          <AdminCard key={model} style={styles.permissionGroup}>
            <ThemedText type="title" style={styles.groupTitle}>
              {model}
            </ThemedText>
            {items.map((item) => (
              <AdminListRow
                key={item.permissionId}
                title={item.code}
                subtitle={item.action}
                onPress={() =>
                  go(router, `/admin/permissions/${item.permissionId}/edit`)
                }
              />
            ))}
          </AdminCard>
        ))
      )}
    </StackScreenLayout>
  );
}

function PermissionFormScreen({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const permissionId = usePermissionId();
  const permission = usePermission(mode === "edit" ? permissionId : undefined);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [model, setModel] = useState("");
  const [action, setAction] = useState<PermissionAction>("READ");
  const [description, setDescription] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!permission.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(permission.data.code);
    setModel(permission.data.model);
    setAction(permission.data.action);
    setDescription(permission.data.description);
  }, [permission.data]);

  const save = useMutation({
    mutationFn: () =>
      mode === "create"
        ? permissionApi.create({
            code: code.trim().toUpperCase(),
            model: model.trim().toUpperCase(),
            action,
            description: description.trim(),
          })
        : permissionApi.update(permissionId as number, {
            code: code.trim().toUpperCase(),
            model: model.trim().toUpperCase(),
            action,
            description: description.trim(),
          }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      toast.show({
        message: mode === "create" ? "Đã tạo quyền" : "Đã cập nhật quyền",
        variant: "success",
      });
      setConfirming(false);
      router.replace("/admin/permissions" as Href);
    },
    onError: () => toast.show({ message: "Không thể lưu quyền", variant: "error" }),
  });
  const remove = useMutation({
    mutationFn: () => permissionApi.remove(permissionId as number),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      router.replace("/admin/permissions" as Href);
    },
    onError: () =>
      toast.show({
        message: "Không thể xóa quyền đang được sử dụng",
        variant: "error",
      }),
  });
  const valid = code.trim().length > 2 && model.trim().length > 1;
  const options = useMemo(
    () => PermissionActionValues.map((value) => ({ value, label: value })),
    [],
  );

  return (
    <StackScreenLayout
      title={mode === "create" ? "Tạo quyền" : "Sửa quyền"}
      contentContainerStyle={adminStyles.screen}
    >
      <AdminField
        label="Mã quyền"
        value={code}
        onChangeText={setCode}
        placeholder="Ví dụ: USER_READ"
      />
      <AdminField
        label="Phân hệ"
        value={model}
        onChangeText={setModel}
        placeholder="Ví dụ: USER"
      />
      <AdminPickerField
        label="Hành động"
        valueLabel={action}
        placeholder="Chọn hành động"
        onPress={() => setSheetVisible(true)}
      />
      <AdminField
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Mô tả phạm vi quyền"
      />
      <AdminInfoBanner tone="warning">
        Mã quyền phải trùng với authority ở backend. Thay đổi mã có thể làm mất
        quyền truy cập hiện tại.
      </AdminInfoBanner>
      <AdminButton
        label={mode === "create" ? "Tạo quyền" : "Lưu thay đổi"}
        disabled={!valid}
        onPress={() => setConfirming(true)}
      />
      {mode === "edit" ? (
        <AdminButton
          label="Xóa quyền"
          variant="text"
          onPress={() => setConfirmDelete(true)}
        />
      ) : (
        <AdminButton label="Hủy" variant="secondary" onPress={() => router.back()} />
      )}
      <AdminPickerSheet
        visible={sheetVisible}
        title="Chọn hành động"
        options={options}
        selectedValue={action}
        onSelect={(value) => setAction(value as PermissionAction)}
        onClose={() => setSheetVisible(false)}
      />
      <AdminConfirmDialog
        confirming={confirming}
        title={mode === "create" ? "Tạo quyền mới?" : "Lưu thay đổi?"}
        message={`Quyền ${code || "mới"} sẽ được ${
          mode === "create" ? "tạo" : "cập nhật"
        } trong danh mục hệ thống.`}
        confirmLabel={mode === "create" ? "Tạo mới" : "Lưu"}
        loading={save.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => save.mutate()}
      />
      <AdminConfirmDialog
        confirming={confirmDelete}
        title="Xóa quyền?"
        message="Quyền sẽ bị gỡ khỏi danh mục và các vai trò liên quan."
        confirmLabel="Xóa"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </StackScreenLayout>
  );
}

export function PermissionCreateScreen() {
  return <PermissionFormScreen mode="create" />;
}

export function PermissionEditScreen() {
  return <PermissionFormScreen mode="edit" />;
}

const styles = StyleSheet.create({
  permissionGroup: { padding: 0, overflow: "hidden" },
  groupTitle: {
    padding: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
});
