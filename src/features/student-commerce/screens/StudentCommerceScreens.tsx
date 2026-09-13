import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { AppIcon } from '@/shared/ui/AppIcon';
import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, effects, radii } from '@/theme';
import type { AppIconName } from '@/theme/icons';

import {
  CourseCatalogCard,
  EnrollmentCard,
  FormField,
  InfoRow,
  PackageSheet,
  PrimaryActionButton,
  SegmentedTabs,
  StatusBadge,
  StudentSummaryCard,
  SurfaceCard,
  TransactionCard,
} from '../components/StudentCommercePrimitives';
import { studentCommerceMock } from '../fixtures/studentCommerce.fixtures';
import type {
  CourseCatalogTab,
  CourseRegistrationDraft,
  CourseView,
  StudentCourseTab,
  TopUpDraft,
  TransactionFilter,
} from '../types';
import {
  calculateBalanceAfterTopUp,
  canConfirmCourseRegistration,
  filterCoursesByCatalogTab,
  filterTransactions,
  formatVnd,
  getCourse,
  getPackage,
  getRegistrationSummary,
} from '../utils/studentCommerceUtils';

type StudentRouteProps = {
  studentCode?: string;
};

type EnrollmentRouteProps = StudentRouteProps & {
  enrollmentId?: string;
  context?: 'admin-student' | 'account';
};

type CourseRouteProps = {
  courseId?: string;
  packageId?: string;
};

type WalletTransactionsProps = StudentRouteProps & {
  context?: 'admin-student' | 'account';
  initialFilter?: TransactionFilter;
};

function useCommerceState() {
  return studentCommerceMock;
}

function asHref(path: string) {
  return path as Href;
}

function defaultPackageId(courseId: string) {
  return `${courseId}-3m`;
}

function getEnrollment(enrollmentId?: string) {
  const state = useCommerceState();
  return state.enrollments.find((item) => item.enrollmentId === enrollmentId) ?? state.enrollments[0];
}

