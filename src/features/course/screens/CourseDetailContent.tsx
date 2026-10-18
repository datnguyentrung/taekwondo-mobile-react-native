import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Star,
  User,
  Users,
} from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { activeEffect, Colors, hexToRgba, radii, typography } from "@/theme";

import type { CourseScheduleView } from "@/features/course/domain/course.types";
import {
  PackageSheet,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseView } from "@/features/student-commerce/types";
import { formatCourseStartingPrice } from "@/features/student-commerce/utils/studentCommerceUtils";
import { CourseInformationSection } from "@/features/course/components/CourseInformationSection";
import { CourseScheduleSection } from "@/features/course/components/CourseScheduleSection";
import { CourseScheduleDetailWindow } from "@/features/course/components/CourseScheduleDetailWindow";

export function CourseDetailContent({
  course,
  topContent,
  onOpenCoaches,
  onOpenAssistants,
  onOpenStudents,
  onOpenPackage,
  onOpenSchedules,
  onEditSchedule,
  onToggleScheduleStatus,
  onDeleteSchedule,
  onCancelScheduleDelete,
  scheduleDeletePending = false,
  scheduleActionPending = false,
}: {
  course: CourseView;
  topContent?: ReactNode;
  onOpenCoaches: () => void;
  onOpenAssistants: () => void;
  onOpenStudents: () => void;
  onOpenPackage: (packageId: string) => void;
  onOpenSchedules?: () => void;
  onEditSchedule?: (schedule: CourseScheduleView) => void;
  onToggleScheduleStatus?: (schedule: CourseScheduleView) => void;
  onDeleteSchedule?: (schedule: CourseScheduleView) => Promise<boolean>;
  onCancelScheduleDelete?: () => void;
  scheduleDeletePending?: boolean;
  scheduleActionPending?: boolean;
}) {
  const [packageSheetVisible, setPackageSheetVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<CourseScheduleView>();

  const enrolled = course.enrolledStudentCount ?? 18;
  const packageCount = course.packages.length;

  return (
    <>
      {topContent}

      <SurfaceCard>
        <View style={styles.titleHeader}>
          <ThemedText type="title" style={styles.blackText}>
            {course.courseName}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.secondaryText}>
            Cơ sở {course.branchName} · {course.statusLabel}
          </ThemedText>
        </View>
        <View style={styles.statusBanner}>
          <ThemedText type="smallBold" style={styles.statusBannerText}>
            {course.statusLabel}
          </ThemedText>
        </View>
      </SurfaceCard>

      <CourseInformationSection
        levelLabel={course.levelLabel}
        capacity={course.capacity ?? 30}
        enrolled={course.enrolledStudentCount ?? 18}
      />

      <CourseScheduleSection
        schedules={course.schedules}
        onOpenSchedule={setSelectedSchedule}
        onSeeMore={onOpenSchedules}
      />

      <View style={styles.pricingCard}>
        <View style={styles.pricingBadgesRow}>
          <View style={styles.offerTag}>
            <AppIcon
              icon={<Star weight="Filled" />}
              size={12}
              color="#FFFFFF"
            />
            <ThemedText type="caption" style={styles.offerTagText}>
              ƯU ĐÃI ĐẶC BIỆT
            </ThemedText>
          </View>
          <View style={styles.savingTag}>
            <ThemedText type="caption" style={styles.savingTagText}>
              Tiết kiệm tới 20%
            </ThemedText>
          </View>
        </View>

        <View style={styles.pricingHeader}>
          <ThemedText type="caption" style={styles.pricingLabelText}>
            HỌC PHÍ ƯU ĐÃI TỪ
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText type="heading" style={styles.priceAmountText}>
              {formatCourseStartingPrice(course).replace(/^Từ\s*/i, "")}
            </ThemedText>
          </View>
        </View>

        <View style={styles.checklistDivider} />

        <View style={styles.checklist}>
          <View style={styles.checkRow}>
            <View style={styles.checkBadge}>
              <AppIcon icon={<Check />} size={10} color={Colors.light.green} />
            </View>
            <ThemedText type="bodySmall" style={styles.checkText}>
              Tặng kèm đồng phục võ & đai nhập môn
            </ThemedText>
          </View>

          <View style={styles.checkRow}>
            <View style={styles.checkBadge}>
              <AppIcon icon={<Check />} size={10} color={Colors.light.green} />
            </View>
            <ThemedText type="bodySmall" style={styles.checkText}>
              Miễn phí 01 buổi học thử trải nghiệm thực tế
            </ThemedText>
          </View>

          <View style={styles.checkRow}>
            <View style={styles.checkBadge}>
              <AppIcon icon={<Check />} size={10} color={Colors.light.green} />
            </View>
            <ThemedText type="bodySmall" style={styles.checkText}>
              Hỗ trợ bảo lưu & đổi ca tập linh hoạt
            </ThemedText>
          </View>
        </View>

        {packageCount ? (
          <View style={styles.pricingCtaRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem gói học"
              onPress={() => setPackageSheetVisible(true)}
              style={({ pressed }) => [
                styles.packagesButton,
                pressed ? styles.btnPressed : null,
              ]}
            >
              <ThemedText type="action" style={styles.packagesButtonText}>
                Xem {packageCount} gói học ưu đãi
              </ThemedText>
              <AppIcon icon={<ArrowRight />} size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <SurfaceCard soft style={styles.rosterCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem danh sách huấn luyện viên"
          onPress={onOpenCoaches}
          style={({ pressed }) => [
            styles.rosterRow,
            pressed ? styles.btnPressed : null,
          ]}
        >
          <View style={styles.rosterLeft}>
            <View style={styles.rosterIconContainer}>
              <AppIcon icon={<User />} size={20} color={Colors.light.primary} />
            </View>
            <View>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                Huấn luyện viên ({course.coachCount})
              </ThemedText>
              <ThemedText type="caption" style={styles.secondaryText}>
                {course.coachCount > 0
                  ? `${course.coachCount} huấn luyện viên phụ trách`
                  : "Chưa phân công huấn luyện viên"}
              </ThemedText>
            </View>
          </View>
          <AppIcon
            icon={<ChevronRight />}
            size={18}
            color={Colors.light.textSecondary}
          />
        </Pressable>

        <View style={styles.rowDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem danh sách trợ giảng"
          onPress={onOpenAssistants}
          style={({ pressed }) => [
            styles.rosterRow,
            pressed ? styles.btnPressed : null,
          ]}
        >
          <View style={styles.rosterLeft}>
            <View style={styles.rosterIconContainer}>
              <AppIcon icon={<User />} size={20} color={Colors.light.primary} />
            </View>
            <View>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                Trợ giảng ({course.assistantCount})
              </ThemedText>
              <ThemedText type="caption" style={styles.secondaryText}>
                {course.assistantCount > 0
                  ? `${course.assistantCount} trợ giảng phụ trách`
                  : "Chưa phân công trợ giảng"}
              </ThemedText>
            </View>
          </View>
          <AppIcon
            icon={<ChevronRight />}
            size={18}
            color={Colors.light.textSecondary}
          />
        </Pressable>

        <View style={styles.rowDivider} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem danh sách học viên"
          onPress={onOpenStudents}
          style={({ pressed }) => [
            styles.rosterRow,
            pressed ? styles.btnPressed : null,
          ]}
        >
          <View style={styles.rosterLeft}>
            <View style={styles.rosterIconContainer}>
              <AppIcon
                icon={<Users />}
                size={20}
                color={Colors.light.primary}
              />
            </View>
            <View>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                Học viên ({enrolled})
              </ThemedText>
              <ThemedText type="caption" style={styles.secondaryText}>
                {enrolled} học viên chính thức
              </ThemedText>
            </View>
          </View>
          <AppIcon
            icon={<ChevronRight />}
            size={18}
            color={Colors.light.textSecondary}
          />
        </Pressable>
      </SurfaceCard>

      <PackageSheet
        visible={packageSheetVisible}
        course={course}
        onClose={() => setPackageSheetVisible(false)}
        onOpenPackage={(packageId) => {
          onOpenPackage(packageId);
          setTimeout(() => {
            setPackageSheetVisible(false);
          }, 100);
        }}
      />
      <CourseScheduleDetailWindow
        schedule={selectedSchedule}
        onClose={() => setSelectedSchedule(undefined)}
        onEdit={onEditSchedule}
        onToggleStatus={onToggleScheduleStatus}
        onDelete={onDeleteSchedule}
        onCancelDelete={onCancelScheduleDelete}
        deleting={scheduleDeletePending}
        actionPending={scheduleActionPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  blackText: {
    color: Colors.light.text,
  },
  blackTextBold: {
    color: Colors.light.text,
    // ...typography.bodySmall,
    fontWeight: "bold",
  },
  secondaryText: {
    color: Colors.light.textSecondary,
    ...typography.caption,
  },
  titleHeader: {
    gap: 4,
  },
  statusBanner: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.primary, 0.2),
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  statusBannerText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
    backgroundColor: hexToRgba(Colors.light.divider, 0.5),
    marginVertical: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: hexToRgba(Colors.light.divider, 0.3),
  },
  detailsList: {
    gap: 10,
    marginTop: 4,
  },
  infoRow: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  enrolledGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: hexToRgba(Colors.light.green, 0.12),
  },
  percentBadgeText: {
    color: Colors.light.green,
    fontWeight: "700",
    fontSize: 11,
  },
  pricingCard: {
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.primary, 0.25),
  },
  pricingBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  offerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.primary,
  },
  offerTagText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 10,
  },
  savingTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.primary, 0.3),
  },
  savingTagText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 11,
  },
  pricingHeader: {
    gap: 2,
  },
  pricingLabelText: {
    color: hexToRgba(Colors.light.primary, 0.8),
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  priceAmountText: {
    color: Colors.light.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  checklistDivider: {
    height: 1,
    backgroundColor: hexToRgba(Colors.light.primary, 0.15),
  },
  checklist: {
    gap: 8,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.green, 0.15),
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: Colors.light.text,
    fontSize: 12,
  },
  pricingCtaRow: {
    marginTop: 4,
  },
  packagesButton: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  packagesButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scheduleItemsList: {
    gap: 2,
  },
  scheduleItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  scheduleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleItemContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  scheduleArrowWrap: {
    paddingLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleMetaColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  scheduleTimingColumn: {
    flex: 1.5,
    minWidth: 0,
    alignItems: "flex-end",
    gap: 6,
  },
  timeBadge: {
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
  },
  timeBadgeText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  scheduleStaffList: {
    width: "100%",
    gap: 6,
  },
  scheduleStaffRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  scheduleStaffName: {
    flex: 1,
    color: Colors.light.text,
    textAlign: "right",
  },
  scheduleEmptyStaffText: {
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  staffRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  primaryRoleBadge: {
    backgroundColor: hexToRgba(Colors.light.primary, 0.1),
  },
  staffRoleText: {
    color: Colors.light.textSecondary,
  },
  primaryRoleText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  scheduleFallbackRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rosterCard: {
    padding: 0,
    overflow: "hidden",
  },
  rosterRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rosterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rosterIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.75,
  },
});
