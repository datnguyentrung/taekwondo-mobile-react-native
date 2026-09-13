import { studentCommerceMock } from '../fixtures/studentCommerce.fixtures';
import {
  calculateBalanceAfterTopUp,
  canConfirmCourseRegistration,
  filterCoursesByCatalogTab,
  filterTransactions,
  formatVnd,
  getCourse,
  getPackage,
  getRegistrationSummary,
  getSelectedCourse,
  getSelectedPrice,
} from './studentCommerceUtils';

describe('student commerce utils', () => {
  it('formats Vietnamese money values', () => {
    expect(formatVnd(2500000)).toBe('2.500.000đ');
    expect(formatVnd(-3000000)).toBe('-3.000.000đ');
  });

  it('filters wallet transactions by direction', () => {
    expect(filterTransactions(studentCommerceMock.transactions, 'all')).toHaveLength(5);
    expect(filterTransactions(studentCommerceMock.transactions, 'credit')).toHaveLength(3);
    expect(filterTransactions(studentCommerceMock.transactions, 'debit')).toHaveLength(2);
  });

  it('calculates balance after top-up', () => {
    expect(calculateBalanceAfterTopUp({ ...studentCommerceMock.wallet, balance: 500000 }, 2000000)).toBe(
      2500000,
    );
  });

  it('filters catalog tabs from course status', () => {
    expect(filterCoursesByCatalogTab(studentCommerceMock.courses, 'registration').map((item) => item.courseId)).toEqual([
      'basic',
      'advanced',
    ]);
    expect(filterCoursesByCatalogTab(studentCommerceMock.courses, 'active').map((item) => item.courseId)).toEqual([
      'basic',
      'expert',
    ]);
    expect(filterCoursesByCatalogTab(studentCommerceMock.courses, 'ended').map((item) => item.courseId)).toEqual([
      'ended-basic',
      'ended-advanced',
    ]);
  });

  it('finds selected course and package summary', () => {
    const course = getCourse(studentCommerceMock.courses, 'advanced');
    const packageOption = getPackage(course, 'advanced-3m');

    expect(getSelectedCourse(studentCommerceMock.courses, 'advanced')?.courseName).toBe('Taekwondo Nâng cao');
    expect(getSelectedPrice(studentCommerceMock.courses, 'advanced', 'advanced-3m')?.amount).toBe(3000000);
    expect(packageOption?.sessions).toBe(24);
    expect(canConfirmCourseRegistration('advanced', 'advanced-3m')).toBe(true);
    expect(canConfirmCourseRegistration('advanced')).toBe(false);
    expect(getRegistrationSummary(studentCommerceMock.wallet, course, packageOption).balanceAfter).toBe(-500000);
  });
});
