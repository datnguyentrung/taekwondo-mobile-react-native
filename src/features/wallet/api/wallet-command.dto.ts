import type {
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../constants/wallet.constants';

export interface WalletTopUpRequest {
  personId: string;
  amount: number;
  externalReference: string;
  note?: string | null;
}

export interface WalletCoursePurchaseRequest {
  studentPersonId: string;
  coursePriceId: string;
  externalReference: string;
  note?: string | null;
}

export interface WalletRefundRequest {
  originalDebitTransactionId: string;
  note?: string | null;
}

export interface WalletCommandTransactionResponse {
  walletTransactionId: string;
  walletId: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  externalReference: string;
  coursePurchaseId: string | null;
  studentEnrollmentId: string | null;
  reviewedAt: string | null;
}
