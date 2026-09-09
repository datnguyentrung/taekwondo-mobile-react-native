import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandKeyValueStorage } from '@/infrastructure/storage/zustandKeyValueStorage';

import { notificationRecipientApi } from '../api/notificationRecipientApi';

type FetchUnreadCountOptions = {
  force?: boolean;
  contextId?: string | null;
};

export interface NotificationState {
  unreadCount: number;
  hasFetched: boolean;
  isFetching: boolean;
  lastActiveContextId: string | null;
  setUnreadCount: (count: number) => void;
  incrementUnread: (by?: number) => void;
  decrementUnread: (by?: number) => void;
  fetchUnreadCount: (options?: FetchUnreadCountOptions) => Promise<void>;
  reset: () => void;
}

type PersistedNotificationState = Pick<
  NotificationState,
  'unreadCount' | 'lastActiveContextId'
>;

const STORAGE_KEY = 'notification-storage';

function clampUnreadCount(count: number): number {
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
}

export const useNotificationStore = create<NotificationState>()(
  persist<NotificationState, [], [], PersistedNotificationState>(
    (set, get) => ({
      unreadCount: 0,
      hasFetched: false,
      isFetching: false,
      lastActiveContextId: null,

      setUnreadCount: (count) => {
        set({ unreadCount: clampUnreadCount(count) });
      },

      incrementUnread: (by = 1) => {
        set((state) => ({
          unreadCount: clampUnreadCount(state.unreadCount + by),
        }));
      },

      decrementUnread: (by = 1) => {
        set((state) => ({
          unreadCount: clampUnreadCount(state.unreadCount - by),
        }));
      },

      fetchUnreadCount: async (options = {}) => {
        const nextContextId = options.contextId ?? null;
        const state = get();
        const isSameContext = state.lastActiveContextId === nextContextId;

        if (state.isFetching) return;
        if (!options.force && state.hasFetched && isSameContext) return;

        set({ isFetching: true });

        try {
          const response = await notificationRecipientApi.getMine({
            size: 1,
            sortBy: 'createdAt',
            sortDir: 'desc',
          });
          set({
            unreadCount: clampUnreadCount(response.unreadCount),
            hasFetched: true,
            lastActiveContextId: nextContextId,
          });
        } catch {
          set({ lastActiveContextId: nextContextId });
        } finally {
          set({ isFetching: false });
        }
      },

      reset: () => {
        set({
          unreadCount: 0,
          hasFetched: false,
          isFetching: false,
          lastActiveContextId: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandKeyValueStorage),
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        lastActiveContextId: state.lastActiveContextId,
      }),
      version: 1,
    },
  ),
);
