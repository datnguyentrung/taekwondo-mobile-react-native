import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import type {
  NotificationRecipientListResponse,
  NotificationRecipientResponse,
} from '../api/notification.dto';
import { notificationRecipientApi } from '../api/notificationRecipientApi';
import { useNotificationStore } from '../store/notification.store';
import {
  notificationKeys,
  type NotificationInfiniteData,
  useMarkNotificationRead,
} from './notificationQueries';

const mockStorage = new Map<string, string>();

jest.mock('@/infrastructure/storage/zustandKeyValueStorage', () => ({
  zustandKeyValueStorage: {
    getItem: jest.fn((name: string) => Promise.resolve(mockStorage.get(name) ?? null)),
    setItem: jest.fn((name: string, value: string) => {
      mockStorage.set(name, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((name: string) => {
      mockStorage.delete(name);
      return Promise.resolve();
    }),
  },
}));

jest.mock('../api/notificationRecipientApi', () => ({
  notificationRecipientApi: {
    markRead: jest.fn(),
  },
}));

const markReadMock = notificationRecipientApi.markRead as jest.Mock;

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
}

function renderMutation(queryClient: QueryClient) {
  return renderHook(() => useMarkNotificationRead(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

function resetNotificationStore(unreadCount = 0) {
  useNotificationStore.setState({
    unreadCount,
    hasFetched: false,
    isFetching: false,
    lastActiveContextId: null,
  });
}

describe('notification mark-read mutation', () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    resetNotificationStore();
  });

  it('optimistically decrements unread count and marks cached items as read', async () => {
    const queryClient = createClient();
    const id = 'recipient-1';
    queryClient.setQueryData(notificationKeys.detail(id), recipient(id, false));
    queryClient.setQueryData(listKey(), infiniteData(3, [recipient(id, false)]));
    resetNotificationStore(3);
    markReadMock.mockResolvedValue(undefined);

    const hook = await renderMutation(queryClient);

    await act(async () => {
      await hook.result.current.mutateAsync(id);
    });

    expect(useNotificationStore.getState().unreadCount).toBe(2);
    expect(
      queryClient.getQueryData<NotificationRecipientResponse>(
        notificationKeys.detail(id),
      )?.read,
    ).toBe(true);
    hook.unmount();
    queryClient.clear();
  });

  it('does not decrement when cache proves the notification is already read', async () => {
    const queryClient = createClient();
    const id = 'recipient-1';
    queryClient.setQueryData(notificationKeys.detail(id), recipient(id, true));
    resetNotificationStore(3);
    markReadMock.mockResolvedValue(undefined);

    const hook = await renderMutation(queryClient);

    await act(async () => {
      await hook.result.current.mutateAsync(id);
    });

    expect(useNotificationStore.getState().unreadCount).toBe(3);
    hook.unmount();
    queryClient.clear();
  });

  it('rolls back the unread count when the mark-read request fails', async () => {
    const queryClient = createClient();
    const id = 'recipient-1';
    queryClient.setQueryData(notificationKeys.detail(id), recipient(id, false));
    resetNotificationStore(3);
    markReadMock.mockRejectedValue(new Error('offline'));

    const hook = await renderMutation(queryClient);

    await act(async () => {
      await expect(hook.result.current.mutateAsync(id)).rejects.toThrow('offline');
    });

    expect(useNotificationStore.getState().unreadCount).toBe(3);
    hook.unmount();
    queryClient.clear();
  });

  it('treats a full cache miss as unread for deep-link and push flows', async () => {
    const queryClient = createClient();
    resetNotificationStore(2);
    markReadMock.mockResolvedValue(undefined);

    const hook = await renderMutation(queryClient);

    await act(async () => {
      await hook.result.current.mutateAsync('missing-recipient');
    });

    expect(useNotificationStore.getState().unreadCount).toBe(1);
    hook.unmount();
    queryClient.clear();
  });
});

function listKey() {
  return notificationKeys.list({
    size: 30,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
}

function infiniteData(
  unreadCount: number,
  content: NotificationRecipientResponse[],
): NotificationInfiniteData {
  const page: NotificationRecipientListResponse = {
    unreadCount,
    notifications: {
      content,
      pageNumber: 0,
      pageSize: 30,
      totalElements: content.length,
      totalPages: 1,
      first: true,
      last: true,
      empty: content.length === 0,
    },
  };
  return { pages: [page], pageParams: [0] };
}

function recipient(
  notificationRecipientId: string,
  read: boolean,
): NotificationRecipientResponse {
  return {
    notificationRecipientId,
    notificationId: `notification-${notificationRecipientId}`,
    recipientUserId: 'user-1',
    title: 'Thông báo',
    body: 'Nội dung',
    notificationType: 'SYSTEM',
    referenceType: null,
    referenceId: null,
    payload: null,
    read,
    readAt: read ? '2026-09-09T00:00:00Z' : null,
    deliveredAt: null,
    recipientStatus: 'SENT',
    createdAt: '2026-09-09T00:00:00Z',
    updatedAt: '2026-09-09T00:00:00Z',
  };
}
