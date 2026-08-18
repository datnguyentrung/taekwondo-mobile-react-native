export type ExamEligibility =
  | 'NOT_ELIGIBLE'
  | 'ELIGIBLE'
  | 'EXEMPT'
  | 'NONE'
  | 'PENDING';

export const ExamEligibilityLabel: Record<ExamEligibility, string> = {
  NOT_ELIGIBLE: 'Không đủ điều kiện thi thử',
  ELIGIBLE: 'Đủ điều kiện thi thử',
  EXEMPT: '⭐ Miễn thi thử',
  NONE: 'Không có thông tin',
  PENDING: 'Chưa đạt (đang tích lũy)',
};
