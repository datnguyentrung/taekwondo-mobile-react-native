import type { WalletStatus } from '../constants/wallet.constants';

export interface WalletCreateRequest {
  personId: string;
  balance: number;
  status: WalletStatus;
}

export type WalletUpdateRequest = WalletCreateRequest;

export interface WalletResponse {
  walletId: string;
  personId: string;
  balance: number;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
