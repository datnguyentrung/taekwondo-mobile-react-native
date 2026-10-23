import { getApiErrorMessage } from "@/infrastructure/http/httpError";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { CancellableLoadingOverlay } from "@/shared/ui/CancellableLoadingOverlay";
import { ConfirmationDialog } from "@/shared/ui/ConfirmationDialog";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import {
  AdminCard,
  AdminChip,
  AdminListRow,
  AdminSectionHeader,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { Colors, Spacing } from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { ChevronRight, Trash6 } from "reicon-react-native";
import { TrainingPlanFormSheet } from "../components/TrainingPlanFormSheet";
import {
  useDeleteTrainingPlan,
  useTrainingPlan,
  useUpdateTrainingPlan,
} from "../queries/trainingPlanQueries";
import { PlanCard, levelLabel } from "./TrainingPlanManagementScreen";

export function TrainingPlanDetailScreen() {
  const { trainingPlanId } = useLocalSearchParams<{ trainingPlanId: string }>();
  const router = useRouter();
  const toast = useToast();
  const query = useTrainingPlan(trainingPlanId);
  const update = useUpdateTrainingPlan();
  const remove = useDeleteTrainingPlan();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteController = useRef<AbortController | null>(null);
  const plan = query.data;
  if (query.isPending)
    return (
      <StackScreenLayout title="Chi tiết gói học">
        <ActivityIndicator color={Colors.light.primary} />
      </StackScreenLayout>
    );
  if (!plan)
    return (
      <StackScreenLayout title="Chi tiết gói học">
        <ThemedText type="bodySmall">Không tìm thấy gói học.</ThemedText>
      </StackScreenLayout>
    );
  const handleDelete = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    const controller = new AbortController();
    deleteController.current = controller;
    try {
      await remove.mutateAsync({
        id: plan.trainingPlanId,
        signal: controller.signal,
      });
      toast.show({ message: "Đã xóa gói học.", variant: "success" });
      router.replace("/admin/training-plans" as never);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toast.show({
          message: getApiErrorMessage(error, "Không thể xóa gói học."),
          variant: "error",
        });
      }
    } finally {
      deleteController.current = null;
      setDeleting(false);
    }
  };
  return (
    <>
      <StackScreenLayout
        title="Chi tiết gói học"
        contentContainerStyle={styles.content}
        onRefresh={async () => {
          await query.refetch();
        }}
        refreshing={query.isRefetching}
        floatingContent={
          <FloatingActionBar
            actions={[
              {
                label: "Chỉnh sửa",
                accessibilityLabel: "Chỉnh sửa gói học",
                variant: "outline",
                onPress: () => setEditing(true),
              },
              {
                label: "Đăng ký",
                accessibilityLabel: "Đăng ký gói học",
                variant: "primary",
                onPress: () =>
                  toast.show({
                    message: "Mở luồng đăng ký học viên từ hồ sơ học viên.",
                    variant: "info",
                  }),
              },
              {
                key: "delete",
                label: "",
                accessibilityLabel: "Xóa gói học",
                variant: "outline",
                onPress: () => setConfirmDelete(true),
                disabled: deleting,
                icon: (
                  <AppIcon
                    icon={<Trash6 />}
                    size={30}
                    color={
                      deleting ? Colors.light.textSecondary : Colors.light.error
                    }
                  />
                ),
                style: {
                  flex: 0,
                  minWidth: 48,
                  paddingHorizontal: 6,
                  borderWidth: 0,
                  backgroundColor: "transparent",
                },
              },
            ]}
          />
        }
      >
        <PlanCard plan={plan} />
        <AdminCard>
          <AdminSectionHeader title="Thông tin cơ bản" />
          {[
            ["Tên gói học", plan.name],
            ["Cấp độ", levelLabel(plan.level)],
            ["Thời lượng", `${plan.durationMonths} tháng`],
            ["Số buổi gồm trong gói", `${plan.includedSessionCount} buổi`],
            [
              "Giá gốc",
              new Intl.NumberFormat("vi-VN").format(plan.basePrice) + "đ",
            ],
            [
              "Giá bán",
              new Intl.NumberFormat("vi-VN").format(plan.finalPrice) + "đ",
            ],
          ].map(([key, value]) => (
            <View key={key} style={styles.info}>
              <ThemedText type="bodySmall" style={styles.muted}>
                {key}
              </ThemedText>
              <ThemedText type="bodySmall">{value}</ThemedText>
            </View>
          ))}
        </AdminCard>
        <AdminCard>
          <AdminSectionHeader title="Cấu hình liên quan" />
          <Config
            title="Yêu cầu buổi tập"
            count={plan.requirements.length}
            onPress={() =>
              router.push(
                `/admin/training-plans/${plan.trainingPlanId}/requirements-addons` as never,
              )
            }
          />
          <Config
            title="Khóa học áp dụng"
            count={plan.accessRules.length}
            onPress={() =>
              router.push(
                `/admin/training-plans/${plan.trainingPlanId}/courses` as never,
              )
            }
          />
          <Config
            title="Add-on"
            count={plan.addons.length}
            onPress={() =>
              router.push(
                `/admin/training-plans/${plan.trainingPlanId}/requirements-addons` as never,
              )
            }
          />
        </AdminCard>
        <AdminCard>
          <AdminSectionHeader title="Tóm tắt cấu hình" />
          {plan.requirements.map((item) => (
            <AdminListRow
              key={item.trainingPlanRequirementId}
              title={session(item.sessionType)}
              subtitle={`${item.sessionsPerWeek} buổi/tuần`}
            />
          ))}
          {plan.addons.map((item) => (
            <AdminListRow
              key={item.trainingPlanAddonId}
              title={item.name}
              subtitle={`+${item.extraSessionsPerWeek} buổi/tuần · ${new Intl.NumberFormat("vi-VN").format(item.price)}đ`}
              meta={
                <AdminChip
                  label={item.status === "ACTIVE" ? "Đang bán" : "Tạm dừng"}
                  tone={item.status === "ACTIVE" ? "success" : "danger"}
                />
              }
            />
          ))}
        </AdminCard>
      </StackScreenLayout>
      <TrainingPlanFormSheet
        visible={editing}
        plan={plan}
        submitting={update.isPending}
        onClose={() => setEditing(false)}
        onSubmit={async (request) => {
          try {
            await update.mutateAsync({ id: plan.trainingPlanId, request });
            setEditing(false);
            toast.show({ message: "Đã lưu thay đổi.", variant: "success" });
          } catch (error) {
            toast.show({
              message: getApiErrorMessage(error, "Không thể lưu gói học."),
              variant: "error",
            });
          }
        }}
      />
      <ConfirmationDialog
        visible={confirmDelete}
        title="Xóa gói học"
        description={`Bạn có chắc muốn xóa gói học "${plan.name}" không? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        confirmVariant="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <CancellableLoadingOverlay
        visible={deleting}
        message="Đang xóa gói học..."
        cancelLabel="Hủy"
        onCancel={() => deleteController.current?.abort()}
      />
    </>
  );
}
function Config({
  title,
  count,
  onPress,
}: {
  title: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.config}
    >
      <View style={styles.flex}>
        <ThemedText type="featureLabel">{title}</ThemedText>
        <ThemedText type="bodySmall" style={styles.muted}>
          {count} mục
        </ThemedText>
      </View>
      <AppIcon
        icon={<ChevronRight />}
        size={20}
        color={Colors.light.textSecondary}
      />
    </Pressable>
  );
}
const session = (v: string) =>
  ({ REQUIRED: "Buổi bắt buộc", STANDARD: "Buổi tiêu chuẩn", OPEN: "Buổi mở" })[
    v
  ] ?? v;
const styles = StyleSheet.create({
  content: { paddingTop: Spacing.two, paddingBottom: 110, gap: Spacing.two },
  info: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    gap: 16,
  },
  muted: { color: Colors.light.textSecondary },
  config: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
  },
  flex: { flex: 1, gap: 2 },
});
