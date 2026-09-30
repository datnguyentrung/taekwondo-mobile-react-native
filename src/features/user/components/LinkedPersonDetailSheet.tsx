import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Briefcase,
  Calendar,
  ChevronRight,
  ShieldTick,
  User,
} from "reicon-react-native";

import type { PersonSimpleResponse } from "@/features/person";
import { BeltLabel } from "@/features/person/constants/person.constants";
import { useUpdatePerson } from "@/features/person/queries/personQueries";
import { usePositions } from "@/features/position/queries/positionQueries";
import { AdminButton } from "@/shared/ui/admin/AdministrationPrimitives";
import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { PickerPopover } from "@/shared/ui/PickerPopover";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { formatDateDMY } from "@/shared/utils/dateTime";
import { radii } from "@/theme";
import { userKeys } from "../queries/userQueries";
import { Avatar } from "../screens/userAdministrationShared";

export interface LinkedPersonDetailSheetProps {
  person: PersonSimpleResponse | null;
  userId?: string;
  onClose: () => void;
}

export function LinkedPersonDetailSheet({
  person,
  userId,
  onClose,
}: LinkedPersonDetailSheetProps) {
  const [prevPersonId, setPrevPersonId] = useState<string | undefined>(
    person?.personId,
  );
  const [overridePosition, setOverridePosition] = useState<
    PersonSimpleResponse["position"] | undefined
  >(undefined);
  const [positionPickerOpen, setPositionPickerOpen] = useState(false);

  const positions = usePositions();
  const updatePerson = useUpdatePerson();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Sync state during render when person prop changes
  if (person?.personId !== prevPersonId) {
    setPrevPersonId(person?.personId);
    setOverridePosition(undefined);
    setPositionPickerOpen(false);
  }

  const currentPerson: PersonSimpleResponse | null = person
    ? {
        ...person,
        position:
          overridePosition !== undefined ? overridePosition : person.position,
      }
    : null;

  const handleSelectPosition = (newPosId: string) => {
    if (!currentPerson) return;
    const targetPositionId = newPosId ? newPosId : null;

    updatePerson.mutate(
      {
        personId: currentPerson.personId,
        request: {
          fullName: currentPerson.fullName,
          gender: Boolean(currentPerson.gender),
          birthDate: currentPerson.birthDate,
          personCode: currentPerson.personCode,
          currentBelt: currentPerson.currentBelt,
          status: currentPerson.status,
          faceImagePath: currentPerson.faceImagePath,
          startDate: currentPerson.birthDate,
          positionId: targetPositionId,
        },
      },
      {
        onSuccess: async () => {
          toast.show({ message: "Đã cập nhật chức vụ", variant: "success" });
          await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
          if (userId) {
            await queryClient.invalidateQueries({
              queryKey: userKeys.detail(userId),
            });
          }
          const updatedPos =
            (positions.data?.content ?? []).find(
              (p) => p.positionId === targetPositionId,
            ) ?? null;
          setOverridePosition(updatedPos);
        },
        onError: () => {
          toast.show({
            message: "Không thể cập nhật chức vụ",
            variant: "error",
          });
        },
      },
    );
  };

  const positionOptions = [
    {
      value: "",
      label: "Chưa gán chức vụ",
      subtitle: "Gỡ chức vụ hiện tại",
    },
    ...(positions.data?.content ?? []).map((pos) => ({
      value: pos.positionId,
      label: pos.name,
      subtitle: pos.code,
    })),
  ];

  const handleCloseSheet = () => {
    setPositionPickerOpen(false);
    onClose();
  };

  const isActive = currentPerson?.status === "ACTIVE";

  return (
    <BottomSheetWindow
      visible={Boolean(person)}
      title="Thông tin hồ sơ"
      heightRatio={0.65}
      onClose={handleCloseSheet}
      footer={<AdminButton label="Chi tiết" onPress={handleCloseSheet} />}
      overlay={
        <PickerPopover
          visible={positionPickerOpen}
          useModal={false}
          title={currentPerson?.fullName ?? "Hồ sơ"}
          subtitle="Cập nhật chức vụ"
          options={positionOptions}
          selectedValue={currentPerson?.position?.positionId ?? ""}
          onSelect={handleSelectPosition}
          onClose={() => setPositionPickerOpen(false)}
        />
      }
    >
      {currentPerson ? (
        <View style={styles.container}>
          {/* Header hero hồ sơ */}
          <View style={styles.profileHero}>
            <View style={styles.profileHeroLeft}>
              <Avatar
                name={currentPerson.fullName}
                imageUrl={currentPerson.faceImagePath}
                size={54}
              />
              <View style={styles.profileHeroText}>
                <ThemedText style={styles.personName} numberOfLines={1}>
                  {currentPerson.fullName}
                </ThemedText>
                <ThemedText style={styles.personCode}>
                  Mã hồ sơ: {currentPerson.personCode || "Chưa có"}
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                isActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isActive ? styles.statusDotActive : styles.statusDotInactive,
                ]}
              />
              <ThemedText
                style={[
                  styles.statusText,
                  isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {isActive ? "Hoạt động" : "Ngừng hoạt động"}
              </ThemedText>
            </View>
          </View>

          {/* Card chi tiết thông tin */}
          <View style={styles.detailsCard}>
            {/* Hàng 1: Chức vụ */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.iconBox}>
                  <AppIcon icon={<Briefcase />} size={20} color="#475569" />
                </View>
                <View style={styles.labelCol}>
                  <ThemedText style={styles.rowTitle}>Chức vụ</ThemedText>
                  <ThemedText style={styles.rowSubtitle}>
                    Nhấn để đổi chức vụ
                  </ThemedText>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPositionPickerOpen(true)}
                style={({ pressed }) => [
                  styles.positionPillButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <ThemedText style={styles.positionPillText} numberOfLines={1}>
                  {currentPerson.position?.name || "Chưa gán chức vụ"}
                </ThemedText>
                <AppIcon icon={<ChevronRight />} size={14} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.rowDivider} />

            {/* Hàng 2: Giới tính */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.iconBox}>
                  <AppIcon icon={<User />} size={20} color="#475569" />
                </View>
                <ThemedText style={styles.rowTitle}>Giới tính</ThemedText>
              </View>
              <ThemedText style={styles.rowValue}>
                {currentPerson.gender === true
                  ? "Nam"
                  : currentPerson.gender === false
                    ? "Nữ"
                    : "Chưa xác định"}
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            {/* Hàng 3: Ngày sinh */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.iconBox}>
                  <AppIcon icon={<Calendar />} size={20} color="#475569" />
                </View>
                <ThemedText style={styles.rowTitle}>Ngày sinh</ThemedText>
              </View>
              <ThemedText style={styles.rowValue}>
                {currentPerson.birthDate
                  ? formatDateDMY(currentPerson.birthDate)
                  : "Chưa cập nhật"}
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            {/* Hàng 4: Đai hiện tại */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.iconBox}>
                  <AppIcon icon={<ShieldTick />} size={20} color="#475569" />
                </View>
                <ThemedText style={styles.rowTitle}>Đai hiện tại</ThemedText>
              </View>
              <ThemedText style={styles.rowValue}>
                {BeltLabel[currentPerson.currentBelt] ||
                  currentPerson.currentBelt ||
                  "Chưa xác định"}
              </ThemedText>
            </View>
          </View>
        </View>
      ) : null}
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 14,
    paddingHorizontal: 10,
  },
  profileHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: radii.lg,
    padding: 14,
  },
  profileHeroLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  profileHeroText: {
    flex: 1,
    gap: 2,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  personCode: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },
  statusBadgeActive: {
    borderColor: "#22C55E",
  },
  statusBadgeInactive: {
    borderColor: "#CBD5E1",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: "#22C55E",
  },
  statusDotInactive: {
    backgroundColor: "#94A3B8",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#16A34A",
  },
  statusTextInactive: {
    color: "#64748B",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 40,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  labelCol: {
    gap: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  rowSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F8FAFC",
    marginVertical: 12,
  },
  positionPillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    gap: 4,
    maxWidth: 180,
  },
  positionPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },
  pressed: {
    opacity: 0.75,
  },
});
