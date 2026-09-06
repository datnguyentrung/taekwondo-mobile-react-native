export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type WalletTransactionDirection = 'CREDIT' | 'DEBIT';
export type WalletTransactionStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED';
export type WalletTransactionType =
  | 'TOP_UP'
  | 'COURSE_PURCHASE'
  | 'SUPPLY_PURCHASE'
  | 'REFUND'
  | 'MANUAL_ADJUSTMENT';

export const WalletStatusValues = ['ACTIVE', 'FROZEN', 'CLOSED'] as const satisfies readonly WalletStatus[];
export const WalletTransactionDirectionValues = ['CREDIT', 'DEBIT'] as const satisfies readonly WalletTransactionDirection[];
export const WalletTransactionStatusValues = ['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'] as const satisfies readonly WalletTransactionStatus[];
export const WalletTransactionTypeValues = [
  'TOP_UP',
  'COURSE_PURCHASE',
  'SUPPLY_PURCHASE',
  'REFUND',
  'MANUAL_ADJUSTMENT',
] as const satisfies readonly WalletTransactionType[];
