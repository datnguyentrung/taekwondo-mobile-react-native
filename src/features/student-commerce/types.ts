import type { WalletTransactionDirection } from '@/features/wallet/constants/wallet.constants';

export type CommerceContext = 'admin-student' | 'admin-course' | 'account';
export type CourseCatalogTab = 'registration' | 'active' | 'ended';
export type StudentCourseTab = 'current' | 'history';
export type TransactionFilter = 'all' | 'credit' | 'debit';

export type StudentSummaryView = {
  personId: string;
  studentCode: string;
  fullName: string;
  beltLabel: string;
  branchName: string;
  statusLabel: string;
};

export type CourseRegistrationStudentView = StudentSummaryView;

export type WalletSummaryView = {
  walletId: string;
  balance: number;
  currency: 'VND';
};

export type WalletTransactionView = {
  id: string;
  title: string;
  direction: WalletTransactionDirection;
  amount: number;
  dateLabel: string;
  reference: string;
  courseName?: string;
};

export type CoursePackageView = {
  id: string;
  label: string;
  durationLabel: string;
  sessions: number;
  amount: number;
};

export type CourseStaffMemberView = {
  id: string;
  fullName: string;
  roleLabel: string;
};

export type CourseView = {
  courseId: string;
  courseName: string;
  subtitle?: string;
  description?: string;
  benefits?: string;
  curriculum?: string;
  branchName: string;
  levelLabel: string;
  scheduleLabel: string;
  statusLabel: string;
  catalogStatus: CourseCatalogTab;
  capacity?: number;
  enrolledStudentCount?: number;
  endedAtLabel?: string;
  manager?: CourseStaffMemberView;
  coachName: string;
  coaches?: CourseStaffMemberView[];
  assistantCount?: number;
  packages: CoursePackageView[];
};

export type CourseRegistrationCourseView = Pick<
  CourseView,
  'courseId' | 'courseName' | 'branchName' | 'scheduleLabel' | 'statusLabel'
>;

export type CourseEnrollmentView = {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  branchName: string;
  statusLabel: string;
  scheduleLabel: string;
  packageLabel: string;
  usedSessions: number;
  totalSessions: number;
  coachName: string;
  dateRangeLabel: string;
  tuitionFee: number;
  history?: boolean;
};

export type CourseRegistrationDraft = {
  courseId?: string;
  packageId?: string;
};

export type TopUpDraft = {
  amount: number;
  externalReference: string;
  note: string;
  hasTransferImage: boolean;
};

export type StudentCommerceState = {
  students: StudentSummaryView[];
  selectedStudent: StudentSummaryView;
  wallet: WalletSummaryView;
  transactions: WalletTransactionView[];
  enrollments: CourseEnrollmentView[];
  courses: CourseView[];
};

export type StudentRouteProps = {
  studentCode?: string;
};

export type EnrollmentRouteProps = StudentRouteProps & {
  enrollmentId?: string;
  context?: "admin-student" | "account";
};

export type CourseRouteProps = {
  courseId?: string;
  packageId?: string;
};

export type WalletTransactionsProps = StudentRouteProps & {
  context?: "admin-student" | "account";
  initialFilter?: TransactionFilter;
};

