import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { User } from "reicon-react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import {
  NavigationMenu,
  NavigationMenuItem,
} from "@/shared/ui/NavigationMenu/NavigationMenu";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii } from "@/theme";

import { PackageRegisterButton } from "@/features/course/screens/PackageDetailScreen/PackageRegisterButton";
import {
  InfoRow,
  PackageSheet,
  PrimaryActionButton,
  StatusBadge,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseRouteProps } from "@/features/student-commerce/types";
import {
  asHref,
  formatCourseStartingPrice,
  getCommerceState,
  getCourse,
} from "@/features/student-commerce/utils/studentCommerceUtils";

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const course = getCourse(state.courses, courseId);
  const [packageSheetVisible, setPackageSheetVisible] = useState(false);
  const registrationDisabled = course.catalogStatus === "ended";

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
        <SurfaceCard>
          <ThemedText type="title" style={styles.blackText}>
            {course.courseName}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            Cơ sở {course.branchName} · {course.statusLabel}
          </ThemedText>
          <StatusBadge label={course.statusLabel} />
        </SurfaceCard>

        <SurfaceCard>
          <ThemedText type="bodySmall" style={styles.blackText}>
            Thông tin
          </ThemedText>
          <InfoRow label="Lịch học" value={course.scheduleLabel} />
          <InfoRow
            label="Sức chứa"
            value={`${course.capacity ?? 0} học viên`}
          />
          <InfoRow
            label="Đang học"
            value={`${course.enrolledStudentCount ?? 0} học viên`}
          />
          <InfoRow
            label="Gói học"
            value={course.packages
              .map((item) => item.durationLabel)
              .join(" / ")}
          />
        </SurfaceCard>

        <SurfaceCard>
          <View style={styles.priceBlock}>
            <ThemedText type="heading" style={styles.blackText}>
              Học phí {formatCourseStartingPrice(course).toLowerCase()}
            </ThemedText>
            <PrimaryActionButton
              title="Xem gói học"
              variant="outline"
              onPress={() => setPackageSheetVisible(true)}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <ThemedText type="title" style={styles.blackText}>
            Quản lý
          </ThemedText>
          <View style={styles.coachCard}>
            <View style={styles.coachImage}>
              <AppIcon
                icon={<User weight="Filled" />}
                size={48}
                color={Colors.light.textSecondary}
              />
            </View>
            <ThemedText type="bodySmall" style={styles.blackText}>
              {course.manager?.fullName ?? "Chưa có dữ liệu quản lý"}
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.secondaryText}>
              {course.manager?.roleLabel ?? "Quản lý khóa học"}
            </ThemedText>
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <ThemedText type="title" style={styles.blackText}>
            Huấn luyện viên
          </ThemedText>
          <View style={styles.coachCard}>
            <View style={styles.coachImage}>
              <AppIcon
                icon={<User />}
                size={48}
                color={Colors.light.textSecondary}
              />
            </View>
            <ThemedText type="bodySmall" style={styles.blackText}>
              {course.coachName}
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.blackText}>
              Huấn luyện viên chính
            </ThemedText>
          </View>
        </SurfaceCard>

        <NavigationMenu>
          <NavigationMenuItem
            icon={<User />}
            title="Trợ giảng"
            count={course.assistantCount ?? 0}
            subtitle={`${course.assistantCount ?? 0} trợ giảng`}
            onPress={() =>
              router.push(asHref(`/courses/${course.courseId}/assistants`))
            }
          />
          <NavigationMenuItem
            icon={<User />}
            title="Học viên"
            count={course.enrolledStudentCount ?? 0}
            subtitle={`${course.enrolledStudentCount ?? 0} học viên`}
            onPress={() =>
              router.push(asHref(`/courses/${course.courseId}/students`))
            }
          />
        </NavigationMenu>
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
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  blackText: {
    color: Colors.light.text,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
  priceBlock: {
    gap: 14,
  },
  coachCard: {
    width: 152,
    gap: 8,
    padding: 10,
    borderRadius: radii.lg,
    backgroundColor: Colors.light.backgroundElement,
  },
  coachImage: {
    width: 132,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hexToRgba(Colors.light.divider, 0.7),
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
  },
});
