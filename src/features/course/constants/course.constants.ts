export type CourseStatus = 'OPEN' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export const CourseStatusValues = [
  'OPEN',
  'ACTIVE',
  'CLOSED',
  'CANCELLED',
] as const satisfies readonly CourseStatus[];

export const CourseStatusLabel: Record<CourseStatus, string> = {
  OPEN: 'Đang mở đăng ký',
  ACTIVE: 'Đang diễn ra',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
};
