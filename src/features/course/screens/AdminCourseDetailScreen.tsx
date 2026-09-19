import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Star,
  User,
  Users,
} from "reicon-react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii } from "@/theme";

import { PackageRegisterButton } from "@/features/course/screens/PackageDetailScreen/PackageRegisterButton";
import {
  PackageSheet,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseRouteProps } from "@/features/student-commerce/types";
import {
  asHref,
  formatCourseStartingPrice,
  getCommerceState,
  getCourse,
} from "@/features/student-commerce/utils/studentCommerceUtils";

const DEMO_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBF_9wruZmrd5W618KQGIABGmFsg2kJ3v5ERJRoLshYk3cpM4l9MCnKKDANCZBw5ahU219v3W4h-5xSsz3negqPD76yDfmXZkh2ZNfrdhyYVMjxN3RkTKzQULtI8ND5EGnsBMVOkA_prNR7DRe9Me8EkPuyHy4WqFDg5koUxcN51oAQp6p2qgGSFDD4uY0RAjaunm2vh_OLZYP0cYmMqaO_mUqmV3JPqCwwArpRxPWCY64o6ykObbLK7w";

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const course = getCourse(state.courses, courseId);
  const [packageSheetVisible, setPackageSheetVisible] = useState(false);
  const registrationDisabled = course.catalogStatus === "ended";

  const capacity = course.capacity ?? 30;
  const enrolled = course.enrolledStudentCount ?? 18;
  const enrolledPercent = Math.min(
    Math.round((enrolled / capacity) * 100),
    100,
  );
  const packageLabels =
    course.packages.length > 0
      ? course.packages.map((item) => item.durationLabel).join(" / ")
      : "1 tháng / 3 tháng / 6 tháng";

  return (
    <>
      <StackScreenLayout
        title="Chi tiết khóa học"
        contentContainerStyle={styles.content}
        floatingContent={
          <PackageRegisterButton
            title="Đăng ký học viên"
            accessibilityLabel="Đăng ký học viên"
            disabled={registrationDisabled}
            onPress={() =>
              router.push(asHref(`/courses/${course.courseId}/register`))
            }
          />
        }
      >
        {/* BEGIN: Course Overview Card */}
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

        {/* BEGIN: Course Details Card */}
        <SurfaceCard>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="subtitle" style={styles.blackText}>
              Thông tin
            </ThemedText>
            <ThemedText type="caption" style={styles.secondaryText}>
              Chi tiết lịch & sĩ số
            </ThemedText>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailsList}>
            <View style={styles.infoRow}>
              <ThemedText type="bodySmall" style={styles.secondaryText}>
                Cấp độ
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                {course.levelLabel || "Nhập môn & Cơ bản"}
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <ThemedText type="bodySmall" style={styles.secondaryText}>
                Lịch học
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                {course.scheduleLabel}
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <ThemedText type="bodySmall" style={styles.secondaryText}>
                Sức chứa
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                {capacity} học viên
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <ThemedText type="bodySmall" style={styles.secondaryText}>
                Đang học
              </ThemedText>
              <View style={styles.enrolledGroup}>
                <ThemedText type="bodySmall" style={styles.blackTextBold}>
                  {enrolled} học viên
                </ThemedText>
                <View style={styles.percentBadge}>
                  <ThemedText type="caption" style={styles.percentBadgeText}>
                    {enrolledPercent}%
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* <View style={styles.rowDivider} /> */}

            {/* <View style={styles.infoRow}>
              <ThemedText type="bodySmall" style={styles.secondaryText}>
                Gói học
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                {packageLabels}
              </ThemedText>
            </View> */}
          </View>
        </SurfaceCard>

        {/* BEGIN: Tuition Fee / Pricing Offer Card */}
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
                <AppIcon
                  icon={<Check />}
                  size={10}
                  color={Colors.light.green}
                />
              </View>
              <ThemedText type="bodySmall" style={styles.checkText}>
                Tặng kèm đồng phục võ & đai nhập môn
              </ThemedText>
            </View>

            <View style={styles.checkRow}>
              <View style={styles.checkBadge}>
                <AppIcon
                  icon={<Check />}
                  size={10}
                  color={Colors.light.green}
                />
              </View>
              <ThemedText type="bodySmall" style={styles.checkText}>
                Miễn phí 01 buổi học thử trải nghiệm thực tế
              </ThemedText>
            </View>

            <View style={styles.checkRow}>
              <View style={styles.checkBadge}>
                <AppIcon
                  icon={<Check />}
                  size={10}
                  color={Colors.light.green}
                />
              </View>
              <ThemedText type="bodySmall" style={styles.checkText}>
                Hỗ trợ bảo lưu & đổi ca tập linh hoạt
              </ThemedText>
            </View>
          </View>

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
                Xem 3 gói học ưu đãi
              </ThemedText>
              <AppIcon icon={<ArrowRight />} size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* BEGIN: Manager Card */}
        <SurfaceCard>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quản lý
          </ThemedText>
          <View style={styles.staffProfileCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: DEMO_AVATAR_URL }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.staffInfoBlock}>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                {course.manager?.fullName ?? "Nguyễn Văn Minh"}
              </ThemedText>
              <ThemedText type="caption" style={styles.secondaryText}>
                {course.manager?.roleLabel ?? "Quản lý khóa học"}
              </ThemedText>
            </View>
          </View>
        </SurfaceCard>

        {/* BEGIN: Head Coach Card */}
        <SurfaceCard>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Huấn luyện viên
          </ThemedText>
          <View style={styles.staffProfileCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: DEMO_AVATAR_URL }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View style={styles.beltOverlayTag}>
                <ThemedText type="caption" style={styles.beltOverlayText}>
                  Đai đen
                </ThemedText>
              </View>
            </View>
            <View style={styles.staffInfoBlock}>
              <ThemedText type="bodySmall" style={styles.blackTextBold}>
                {course.coachName || "Nguyễn Văn Minh"}
              </ThemedText>
              <ThemedText type="caption" style={styles.secondaryText}>
                Huấn luyện viên chính
              </ThemedText>
            </View>
          </View>
        </SurfaceCard>

        {/* BEGIN: Roster / Community Links */}
        <SurfaceCard soft style={styles.rosterCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem danh sách trợ giảng"
            onPress={() =>
              router.push(asHref(`/courses/${course.courseId}/assistants`))
            }
            style={({ pressed }) => [
              styles.rosterRow,
              pressed ? styles.btnPressed : null,
            ]}
          >
            <View style={styles.rosterLeft}>
              <View style={styles.rosterIconContainer}>
                <AppIcon
                  icon={<User />}
                  size={20}
                  color={Colors.light.primary}
                />
              </View>
              <View>
                <ThemedText type="bodySmall" style={styles.blackTextBold}>
                  Trợ giảng ({course.assistantCount ?? 2})
                </ThemedText>
                <ThemedText type="caption" style={styles.secondaryText}>
                  {course.assistantCount ?? 2} trợ giảng phụ trách
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
            onPress={() =>
              router.push(asHref(`/courses/${course.courseId}/students`))
            }
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
      </StackScreenLayout>

      <PackageSheet
        visible={packageSheetVisible}
        course={course}
        onClose={() => setPackageSheetVisible(false)}
        onOpenPackage={(packageId) => {
          router.push(
            asHref(`/courses/${course.courseId}/packages/${packageId}`),
          );
          setTimeout(() => {
            setPackageSheetVisible(false);
          }, 100);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  blackText: {
    color: Colors.light.text,
  },
  blackTextBold: {
    color: Colors.light.text,
    fontWeight: "700",
  },
  secondaryText: {
    color: Colors.light.textSecondary,
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
  sectionTitle: {
    color: Colors.light.text,
    fontWeight: "700",
    marginBottom: 4,
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
  staffProfileCard: {
    width: 140,
    gap: 8,
    marginTop: 8,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: Colors.light.backgroundElement,
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  beltOverlayTag: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  beltOverlayText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 10,
  },
  staffInfoBlock: {
    gap: 2,
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
