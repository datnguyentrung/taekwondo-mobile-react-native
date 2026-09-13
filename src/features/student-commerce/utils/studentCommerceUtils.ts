import type {
  CourseCatalogTab,
  CoursePackageView,
  CourseRegistrationDraft,
  CourseView,
  TransactionFilter,
  WalletSummaryView,
  WalletTransactionView,
} from '../types';

export function formatVnd(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}

export function filterTransactions(
  transactions: WalletTransactionView[],
  filter: TransactionFilter,
) {
  if (filter === 'credit') return transactions.filter((item) => item.direction === 'CREDIT');
  if (filter === 'debit') return transactions.filter((item) => item.direction === 'DEBIT');
  return transactions;
}

export function calculateBalanceAfterTopUp(wallet: WalletSummaryView, amount: number) {
  return wallet.balance + amount;
}

export function filterCoursesByCatalogTab(courses: CourseView[], tab: CourseCatalogTab) {
  if (tab === 'registration') {
    return courses.filter((course) => course.catalogStatus === 'registration' || course.courseId === 'basic');
  }
  return courses.filter((course) => course.catalogStatus === tab);
}

export function getCourse(courses: CourseView[], courseId?: string) {
  return courses.find((course) => course.courseId === courseId) ?? courses[0];
}

export function getPackage(course: CourseView | undefined, packageId?: string) {
  if (!course) return undefined;
  return course.packages.find((item) => item.id === packageId) ?? course.packages[0];
}

export function canConfirmCourseRegistration(
  courseId?: string,
  packageId?: string,
) {
  return Boolean(courseId && packageId);
}

export function getRegistrationSummary(
  wallet: WalletSummaryView,
  course: CourseView | undefined,
  coursePackage: CoursePackageView | undefined,
) {
  return {
    courseName: course?.courseName ?? '',
    packageLabel: coursePackage?.label ?? '',
    price: coursePackage?.amount ?? 0,
    balanceAfter: wallet.balance - (coursePackage?.amount ?? 0),
  };
}

export function getSelectedCourse(courses: CourseView[], courseId?: string) {
  return courses.find((course) => course.courseId === courseId);
}

export function getSelectedPrice(courses: CourseView[], courseId?: string, packageId?: string) {
  return getPackage(getSelectedCourse(courses, courseId), packageId);
}

export function draftFromCoursePackage(courseId?: string, packageId?: string): CourseRegistrationDraft {
  return { courseId, packageId };
}
