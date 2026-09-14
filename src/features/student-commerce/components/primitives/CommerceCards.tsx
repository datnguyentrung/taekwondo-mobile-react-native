import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

import type {
  CourseView,
  StudentSummaryView,
  WalletTransactionView,
} from "../../types";
import { formatVnd } from "../../utils/studentCommerceUtils";
import { InfoRow, PrimaryActionButton, StatusBadge, SurfaceCard } from "./CommerceLayoutPrimitives";

export function StudentSummaryCard({
  student,
}: {
  student: StudentSummaryView;
}) {
  return (
    <SurfaceCard style={styles.studentSummary}>
      <View style={styles.avatar}>
        <AppIcon name="personFill" size={26} color={Colors.light.primary} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="title" numberOfLines={1} style={styles.blackText}>
          {student.fullName}
        </ThemedText>
        <ThemedText type="bodySmall" numberOfLines={1} style={styles.blackText}>
          {student.studentCode} · {student.beltLabel}
        </ThemedText>
      </View>
      <StatusBadge label={student.statusLabel} />
    </SurfaceCard>
  );
}

export function CourseIconBox({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.iconBox, { width: size, height: size }]}>
      <AppIcon
        name="layersFill"
        size={Math.min(size - 14, 26)}
        color={Colors.light.text}
      />
    </View>
  );
}

export function CourseCatalogCard({
  course,
  mode,
  onPress,
  onPackagePress,
}: {
  course: CourseView;
  mode: "registration" | "active" | "ended";
  onPress?: () => void;
  onPackagePress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={mode === "registration" ? undefined : "button"}
      onPress={mode === "registration" ? undefined : onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <SurfaceCard>
        <View style={styles.row}>
          <CourseIconBox size={36} />
          <View style={styles.flex}>
            <ThemedText type="title" style={styles.blackText}>
              {course.courseName}
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.blackText}>
              {course.branchName} · {course.scheduleLabel}
            </ThemedText>
          </View>
          {mode === "registration" ? (
            <PrimaryActionButton
              title="Xem gói"
              variant="outline"
              onPress={onPackagePress}
            />
          ) : (
            <StatusBadge label={course.statusLabel} />
          )}
        </View>
        {mode === "active" ? (
          <ThemedText type="bodySmall" style={styles.secondaryText}>
            {course.enrolledStudentCount} / {course.capacity} học viên
          </ThemedText>
        ) : null}
        {mode === "ended" && course.endedAtLabel ? (
          <ThemedText type="bodySmall" style={styles.secondaryText}>
            {course.endedAtLabel}
          </ThemedText>
        ) : null}
      </SurfaceCard>
    </Pressable>
  );
}

export function EnrollmentCard({
  enrollment,
  onPress,
}: {
  enrollment: {
    courseName: string;
    branchName: string;
    scheduleLabel: string;
    statusLabel: string;
    usedSessions: number;
    totalSessions: number;
    dateRangeLabel: string;
  };
  onPress?: () => void;
}) {
  const remaining = Math.max(
    enrollment.totalSessions - enrollment.usedSessions,
    0,
  );
  const progress = Math.min(
    enrollment.usedSessions / enrollment.totalSessions,
    1,
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <SurfaceCard>
        <View style={styles.row}>
          <CourseIconBox size={36} />
          <View style={styles.flex}>
            <ThemedText type="title" style={styles.blackText}>
              {enrollment.courseName}
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.blackText}>
              {enrollment.branchName} · {enrollment.scheduleLabel}
            </ThemedText>
          </View>
          <StatusBadge label={enrollment.statusLabel} />
        </View>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Còn {remaining}/{enrollment.totalSessions} buổi
        </ThemedText>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressValue, { width: `${progress * 100}%` }]}
          />
        </View>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {enrollment.dateRangeLabel}
        </ThemedText>
      </SurfaceCard>
    </Pressable>
  );
}

export function TransactionCard({
  transaction,
}: {
  transaction: WalletTransactionView;
}) {
  const credit = transaction.direction === "CREDIT";
  return (
    <SurfaceCard soft style={styles.transactionCard}>
      <View style={styles.row}>
        <AppIcon name="noteText" size={22} color={Colors.light.text} />
        <View style={styles.flex}>
          <ThemedText
            type={transaction.title.length > 12 ? "action" : "bodySmall"}
            style={styles.blackText}
          >
            {transaction.title}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            {transaction.dateLabel}
            {transaction.courseName ? ` · ${transaction.courseName}` : ""}
          </ThemedText>
        </View>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {credit ? "+" : "-"}
          {formatVnd(transaction.amount)}
        </ThemedText>
      </View>
    </SurfaceCard>
  );
}

export function BalanceCard({ label, amount }: { label: string; amount: number }) {
  return (
    <SurfaceCard soft>
      <ThemedText type="bodySmall" style={styles.blackText}>
        {label}
      </ThemedText>
      <ThemedText type="heading" style={styles.blackText}>
        {formatVnd(amount)}
      </ThemedText>
    </SurfaceCard>
  );
}

export function PurchaseSummary({
  balance,
  price,
  balanceAfter,
}: {
  balance: number;
  price: number;
  balanceAfter: number;
}) {
  return (
    <SurfaceCard>
      <InfoRow label="Số dư hiện tại" value={formatVnd(balance)} />
      <InfoRow label="Gói học" value={`-${formatVnd(price)}`} />
      <InfoRow label="Số dư sau đăng ký" value={formatVnd(balanceAfter)} />
    </SurfaceCard>
  );
}


const styles = StyleSheet.create({
  studentSummary: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  progressValue: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.primary,
  },
  transactionCard: {
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  blackText: {
    color: Colors.light.text,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
});
