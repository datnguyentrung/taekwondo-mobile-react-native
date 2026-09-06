export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type RequesterType = 'STUDENT' | 'SYSTEM_EMPLOYEE';
export type ScheduleImpactType = 'LEAVE_SESSION' | 'MAKEUP_SESSION';

export const LeaveRequestStatusValues = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const satisfies readonly LeaveRequestStatus[];

export const RequesterTypeValues = [
  'STUDENT',
  'SYSTEM_EMPLOYEE',
] as const satisfies readonly RequesterType[];
