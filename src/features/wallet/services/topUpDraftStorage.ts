import { authStore, selectCurrentTenantId } from '@/features/authentication/store/auth.store';
import type { MobileUploadFile } from '@/infrastructure/http/http.types';
import { keyValueStorage } from '@/infrastructure/storage/keyValueStorage';

import type { WalletTopUpMode } from '../api/wallet-top-up-request.dto';

const PREFIX = 'wallet.top-up-draft.v2';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type StoredTopUpDraft = {
  tenantId: string;
  userId: string;
  personId: string;
  mode: WalletTopUpMode;
  clientRequestId: string;
  serverRequestId?: string;
  amount: number;
  note: string;
  proof: MobileUploadFile;
  createdAt: number;
};

function currentTenantScope(): string {
  const tenantId = selectCurrentTenantId(authStore.getState());
  if (!tenantId) {
    throw new Error('Tenant context is required for wallet top-up draft storage.');
  }
  return tenantId;
}

function key(tenantId: string, userId: string, personId: string): string {
  return `${PREFIX}:${tenantId}:${userId}:${personId}`;
}

export const topUpDraftStorage = {
  currentTenantId: currentTenantScope,
  async read(userId: string, personId: string): Promise<StoredTopUpDraft | null> {
    const tenantId = selectCurrentTenantId(authStore.getState());
    if (!tenantId) return null;
    const storageKey = key(tenantId, userId, personId);
    const raw = await keyValueStorage.get(storageKey);
    if (!raw) return null;
    try {
      const draft = JSON.parse(raw) as StoredTopUpDraft;
      if (
        draft.tenantId !== tenantId ||
        draft.userId !== userId ||
        draft.personId !== personId ||
        Date.now() - draft.createdAt > MAX_AGE_MS
      ) {
        await keyValueStorage.remove(storageKey);
        return null;
      }
      return draft;
    } catch {
      await keyValueStorage.remove(storageKey);
      return null;
    }
  },

  write(draft: Omit<StoredTopUpDraft, 'tenantId'> & { tenantId?: string }): Promise<void> {
    const tenantId = draft.tenantId ?? currentTenantScope();
    const scopedDraft: StoredTopUpDraft = { ...draft, tenantId };
    return keyValueStorage.set(
      key(tenantId, draft.userId, draft.personId),
      JSON.stringify(scopedDraft),
    );
  },

  clear(userId: string, personId: string): Promise<void> {
    return keyValueStorage.remove(key(currentTenantScope(), userId, personId));
  },
};
