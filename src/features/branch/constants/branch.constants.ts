export type BranchStatus = 'OPERATING' | 'CLOSED';

export const BranchStatusValues = ['OPERATING', 'CLOSED'] as const satisfies readonly BranchStatus[];

export const BranchStatusLabel: Record<BranchStatus, string> = {
  OPERATING: 'Đang hoạt động',
  CLOSED: 'Đã đóng',
};
