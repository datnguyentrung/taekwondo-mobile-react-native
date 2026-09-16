import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  WalletTransactionCreateRequest,
  WalletTransactionListParams,
  WalletTransactionResponse,
  WalletTransactionSimpleResponse,
  WalletTransactionUpdateRequest,
} from './wallet-transaction.dto';

export const walletTransactionApi = {
  async list(params?: WalletTransactionListParams): Promise<PageResponse<WalletTransactionSimpleResponse>> {
    const response = await javaApi.get<PageResponse<WalletTransactionSimpleResponse>>('/wallet-transactions', { params });
    return response.data;
  },
  async get(walletTransactionId: string): Promise<WalletTransactionResponse> {
    const response = await javaApi.get<WalletTransactionResponse>(`/wallet-transactions/${walletTransactionId}`);
    return response.data;
  },
  async create(request: WalletTransactionCreateRequest): Promise<WalletTransactionResponse> {
    const response = await javaApi.post<WalletTransactionResponse>('/wallet-transactions', request);
    return response.data;
  },
  async update(walletTransactionId: string, request: WalletTransactionUpdateRequest): Promise<WalletTransactionResponse> {
    const response = await javaApi.put<WalletTransactionResponse>(`/wallet-transactions/${walletTransactionId}`, request);
    return response.data;
  },
  async remove(walletTransactionId: string): Promise<void> {
    await javaApi.delete(`/wallet-transactions/${walletTransactionId}`);
  },
};