function RootLikeScreen({
  title,
  activeTab,
  children,
}: {
  title: string;
  activeTab: 'activities' | 'account';
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <View style={[styles.simpleAppBar, { paddingTop: Math.max(insets.top, 28) }]}>
        <ThemedText type="heading" style={styles.blackText}>
          {title}
        </ThemedText>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.rootContent,
          { paddingBottom: 104 + Math.max(insets.bottom, 10) },
        ]}
      >
        {children}
      </ScrollView>
      <View style={[styles.prototypeBottomNav, { bottom: Math.max(insets.bottom, 0) }]}>
        {[
          ['homeOutline', 'Trang chủ', 'index'],
          ['databaseFill', 'Hoạt động', 'activities'],
          ['qrCode', 'QR', 'check-in'],
          ['calendarOutline', 'Lịch học', 'schedule'],
          ['personFill', 'Tài khoản', 'account'],
        ].map(([icon, label, key]) => {
          const selected = key === activeTab;
          return (
            <View key={key} style={styles.prototypeTab}>
              <AppIcon
                name={icon as AppIconName}
                size={key === 'check-in' ? 22 : 20}
                color={selected ? Colors.light.primary : Colors.light.text}
              />
              <ThemedText
                type="featureLabel"
                style={selected ? styles.primaryText : styles.blackText}
              >
                {label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function StudentListScreen() {
  const router = useRouter();
  const state = useCommerceState();

  return (
    <RootLikeScreen title="Học viên" activeTab="activities">
      <View style={styles.inlineSummary}>
        <ThemedText type="bodySmall" style={styles.blackText}>
          467 học viên
        </ThemedText>
        <StatusBadge label="216 hoạt động" />
      </View>
      <SegmentedTabs
        value="learning"
        tabs={[
          { value: 'all', label: 'Tất cả' },
          { value: 'learning', label: 'Đang học' },
          { value: 'paused', label: 'Bảo lưu' },
        ]}
        onChange={() => undefined}
      />
      {state.students.map((student) => (
        <Pressable
          key={student.studentCode}
          accessibilityRole="button"
          onPress={() => router.push(asHref(`/students/${student.studentCode}`))}
          style={({ pressed }) => [pressed ? styles.pressed : null]}
        >
          <SurfaceCard>
            <View style={styles.row}>
              <View style={styles.smallAvatar} />
              <View style={styles.flex}>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {student.fullName}
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {student.studentCode} · {student.beltLabel}
                </ThemedText>
              </View>
              <StatusBadge label={student.statusLabel} />
            </View>
            <ThemedText type="bodySmall" style={styles.blackText}>
              {student.branchName}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}
      <ThemedText type="bodySmall" style={styles.blackText}>
        Chọn học viên để xem hồ sơ, ví và khóa học.
      </ThemedText>
    </RootLikeScreen>
  );
}

export function StudentDetailScreen({ studentCode }: StudentRouteProps) {
  const router = useRouter();
  const state = useCommerceState();
  const student = state.students.find((item) => item.studentCode === studentCode) ?? state.selectedStudent;
  const activeEnrollments = state.enrollments.filter((item) => !item.history).slice(0, 2);

  return (
    <StackScreenLayout title="Chi tiết học viên" contentContainerStyle={styles.content}>
      <StudentSummaryCard student={student} />
      <View style={styles.actionRow}>
        <PrimaryActionButton
          title="Nạp tiền"
          variant="outline"
          onPress={() => router.push(asHref(`/students/${student.studentCode}/top-up`))}
        />
        <PrimaryActionButton
          title="Đăng ký khóa học"
          onPress={() => router.push(asHref(`/students/${student.studentCode}/course-registration`))}
        />
      </View>
      <SurfaceCard>
        <View style={styles.row}>
          <AppIcon name="wallet" size={24} color={Colors.light.primary} />
          <ThemedText type="bodySmall" style={styles.blackText}>
            Ví điện tử
          </ThemedText>
        </View>
        <ThemedText type="heading" style={styles.blackText}>
          {formatVnd(state.wallet.balance)}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Số dư khả dụng
        </ThemedText>
        <Pressable onPress={() => router.push(asHref(`/students/${student.studentCode}/wallet`))}>
          <ThemedText type="action" style={styles.primaryText}>
            Xem chi tiết ví ›
          </ThemedText>
        </Pressable>
      </SurfaceCard>
      <View style={styles.sectionHeader}>
        <ThemedText type="title" style={styles.blackText}>
          Khóa học đang học ({activeEnrollments.length})
        </ThemedText>
        <Pressable onPress={() => router.push(asHref(`/students/${student.studentCode}/courses`))}>
          <ThemedText type="action" style={styles.primaryText}>
            Xem tất cả →
          </ThemedText>
        </Pressable>
      </View>
      {activeEnrollments.map((enrollment) => (
        <EnrollmentCard
          key={enrollment.enrollmentId}
          enrollment={enrollment}
          onPress={() =>
            router.push(asHref(`/students/${student.studentCode}/courses/${enrollment.enrollmentId}`))
          }
        />
      ))}
      <SurfaceCard soft>
        <ThemedText type="title" style={styles.blackText}>
          Lịch sử tập luyện ›
        </ThemedText>
      </SurfaceCard>
    </StackScreenLayout>
  );
}

export function TopUpScreen({ studentCode }: StudentRouteProps) {
  const state = useCommerceState();
  const [draft, setDraft] = useState<TopUpDraft>({
    amount: 2000000,
    externalReference: 'ZALO-13092026',
    note: 'PH chuyển khoản qua Zalo',
    hasTransferImage: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const balanceBefore = state.wallet.balance - draft.amount;

  return (
    <StackScreenLayout title="Nạp tiền" contentContainerStyle={styles.content}>
      <StudentSummaryCard student={state.selectedStudent} />
      <BalanceCard label="Số dư hiện tại" amount={balanceBefore} />
      <FormField
        label="Số tiền"
        value={formatVnd(draft.amount)}
        keyboardType="numeric"
        helper="Tiền sẽ được cộng trực tiếp vào ví học viên"
        onChangeText={(value) =>
          setDraft((current) => ({ ...current, amount: Number(value.replace(/\D/g, '')) || 0 }))
        }
      />
      <FormField
        label="Mã tham chiếu"
        value={draft.externalReference}
        onChangeText={(externalReference) => setDraft((current) => ({ ...current, externalReference }))}
      />
      <FormField
        label="Ghi chú"
        value={draft.note}
        onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
      />
      <SurfaceCard soft style={styles.uploadBox}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDraft((current) => ({ ...current, hasTransferImage: !current.hasTransferImage }))}
        >
          <ThemedText type="bodySmall" style={styles.primaryText}>
            {draft.hasTransferImage ? 'Đã thêm ảnh chuyển khoản' : '＋ Thêm ảnh chuyển khoản'}
          </ThemedText>
        </Pressable>
      </SurfaceCard>
      <ThemedText type="bodySmall" style={styles.secondaryText}>
        JPG / PNG
      </ThemedText>
      <BalanceCard label="Số dư sau giao dịch" amount={calculateBalanceAfterTopUp({ ...state.wallet, balance: balanceBefore }, draft.amount)} />
      <PrimaryActionButton
        title="Xác nhận nạp tiền"
        loading={submitting}
        disabled={!draft.amount || draft.externalReference.trim().length === 0}
        onPress={() => {
          setSubmitting(true);
          setTimeout(() => setSubmitting(false), 450);
        }}
      />
      <ThemedText type="bodySmall" style={styles.blackText}>
        Giao dịch sẽ tạo TOP_UP / CREDIT sau khi xác nhận.
      </ThemedText>
    </StackScreenLayout>
  );
}

export function StudentCourseRegistrationScreen({
  studentCode,
  initialCourseId,
  initialPackageId,
}: StudentRouteProps & { initialCourseId?: string; initialPackageId?: string }) {
  const router = useRouter();
  const state = useCommerceState();
  const [draft, setDraft] = useState<CourseRegistrationDraft>(
    initialCourseId ? { courseId: initialCourseId, packageId: initialPackageId ?? defaultPackageId(initialCourseId) } : {},
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const course = draft.courseId ? getCourse(state.courses, draft.courseId) : undefined;
  const selectedPackage = getPackage(course, draft.packageId);
  const summary = getRegistrationSummary(state.wallet, course, selectedPackage);

  return (
    <>
      <StackScreenLayout title="Đăng ký khóa học" contentContainerStyle={styles.content}>
        <StudentSummaryCard student={state.selectedStudent} />
        <BalanceCard label="Số dư ví" amount={3500000} />
        <SurfaceCard soft>
          <ThemedText type="bodySmall" style={styles.primaryText}>
            Có thể học nhiều khóa cùng lúc
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            {course
              ? 'Đăng ký này sẽ thêm một khóa học mới, không thay thế 2 khóa học đang học.'
              : 'Học viên đang học 2 khóa. Chọn thêm một khóa khác để đăng ký; các khóa hiện tại vẫn giữ nguyên.'}
          </ThemedText>
        </SurfaceCard>
        <Pressable onPress={() => setPickerVisible(true)}>
          <FormField
            editable={false}
            label="Khóa học"
            value={course ? `${course.courseName} · ${course.branchName}` : 'Chọn khóa học'}
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
                onPress={() => setDraft((current) => ({ ...current, packageId: item.id }))}
              >
                <SurfaceCard style={draft.packageId === item.id ? styles.selectedCard : null}>
                  <ThemedText type="bodySmall" style={styles.blackText}>
                    {item.label}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.blackText}>
                    {formatVnd(item.amount)}
                  </ThemedText>
                  {draft.packageId === item.id ? <StatusBadge label="Đã chọn" /> : null}
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
              disabled={!canConfirmCourseRegistration(draft.courseId, draft.packageId)}
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

export function WalletScreen({ studentCode, context = 'admin-student' }: StudentRouteProps & { context?: 'admin-student' | 'account' }) {
  if (context === 'account') return <AccountWalletScreen />;
  const router = useRouter();
  const state = useCommerceState();

  return (
    <StackScreenLayout title="Ví học viên" contentContainerStyle={styles.content}>
      <StudentSummaryCard student={state.selectedStudent} />
      <WalletHero onPress={() => router.push(asHref(`/students/${studentCode ?? state.selectedStudent.studentCode}/top-up`))} />
      <ThemedText type="title" style={styles.blackText}>
        Giao dịch gần đây
      </ThemedText>
      {state.transactions.slice(0, 3).map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
      <Pressable onPress={() => router.push(asHref(`/students/${studentCode ?? state.selectedStudent.studentCode}/wallet/transactions`))}>
        <ThemedText type="action" style={styles.primaryText}>
          Xem tất cả giao dịch ›
        </ThemedText>
      </Pressable>
    </StackScreenLayout>
  );
}

export function WalletTransactionsScreen({ context = 'admin-student', initialFilter = 'all' }: WalletTransactionsProps) {
  const state = useCommerceState();
  const [filter, setFilter] = useState<TransactionFilter>(initialFilter);
  const transactions = useMemo(() => filterTransactions(state.transactions, filter), [filter, state.transactions]);

  return (
    <StackScreenLayout title="Lịch sử giao dịch" contentContainerStyle={styles.content}>
      <SurfaceCard soft>
        <ThemedText type="title" style={styles.blackText}>
          {context === 'account' ? 'Nguyễn Văn An' : state.selectedStudent.fullName}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {state.selectedStudent.studentCode} · Số dư hiện tại {formatVnd(state.wallet.balance)}
        </ThemedText>
      </SurfaceCard>
      <SegmentedTabs
        value={filter}
        tabs={[
          { value: 'all', label: 'Tất cả' },
          { value: 'credit', label: 'Tiền vào' },
          { value: 'debit', label: 'Tiền ra' },
        ]}
        onChange={setFilter}
      />
      {transactions.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </StackScreenLayout>
  );
}

export function StudentCoursesScreen({ studentCode }: StudentRouteProps) {
  const router = useRouter();
  const state = useCommerceState();
  const [tab, setTab] = useState<StudentCourseTab>('current');
  const enrollments = state.enrollments.filter((item) => (tab === 'history' ? item.history : !item.history));

  return (
    <StackScreenLayout title="Khóa học" contentContainerStyle={styles.content}>
      <SegmentedTabs
        value={tab}
        tabs={[
          { value: 'current', label: 'Hiện tại' },
          { value: 'history', label: 'Lịch sử' },
        ]}
        onChange={setTab}
      />
      <View>
        <ThemedText type="title" style={styles.blackText}>
          {tab === 'current' ? `${enrollments.length} khóa học đang học` : `${enrollments.length} khóa học lịch sử`}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.secondaryText}>
          Tiến độ riêng từng khóa
        </ThemedText>
      </View>
      {enrollments.map((enrollment) => (
        <EnrollmentCard
          key={enrollment.enrollmentId}
          enrollment={enrollment}
          onPress={() => router.push(asHref(`/students/${studentCode ?? state.selectedStudent.studentCode}/courses/${enrollment.enrollmentId}`))}
        />
      ))}
    </StackScreenLayout>
  );
}

export function CourseDetailScreen({ enrollmentId, context = 'admin-student' }: EnrollmentRouteProps) {
  const router = useRouter();
  const enrollment = getEnrollment(enrollmentId);
  const historyPath =
    context === 'account' ? '/account/wallet/transactions' : '/students/VQ_00123/wallet/transactions';

  return (
    <StackScreenLayout title="Chi tiết khóa học" contentContainerStyle={styles.content}>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          {enrollment.courseName}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {enrollment.branchName}
        </ThemedText>
        <StatusBadge label={enrollment.statusLabel} />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Số buổi còn lại
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {Math.max(enrollment.totalSessions - enrollment.usedSessions, 0)} / {enrollment.totalSessions}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Đã sử dụng {enrollment.usedSessions} buổi
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <InfoRow label="Gói học" value={enrollment.packageLabel} />
        <InfoRow label="Thời hạn" value={enrollment.dateRangeLabel} />
        <InfoRow label="Lịch học" value={enrollment.scheduleLabel} />
        <InfoRow label="HLV chính" value={enrollment.coachName} />
        <InfoRow label="Trạng thái" value="ACTIVE" />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="action" style={styles.blackText}>
          Thanh toán
        </ThemedText>
        <InfoRow label="Học phí" value={formatVnd(enrollment.tuitionFee)} />
        <Pressable onPress={() => router.push(asHref(historyPath))}>
          <ThemedText type="action" style={styles.primaryText}>
            Xem giao dịch mua khóa học ›
          </ThemedText>
        </Pressable>
      </SurfaceCard>
    </StackScreenLayout>
  );
}

export function CourseCatalogScreen({ initialTab = 'registration' }: { initialTab?: CourseCatalogTab }) {
  const router = useRouter();
  const state = useCommerceState();
  const [tab, setTab] = useState<CourseCatalogTab>(initialTab);
  const [packageCourse, setPackageCourse] = useState<CourseView | undefined>();
  const courses = filterCoursesByCatalogTab(state.courses, tab);

  return (
    <RootLikeScreen title="Khóa học" activeTab="activities">
      <SegmentedTabs
        value={tab}
        tabs={[
          { value: 'registration', label: 'Đăng ký' },
          { value: 'active', label: 'Đang diễn ra' },
          { value: 'ended', label: 'Đã kết thúc' },
        ]}
        onChange={setTab}
      />
      <FormField label="Tìm kiếm" value={tab === 'registration' ? 'Tên khóa học, cơ sở...' : 'Tên khóa học, HLV...'} editable={false} />
      {courses.map((course) => (
        <CourseCatalogCard
          key={course.courseId}
          course={course}
          mode={tab}
          onPress={() => router.push(asHref(`/courses/${course.courseId}`))}
          onPackagePress={() => setPackageCourse(course)}
        />
      ))}
      <PackageSheet
        visible={Boolean(packageCourse)}
        course={packageCourse}
        onClose={() => setPackageCourse(undefined)}
        onOpenPackage={(packageId) => {
          const courseId = packageCourse?.courseId;
          setPackageCourse(undefined);
          if (courseId) router.push(asHref(`/courses/${courseId}/packages/${packageId}`));
        }}
      />
    </RootLikeScreen>
  );
}

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const state = useCommerceState();
  const course = getCourse(state.courses, courseId);

  return (
    <StackScreenLayout title="Chi tiết khóa học" contentContainerStyle={styles.content}>
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
        <InfoRow label="Sức chứa" value={`${course.capacity ?? 0} học viên`} />
        <InfoRow label="Đang học" value={`${course.enrolledStudentCount ?? 0} học viên`} />
        <InfoRow label="Gói học" value="1 tháng / 3 tháng" />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Quản lý
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Chưa có dữ liệu quản lý được gán cho khóa học này.
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Huấn luyện viên
        </ThemedText>
        <View style={styles.coachCard}>
          <View style={styles.coachImage}>
            <AppIcon name="personOutline" size={48} color={Colors.light.textSecondary} />
          </View>
          <ThemedText type="bodySmall" style={styles.blackText}>
            {course.coachName}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            Huấn luyện viên chính
          </ThemedText>
        </View>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Trợ giảng {course.assistantCount ?? 2} người
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Dữ liệu hiện tại chỉ có số lượng; không tạo tên trợ giảng giả.
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Học viên {course.enrolledStudentCount ?? 18} học viên
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Danh sách hiển thị theo enrollment ACTIVE của khóa học tại thời điểm hiện tại.
        </ThemedText>
        {state.students.map((student) => (
          <View key={student.studentCode} style={styles.studentLine}>
            <View style={styles.personBubble}>
              <AppIcon name="personOutline" size={22} color={Colors.light.text} />
            </View>
            <View>
              <ThemedText type="bodySmall" style={styles.blackText}>
                {student.fullName}
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.blackText}>
                {student.studentCode}
              </ThemedText>
            </View>
          </View>
        ))}
        <ThemedText type="title" style={styles.blackText}>
          Cuộn xuống để xem tiếp danh sách học viên.
        </ThemedText>
      </SurfaceCard>
      <PrimaryActionButton
        title="Đăng ký học viên"
        onPress={() => router.push(asHref(`/courses/${course.courseId}/register`))}
      />
    </StackScreenLayout>
  );
}

export function PackageDetailScreen({ courseId, packageId }: CourseRouteProps) {
  const router = useRouter();
  const state = useCommerceState();
  const course = getCourse(state.courses, courseId);
  const item = getPackage(course, packageId)!;

  return (
    <StackScreenLayout title="Chi tiết gói học" contentContainerStyle={styles.content}>
      <SurfaceCard soft>
        <ThemedText type="title" style={styles.blackText}>
          {course.courseName}
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="subtitle" style={styles.primaryText}>
          {item.sessions} BUỔI
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {item.durationLabel}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {formatVnd(item.amount)}
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Bạn nhận được
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          • {item.sessions} buổi học theo lịch của khóa học đã chọn
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          • Không có buổi tặng hoặc ưu đãi bổ sung trong dữ liệu hiện tại
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard soft>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Thông tin gói
        </ThemedText>
        <InfoRow label="Số buổi" value={`${item.sessions} buổi`} />
        <InfoRow label="Thời hạn" value={item.durationLabel} />
        <InfoRow label="Giá" value={formatVnd(item.amount)} />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Điều kiện & chính sách
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Áp dụng khi khóa học đang mở đăng ký.
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Thời hạn sử dụng được tính theo kỳ học sau khi đăng ký.
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Các chính sách khác áp dụng theo quy định hiện hành của trung tâm.
        </ThemedText>
      </SurfaceCard>
      <PrimaryActionButton
        title="Đăng ký"
        onPress={() => router.push(asHref(`/courses/${course.courseId}/packages/${item.id}/register`))}
      />
    </StackScreenLayout>
  );
}

export function PackageRegistrationScreen({ courseId, packageId }: CourseRouteProps) {
  const state = useCommerceState();
  const course = getCourse(state.courses, courseId);
  const selectedPackage = getPackage(course, packageId);
  return (
    <StudentCourseRegistrationScreen
      initialCourseId={course.courseId}
      initialPackageId={selectedPackage?.id}
      studentCode={state.selectedStudent.studentCode}
    />
  );
}

export function AccountWalletScreen() {
  const router = useRouter();
  const state = useCommerceState();
  const activeEnrollments = state.enrollments.filter((item) => !item.history).slice(0, 2);

  return (
    <RootLikeScreen title="Ví điện tử" activeTab="account">
      <SurfaceCard soft>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Đang xem ví của
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Nguyễn Văn An · VQ_00123
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Hồ sơ học viên đang hoạt động
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Số dư khả dụng
        </ThemedText>
        <ThemedText type="heading" style={styles.primaryText}>
          {formatVnd(state.wallet.balance)}
        </ThemedText>
        <PrimaryActionButton
          title="Hướng dẫn nạp tiền"
          variant="outline"
          onPress={() => router.push(asHref('/account/wallet/top-up-guide'))}
        />
      </SurfaceCard>
      <ThemedText type="title" style={styles.blackText}>
        Khóa học đang học (2)
      </ThemedText>
      {activeEnrollments.map((enrollment) => (
        <EnrollmentCard
          key={enrollment.enrollmentId}
          enrollment={enrollment}
          onPress={() => router.push(asHref(`/account/courses/${enrollment.enrollmentId}`))}
        />
      ))}
      <Pressable onPress={() => router.push('/account/courses' as Href)}>
        <ThemedText type="action" style={styles.blackText}>
          Xem tất cả khóa học ›
        </ThemedText>
      </Pressable>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Giao dịch gần đây
        </ThemedText>
        {state.transactions.slice(0, 2).map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
        <Pressable onPress={() => router.push('/account/wallet/transactions' as Href)}>
          <ThemedText type="action" style={styles.blackText}>
            Xem tất cả giao dịch ›
          </ThemedText>
        </Pressable>
      </SurfaceCard>
    </RootLikeScreen>
  );
}

export function AccountTopUpGuideScreen() {
  return (
    <StackScreenLayout title="Hướng dẫn nạp tiền" contentContainerStyle={styles.content}>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Hướng dẫn chuyển khoản
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Vui lòng chuyển khoản theo thông tin trung tâm cung cấp, sau đó gửi ảnh giao dịch cho quản trị viên để được cộng tiền vào ví.
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard soft>
        <InfoRow label="Nội dung" value="VQ_00123 Nguyen Van An" />
        <InfoRow label="Trạng thái" value="Chờ xác nhận thủ công" />
      </SurfaceCard>
    </StackScreenLayout>
  );
}

export function AccountCoursesScreen() {
  return <StudentCoursesScreen studentCode="VQ_00123" />;
}

function BalanceCard({ label, amount }: { label: string; amount: number }) {
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

function WalletHero({ onPress }: { onPress: () => void }) {
  const state = useCommerceState();
  return (
    <SurfaceCard>
      <ThemedText type="bodySmall" style={styles.blackText}>
        Số dư khả dụng
      </ThemedText>
      <ThemedText type="heading" style={styles.blackText}>
        {formatVnd(state.wallet.balance)}
      </ThemedText>
      <PrimaryActionButton title="Nạp tiền" variant="outline" onPress={onPress} />
    </SurfaceCard>
  );
}

function PurchaseSummary({ balance, price, balanceAfter }: { balance: number; price: number; balanceAfter: number }) {
  return (
    <SurfaceCard>
      <InfoRow label="Số dư hiện tại" value={formatVnd(balance)} />
      <InfoRow label="Gói học" value={`-${formatVnd(price)}`} />
      <InfoRow label="Số dư sau đăng ký" value={formatVnd(balanceAfter)} />
    </SurfaceCard>
  );
}

function PackageCoursePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (courseId: string) => void;
}) {
  const state = useCommerceState();
  const options = state.courses.filter((course) => ['basic', 'advanced', 'expert'].includes(course.courseId));

  return (
    <BottomSheetWindow
      visible={visible}
      title="Chọn khóa học"
      heightRatio={0.45}
      onClose={onClose}
    >
      <View style={styles.sheetContent}>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Có thể học nhiều khóa cùng lúc. Khóa đang học không đăng ký trùng.
        </ThemedText>
        {options.map((course) => (
          <Pressable
            key={course.courseId}
            accessibilityRole="button"
            onPress={() => onSelect(course.courseId)}
            style={({ pressed }) => [pressed ? styles.pressed : null]}
          >
            <SurfaceCard soft>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <ThemedText type="title" style={styles.blackText}>
                    {course.courseName}
                  </ThemedText>
                  <ThemedText type="bodySmall" style={styles.blackText}>
                    {course.branchName} · {course.scheduleLabel}
                  </ThemedText>
                </View>
                <StatusBadge label={course.courseId === 'expert' ? 'Đăng ký' : 'Đang học'} />
              </View>
            </SurfaceCard>
          </Pressable>
        ))}
      </View>
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  simpleAppBar: {
    minHeight: 84,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.light.surface,
  },
  rootContent: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  prototypeBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: radii.lg,
    backgroundColor: Colors.light.surface,
    ...effects.card,
  },
  prototypeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  inlineSummary: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  smallAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  uploadBox: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    borderColor: Colors.light.primary,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
  },
  studentLine: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  personBubble: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  pressed: {
    opacity: 0.75,
  },
  blackText: {
    color: Colors.light.text,
  },
  primaryText: {
    color: Colors.light.primary,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
  sheetContent: {
    gap: 12,
    padding: 20,
  },
});
