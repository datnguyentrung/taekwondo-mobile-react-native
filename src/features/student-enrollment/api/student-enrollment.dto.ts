import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { StudentSummary } from '@/features/student/api/student-summary.dto';
import type { StudentEnrollmentStatus } from '../constants/student-enrollment.constants';

export interface StudentEnrollmentCreateRequest {
  studentPersonId: string;
  coursePurchaseId: string;
  classScheduleId: string;
  startDate: string;
  endDate: string;
  status: StudentEnrollmentStatus;
}

export interface StudentEnrollmentUpdateRequest {
  studentPersonId: string;
  coursePurchaseId: string;
  classScheduleId: string;
  startDate: string;
  endDate: string;
  status: StudentEnrollmentStatus;
}

export interface StudentEnrollmentResponse {
  studentEnrollmentId: string;
  studentPersonId: string;
  coursePurchaseId: string;
  classScheduleId: string;
  startDate: string;
  endDate: string;
  status: StudentEnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollmentListParams {
  from: string;
  to: string;
  courseId?: string;
  studentPersonId?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}
export interface StudentEnrollmentSimpleResponse {
  enrollmentId: string;
  studentSummary: StudentSummary;
  classScheduleSummary: ClassScheduleSummary;
  joinDate: string;
  status: StudentEnrollmentStatus;
}

export interface EnrolledStudentItem {
  enrollmentId: string;
  studentSummary: StudentSummary;
  joinDate: string;
  status: StudentEnrollmentStatus;
}

export interface EnrollmentsByScheduleResponse {
  classScheduleSummary: ClassScheduleSummary;
  enrollments: EnrolledStudentItem[];
}

export interface EnrollmentHistoryItem {
  scheduleId: string;
  joinDate: string;
  leaveDate: string | null;
}
