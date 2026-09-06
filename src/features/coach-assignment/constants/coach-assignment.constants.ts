export type CoachAssignmentStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ENDED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'TERMINATED';

export const CoachAssignmentStatusValues = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'ENDED',
  'CANCELLED',
] as const satisfies readonly CoachAssignmentStatus[];

export const CoachAssignmentStatusLabel: Record<CoachAssignmentStatus, string> = {
  PENDING: 'Chờ phân công',
  ACTIVE: 'Đang được phân công',
  SUSPENDED: 'Tạm đình chỉ',
  ENDED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành nhiệm vụ',
  TERMINATED: 'Chấm dứt',
};
