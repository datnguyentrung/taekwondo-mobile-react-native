import { javaApi } from '@/infrastructure/http/httpClient';
import type { PageResponse } from '@/infrastructure/http/pagination.types';

import type {
  WalletCommandTransactionResponse,
  WalletCoursePurchaseRequest,
  WalletRefundRequest,
  WalletTopUpRequest,
} from './wallet-command.dto';
import type {
  WalletCreateRequest,
  WalletListParams,
  WalletResponse,
  WalletUpdateRequest,
} from './wallet.dto';

export const walletApi = {
  async list(params?: WalletListParams): Promise<PageResponse<WalletResponse>> {
    const response = await javaApi.get<PageResponse<WalletResponse>>('/wallets', { params });
    return response.data;
  },
  async get(walletId: string): Promise<WalletResponse> {
    const response = await javaApi.get<WalletResponse>(`/wallets/${walletId}`);
    return response.data;
  },
  async create(request: WalletCreateRequest): Promise<WalletResponse> {
    const response = await javaApi.post<WalletResponse>('/wallets', request);
    return response.data;
  },
  async update(walletId: string, request: WalletUpdateRequest): Promise<WalletResponse> {
    const response = await javaApi.put<WalletResponse>(`/wallets/${walletId}`, request);
    return response.data;
  },
  async remove(walletId: string): Promise<void> {
    await javaApi.delete(`/wallets/${walletId}`);
  },
  async topUp(request: WalletTopUpRequest): Promise<WalletCommandTransactionResponse> {
    const response = await javaApi.post<WalletCommandTransactionResponse>('/wallets/top-up', request);
    return response.data;
  },
  async purchaseCourse(request: WalletCoursePurchaseRequest): Promise<WalletCommandTransactionResponse> {
    const response = await javaApi.post<WalletCommandTransactionResponse>('/wallets/course-purchases', request);
    return response.data;
  },
  async refund(request: WalletRefundRequest): Promise<WalletCommandTransactionResponse> {
    const response = await javaApi.post<WalletCommandTransactionResponse>('/wallets/refunds', request);
    return response.data;
  },
};
