import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import {
  CheckListNotes,
  DocText,
  People,
  Trash6,
  Wallet,
} from "reicon-react-native";

import { Permission, useCan } from "@/features/authorization";
import {
  BeltLabel,
  PersonStatusLabel,
} from "@/features/person/constants/person.constants";
import {
  useDeletePerson,
  usePerson,
} from "@/features/person/queries/personQueries";
import { SurfaceCard } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type {
  StudentRouteProps,
  StudentSummaryView,
} from "@/features/student-commerce/types";
import {
  asHref,
  formatVnd,
} from "@/features/student-commerce/utils/studentCommerceUtils";
import { useWalletByPerson } from "@/features/wallet/queries/walletQueries";
import { useScreenRefresh } from "@/infrastructure/query/useScreenRefresh";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useDynamicDetailTitle } from "@/routes/navigation/utils/screenTitle";
import { AppIcon } from "@/shared/ui/AppIcon";
import { CancellableLoadingOverlay } from "@/shared/ui/CancellableLoadingOverlay";
import { ConfirmationDialog } from "@/shared/ui/ConfirmationDialog";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { NavigationMenu, NavigationMenuItem } from "@/shared/ui/NavigationMenu";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { Colors } from "@/theme";
import { StudentProfileSummaryCard } from "../components/StudentProfileSummaryCard";

export function StudentDetailScreen({ studentCode }: StudentRouteProps) {
  const router = useRouter();
  const personQuery = usePerson(studentCode);
  const deletePerson = useDeletePerson();
  const canDelete = useCan(Permission.PERSON_DELETE);
  const canDirectTopUp = useCan(Permission.WALLET_TOP_UP_DIRECT_CREATE);
  const canReadUserPersons = useCan(Permission.USER_PERSON_READ);
  const canReadUsers = useCan(Permission.USER_READ);
  const canViewUserAccounts = canReadUserPersons && canReadUsers;
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteController = useRef<AbortController | null>(null);

  const person = personQuery.data;
  const walletQuery = useWalletByPerson(person?.personId);
  const { refreshing, onRefresh } = useScreenRefresh([
    personQuery,
    walletQuery,
  ]);

  const student: StudentSummaryView | null = useMemo(() => {
    if (!person) return null;
    return {
      personId: person.personId,
      personCode:
        person.personCode || person.personId.substring(0, 8).toUpperCase(),
      fullName: person.fullName,
      birthDate: person.birthDate,
      beltLabel:
        BeltLabel[person.currentBelt] || person.currentBelt || "Chưa có đai",
      statusLabel:
        PersonStatusLabel[person.status] || person.status || "Đang hoạt động",
    };
  }, [person]);

  const title = useDynamicDetailTitle(student, { fallback: "Học viên" });
  const activeStudentId = student?.personId || studentCode || "";
  const handleDelete = async () => {
    if (!activeStudentId) return;
    setConfirmDelete(false);
    setDeleting(true);
    const controller = new AbortController();
    deleteController.current = controller;
    try {
      await deletePerson.mutateAsync({
        personId: activeStudentId,
        signal: controller.signal,
      });
      toast.show({ message: "Đã xóa học viên.", variant: "success" });
      router.replace(asHref("/students"));
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toast.show({ message: "Không thể xóa học viên.", variant: "error" });
      }
    } finally {
      deleteController.current = null;
      setDeleting(false);
    }
  };

  if (personQuery.isLoading && !student) {
    return (
      <StackScreenLayout
        title={title}
        contentContainerStyle={[styles.content, styles.center]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </StackScreenLayout>
    );
  }

  if (!personQuery.isLoading && !student) {
    return (
      <StackScreenLayout
        title={title}
        contentContainerStyle={[styles.content, styles.center]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <ThemedText type="bodySmall" style={styles.blackText}>
          Không tìm thấy thông tin học viên.
        </ThemedText>
      </StackScreenLayout>
    );
  }

  return (
    <StackScreenLayout
      title={title}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
      floatingContent={
        <FloatingActionBar
          actions={[
            ...(canDirectTopUp
              ? [
                  {
                    label: "Nạp tiền",
                    accessibilityLabel: "Nạp tiền cho học viên",
                    variant: "outline" as const,
                    onPress: () =>
                      router.push(
                        asHref(`/students/${activeStudentId}/top-up`),
                      ),
                  },
                ]
              : []),
            {
              label: "Đăng ký khóa học",
              accessibilityLabel: "Đăng ký khóa học cho học viên",
              variant: "primary",
              flex: 1.3,
              onPress: () =>
                router.push(
                  asHref(`/students/${activeStudentId}/course-registration`),
                ),
            },
            ...(canDelete
              ? [
                  {
                    key: "delete",
                    label: "",
                    accessibilityLabel: "Xóa học viên",
                    variant: "ghost" as const,
                    disabled: deleting,
                    onPress: () => setConfirmDelete(true),
                    flex: 0,
                    style: {
                      width: 44,
                      minWidth: 44,
                      paddingHorizontal: 0,
                      backgroundColor: "transparent",
                      borderWidth: 0,
                    },
                    icon: (
                      <AppIcon
                        icon={<Trash6 />}
                        size={30}
                        color={
                          deleting
                            ? Colors.light.textSecondary
                            : Colors.light.error
                        }
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      }
    >
      {student ? <StudentProfileSummaryCard student={student} /> : null}

      <SurfaceCard>
        <View style={styles.row}>
          <AppIcon icon={<Wallet />} size={24} color={Colors.light.primary} />
          <ThemedText type="bodySmall" style={styles.blackText}>
            Ví điện tử
          </ThemedText>
        </View>
        <ThemedText type="heading" style={styles.blackText}>
          {walletQuery.isLoading
            ? "Đang tải..."
            : walletQuery.data
              ? formatVnd(walletQuery.data.balance)
              : "Không có dữ liệu"}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Số dư khả dụng
        </ThemedText>
        <Pressable
          onPress={() =>
            router.push(asHref(`/students/${activeStudentId}/wallet`))
          }
        >
          <ThemedText type="action" style={styles.primaryText}>
            Xem chi tiết ví ›
          </ThemedText>
        </Pressable>
      </SurfaceCard>

      <NavigationMenu>
        <NavigationMenuItem
          icon={<DocText />}
          title="Khóa học đang học"
          count={0}
          onPress={() =>
            router.push(asHref(`/students/${activeStudentId}/courses`))
          }
        />
        <NavigationMenuItem
          icon={<CheckListNotes />}
          title="Lịch sử tập luyện"
          onPress={() => router.push(asHref("/history/student"))}
        />
        {canViewUserAccounts ? (
          <NavigationMenuItem
            icon={<People />}
            title="Tài khoản người dùng"
            onPress={() =>
              router.push(asHref(`/students/${activeStudentId}/users`))
            }
          />
        ) : null}
      </NavigationMenu>
      <ConfirmationDialog
        visible={confirmDelete}
        title="Xóa học viên"
        description={`Bạn có chắc muốn xóa học viên "${student?.fullName ?? "này"}" không? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        confirmVariant="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <CancellableLoadingOverlay
        visible={deleting}
        message="Đang xóa học viên..."
        cancelLabel="Hủy"
        onCancel={() => deleteController.current?.abort()}
      />
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 128,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  blackText: {
    color: Colors.light.text,
  },
  primaryText: {
    color: Colors.light.primary,
  },
});
