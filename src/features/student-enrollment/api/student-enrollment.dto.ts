import type { StudentEnrollmentStatus } from '../constants/student-enrollment.constants';
import type { ClassScheduleSummary } from '@/features/class-schedule/api/class-schedule-summary.dto';
import type { StudentSummary } from '@/features/student/api/student-summary.dto';

export interface StudentEnrollmentCreateRequest {
  studentCode: string;
  scheduleIds: string[];
  joinDate: string;
  note?: string;
}

export interface StudentEnrollmentUpdateRequest {
  status: StudentEnrollmentStatus;
  leaveDate?: string | null;
  joinDate?: string;
  note?: string;
}

export interface StudentEnrollmentResponse {
  enrollmentId: string;
  student: StudentSummary;
  classSchedule: ClassScheduleSummary;
  joinDate: string;
  leaveDate: string | null;
  status: StudentEnrollmentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
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
