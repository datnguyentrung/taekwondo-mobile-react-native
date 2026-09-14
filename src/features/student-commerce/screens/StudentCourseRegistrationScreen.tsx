import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import {
  BalanceCard,
  FormField,
  PackageCoursePicker,
  PrimaryActionButton,
  PurchaseSummary,
  StatusBadge,
  StudentSummaryCard,
  SurfaceCard,
} from "../components/StudentCommercePrimitives";
import type { CourseRegistrationDraft, StudentRouteProps } from "../types";
import {
  canConfirmCourseRegistration,
  defaultPackageId,
  formatVnd,
  getCommerceState,
  getCourse,
  getPackage,
  getRegistrationSummary,
} from "../utils/studentCommerceUtils";

export function StudentCourseRegistrationScreen({
  studentCode: _studentCode,
  initialCourseId,
  initialPackageId,
}: StudentRouteProps & {
  initialCourseId?: string;
  initialPackageId?: string;
}) {
  const state = getCommerceState();
  const [draft, setDraft] = useState<CourseRegistrationDraft>(
    initialCourseId
      ? {
          courseId: initialCourseId,
          packageId: initialPackageId ?? defaultPackageId(initialCourseId),
        }
      : {},
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const course = draft.courseId
    ? getCourse(state.courses, draft.courseId)
    : undefined;
  const selectedPackage = getPackage(course, draft.packageId);
  const summary = getRegistrationSummary(state.wallet, course, selectedPackage);

  return (
    <>
      <StackScreenLayout
        title="Đăng ký khóa học"
        contentContainerStyle={styles.content}
      >
        <StudentSummaryCard student={state.selectedStudent} />
        <BalanceCard label="Số dư ví" amount={3500000} />
        <SurfaceCard soft>
          <ThemedText type="bodySmall" style={styles.primaryText}>
            Có thể học nhiều khóa cùng lúc
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            {course
              ? "Đăng ký này sẽ thêm một khóa học mới, không thay thế 2 khóa học đang học."
              : "Học viên đang học 2 khóa. Chọn thêm một khóa khác để đăng ký; các khóa hiện tại vẫn giữ nguyên."}
          </ThemedText>
        </SurfaceCard>
        <Pressable onPress={() => setPickerVisible(true)}>
          <FormField
            editable={false}
            label="Khóa học"
            value={
              course
                ? `${course.courseName} · ${course.branchName}`
                : "Chọn khóa học"
            }
          />
        </Pressable>
        {course && selectedPackage ? (
          <>
            <ThemedText type="bodySmall" style={styles.blackText}>
              Chọn gói học
            </ThemedText>
            {course.packages.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  setDraft((current) => ({ ...current, packageId: item.id }))
                }
              >
                <SurfaceCard
                  style={
                    draft.packageId === item.id ? styles.selectedCard : null
                  }
                >
                  <ThemedText type="bodySmall" style={styles.blackText}>
                    {item.label}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.blackText}>
                    {formatVnd(item.amount)}
                  </ThemedText>
                  {draft.packageId === item.id ? (
                    <StatusBadge label="Đã chọn" />
                  ) : null}
                </SurfaceCard>
              </Pressable>
            ))}
            <PurchaseSummary
              balance={3500000}
              price={summary.price}
              balanceAfter={3500000 - summary.price}
            />
            <PrimaryActionButton
              title="Xác nhận đăng ký"
              disabled={
                !canConfirmCourseRegistration(draft.courseId, draft.packageId)
              }
              loading={submitting}
              onPress={() => {
                setSubmitting(true);
                setTimeout(() => setSubmitting(false), 450);
              }}
            />
          </>
        ) : (
          <SurfaceCard soft>
            <ThemedText type="bodySmall" style={styles.blackText}>
              Chọn khóa học trước
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.blackText}>
              Sau khi chọn khóa học, các gói học của khóa đó sẽ hiển thị tại đây.
            </ThemedText>
          </SurfaceCard>
        )}
      </StackScreenLayout>
      <PackageCoursePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(courseId) => {
          setDraft({ courseId, packageId: defaultPackageId(courseId) });
          setPickerVisible(false);
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
    paddingBottom: 24,
  },
  primaryText: {
    color: Colors.light.primary,
  },
  blackText: {
    color: Colors.light.text,
  },
  selectedCard: {
    borderColor: Colors.light.primary,
  },
});
