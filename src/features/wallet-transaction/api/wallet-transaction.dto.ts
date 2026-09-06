import type {
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@/features/wallet/constants/wallet.constants';

export interface WalletTransactionCreateRequest {
  walletId: string;
  createdByUserId: string;
  reviewedByUserId?: string | null;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  externalReference: string;
  reviewedAt: string;
  note: string;
}

export interface WalletTransactionUpdateRequest extends WalletTransactionCreateRequest {
  status: WalletTransactionStatus;
}

export interface WalletTransactionResponse {
  walletTransactionId: string;
  walletId: string;
  createdByUserId: string;
  reviewedByUserId: string | null;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  externalReference: string;
  reviewedAt: string | null;
  note: string;
  status: WalletTransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
