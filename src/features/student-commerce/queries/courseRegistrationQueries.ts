import { useMutation, useQuery } from '@tanstack/react-query';

import { courseApi } from '@/features/course/api/courseApi';
import type { CourseSimpleResponse } from '@/features/course/api/course.dto';
import { CourseStatusLabel } from '@/features/course/constants/course.constants';
import { coursePriceApi } from '@/features/course-price/api/coursePriceApi';
import type { CoursePriceSimpleResponse } from '@/features/course-price/api/course-price.dto';
import { studentApi } from '@/features/student/api/studentApi';
import type { StudentOverview } from '@/features/student/api/student.dto';
import { StudentStatusLabel } from '@/features/student/constants/student.constants';
import { BeltLabel } from '@/features/person/constants/person.constants';
import { walletApi } from '@/features/wallet/api/walletApi';
import type { WalletCoursePurchaseRequest } from '@/features/wallet/api/wallet-command.dto';

import type {
  CoursePackageView,
  CourseRegistrationCourseView,
  CourseRegistrationStudentView,
} from '../types';

const REGISTRATION_PAGE_SIZE = 20;

export const courseRegistrationKeys = {
  all: ['student-commerce', 'course-registration'] as const,
  students: (search: string) =>
    [...courseRegistrationKeys.all, 'students', search.trim()] as const,
  courses: (search: string) =>
    [...courseRegistrationKeys.all, 'courses', search.trim()] as const,
  coursePrices: (courseId?: string) =>
    [...courseRegistrationKeys.all, 'course-prices', courseId ?? ''] as const,
};

export function mapStudentOverviewToRegistrationStudent(
  student: StudentOverview,
): CourseRegistrationStudentView {
  return {
    personId: student.personId,
    studentCode: student.studentCode,
    fullName: student.fullName,
    beltLabel: BeltLabel[student.belt],
    branchName: student.branchName,
    statusLabel: student.studentStatus === 'ACTIVE'
      ? 'Đang hoạt động'
      : StudentStatusLabel[student.studentStatus],
  };
}

export function mapCourseResponseToRegistrationCourse(
  course: CourseSimpleResponse,
): CourseRegistrationCourseView {
  const schedule = course.classSchedule;
  const branchName = schedule?.branch?.name ?? '';
  const scheduleLabel = [schedule?.weekday, schedule?.level, schedule?.location]
    .filter(Boolean)
    .join(' · ');

  return {
    courseId: course.courseId,
    courseName: course.name,
    branchName,
    scheduleLabel: scheduleLabel || schedule?.scheduleId || '',
    statusLabel: CourseStatusLabel[course.status],
  };
}

export function mapCoursePriceToPackage(
  price: CoursePriceSimpleResponse,
): CoursePackageView {
  const durationLabel = `${price.durationMonths} tháng`;
  const originalAmount =
    price.basePrice && price.basePrice > price.finalPrice
      ? price.basePrice
      : undefined;

  return {
    id: price.coursePriceId,
    label: `${durationLabel} · ${price.sessionCount} buổi`,
    durationLabel,
    sessions: price.sessionCount,
    amount: price.finalPrice,
    originalAmount,
  };
}

export function useRegistrationStudentSearch(search: string, enabled = true) {
  const normalizedSearch = search.trim();

  return useQuery({
    queryKey: courseRegistrationKeys.students(normalizedSearch),
    queryFn: async () => {
      const response = await studentApi.getList({
        search: normalizedSearch || undefined,
        status: 'ACTIVE',
        page: 0,
        size: REGISTRATION_PAGE_SIZE,
      });

      return response.students.content.map(mapStudentOverviewToRegistrationStudent);
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useRegistrationCourseSearch(search: string, enabled = true) {
  const normalizedSearch = search.trim();

  return useQuery({
    queryKey: courseRegistrationKeys.courses(normalizedSearch),
    queryFn: async () => {
      const response = await courseApi.list({
        search: normalizedSearch || undefined,
        status: 'OPEN',
        page: 0,
        size: REGISTRATION_PAGE_SIZE,
      });

      return response.content.map(mapCourseResponseToRegistrationCourse);
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useRegistrationCoursePrices(courseId?: string) {
  return useQuery({
    queryKey: courseRegistrationKeys.coursePrices(courseId),
    queryFn: async () => {
      const response = await coursePriceApi.list({
        courseId,
        status: 'ACTIVE',
        page: 0,
        size: REGISTRATION_PAGE_SIZE,
      });

      return response.content.map(mapCoursePriceToPackage);
    },
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
}

export function usePurchaseCourseRegistration() {
  return useMutation({
    mutationFn: (request: WalletCoursePurchaseRequest) =>
      walletApi.purchaseCourse(request),
  });
}
