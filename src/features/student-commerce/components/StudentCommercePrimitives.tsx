import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { AppIcon } from '@/shared/ui/AppIcon';
import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, effects, radii } from '@/theme';

import type {
  CoursePackageView,
  CourseView,
  StudentSummaryView,
  WalletTransactionView,
} from '../types';
import { formatVnd } from '../utils/studentCommerceUtils';

export function SurfaceCard({
  children,
  style,
  soft = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
}) {
  return <View style={[styles.card, soft ? styles.softCard : null, style]}>{children}</View>;
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <ThemedText type="featureLabel" style={styles.badgeText}>
        {label}
      </ThemedText>
    </View>
  );
}

export function PrimaryActionButton({
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  onPress,
}: {
  title: string;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.actionButtonPrimary : styles.actionButtonOutline,
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <ThemedText type="action" style={primary ? styles.actionTextPrimary : styles.actionTextOutline}>
        {loading ? 'Đang xử lý...' : title}
      </ThemedText>
    </Pressable>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.value)}
            style={({ pressed }) => [
              styles.tabItem,
              selected ? styles.tabItemSelected : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <ThemedText type="featureLabel" style={selected ? styles.primaryText : styles.secondaryText}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StudentSummaryCard({ student }: { student: StudentSummaryView }) {
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

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="bodySmall" style={styles.blackText}>
        {label}
      </ThemedText>
      <ThemedText type="bodySmall" numberOfLines={2} style={styles.blackText}>
        {value}
      </ThemedText>
    </View>
  );
}

export function FormField({
  label,
  helper,
  ...inputProps
}: TextInputProps & {
  label: string;
  helper?: string;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="bodySmall" style={styles.blackText}>
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={Colors.light.textSecondary}
        style={styles.input}
        {...inputProps}
      />
      {helper ? (
        <ThemedText type="bodySmall" style={styles.secondaryText}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function CourseIconBox({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.iconBox, { width: size, height: size }]}>
      <AppIcon name="layersFill" size={Math.min(size - 14, 26)} color={Colors.light.text} />
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
  mode: 'registration' | 'active' | 'ended';
  onPress?: () => void;
  onPackagePress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={mode === 'registration' ? undefined : 'button'}
      onPress={mode === 'registration' ? undefined : onPress}
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
          {mode === 'registration' ? (
            <PrimaryActionButton title="Xem gói" variant="outline" onPress={onPackagePress} />
          ) : (
            <StatusBadge label={course.statusLabel} />
          )}
        </View>
        {mode === 'active' ? (
          <ThemedText type="bodySmall" style={styles.secondaryText}>
            {course.enrolledStudentCount} / {course.capacity} học viên
          </ThemedText>
        ) : null}
        {mode === 'ended' && course.endedAtLabel ? (
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
  const remaining = Math.max(enrollment.totalSessions - enrollment.usedSessions, 0);
  const progress = Math.min(enrollment.usedSessions / enrollment.totalSessions, 1);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
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
          <View style={[styles.progressValue, { width: `${progress * 100}%` }]} />
        </View>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {enrollment.dateRangeLabel}
        </ThemedText>
      </SurfaceCard>
    </Pressable>
  );
}

export function TransactionCard({ transaction }: { transaction: WalletTransactionView }) {
  const credit = transaction.direction === 'CREDIT';
  return (
    <SurfaceCard soft style={styles.transactionCard}>
      <View style={styles.row}>
        <AppIcon name="noteText" size={22} color={Colors.light.text} />
        <View style={styles.flex}>
          <ThemedText type={transaction.title.length > 12 ? 'action' : 'bodySmall'} style={styles.blackText}>
            {transaction.title}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            {transaction.dateLabel}{transaction.courseName ? ` · ${transaction.courseName}` : ''}
          </ThemedText>
        </View>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {credit ? '+' : '-'}{formatVnd(transaction.amount)}
        </ThemedText>
      </View>
    </SurfaceCard>
  );
}

export function PackageSheet({
  visible,
  course,
  onClose,
  onOpenPackage,
}: {
  visible: boolean;
  course?: CourseView;
  onClose: () => void;
  onOpenPackage: (packageId: string) => void;
}) {
  if (!course) return null;
  return (
    <BottomSheetWindow
      visible={visible}
      title={`Gói học – ${course.courseName}`}
      heightRatio={0.55}
      onClose={onClose}
    >
      <View style={styles.sheetBody}>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Chọn gói phù hợp. Số buổi được ưu tiên hiển thị trước giá.
        </ThemedText>
        {course.packages.map((item) => (
          <SurfaceCard key={item.id}>
            <View style={styles.row}>
              <CourseIconBox size={88} />
              <View style={styles.flex}>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {item.sessions} BUỔI
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {item.durationLabel}
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {formatVnd(item.amount)}
                </ThemedText>
                <Pressable onPress={() => onOpenPackage(item.id)}>
                  <ThemedText type="action" style={styles.primaryText}>
                    Xem chi tiết →
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </SurfaceCard>
        ))}
        <ThemedText type="bodySmall" style={styles.blackText}>
          Hiện có {course.packages.length} gói đang áp dụng: 1 tháng và 3 tháng.
        </ThemedText>
      </View>
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  softCard: {
    shadowOpacity: 0,
    elevation: 0,
  },
  studentSummary: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  badge: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  badgeText: {
    color: Colors.light.textSecondary,
  },
  tabs: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  tabItemSelected: {
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  actionButton: {
    minHeight: 48,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: Colors.light.divider,
    backgroundColor: Colors.light.surface,
  },
  actionTextPrimary: {
    color: Colors.light.surface,
  },
  actionTextOutline: {
    color: Colors.light.primary,
  },
  disabled: {
    opacity: 0.45,
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
  primaryText: {
    color: Colors.light.primary,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  field: {
    width: '100%',
    gap: 6,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    color: Colors.light.text,
  },
  infoRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
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
  sheetBody: {
    gap: 12,
    padding: 20,
  },
});
