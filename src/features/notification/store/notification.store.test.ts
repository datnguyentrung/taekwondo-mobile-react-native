import { notificationRecipientApi } from '../api/notificationRecipientApi';
import { useNotificationStore } from './notification.store';

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
    getMine: jest.fn(),
  },
}));

const getMineMock = notificationRecipientApi.getMine as jest.Mock;

function resetNotificationStore() {
  useNotificationStore.setState({
    unreadCount: 0,
    hasFetched: false,
    isFetching: false,
    lastActiveContextId: null,
  });
}

describe('notification store', () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    resetNotificationStore();
  });

  it('clamps unread count mutations to zero and whole numbers', () => {
    const store = useNotificationStore.getState();

    store.setUnreadCount(2.9);
    expect(useNotificationStore.getState().unreadCount).toBe(2);

    useNotificationStore.getState().decrementUnread(5);
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    useNotificationStore.getState().incrementUnread(3);
    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });

  it('persists only the count and active context projection', () => {
    useNotificationStore.setState({
      hasFetched: true,
      isFetching: true,
      lastActiveContextId: 'ctx-1',
    });

    useNotificationStore.getState().setUnreadCount(7);

    const stored = JSON.parse(mockStorage.get('notification-storage') ?? '{}');
    expect(stored.state).toEqual({
      unreadCount: 7,
      lastActiveContextId: 'ctx-1',
    });
    expect(stored.state.hasFetched).toBeUndefined();
    expect(stored.state.isFetching).toBeUndefined();
  });

  it('fetches once per context unless forced or context changes', async () => {
    getMineMock.mockResolvedValue({ unreadCount: 6, notifications: emptyPage() });

    await useNotificationStore
      .getState()
      .fetchUnreadCount({ contextId: 'ctx-1' });
    await useNotificationStore
      .getState()
      .fetchUnreadCount({ contextId: 'ctx-1' });
    await useNotificationStore
      .getState()
      .fetchUnreadCount({ contextId: 'ctx-2' });
    await useNotificationStore
      .getState()
      .fetchUnreadCount({ force: true, contextId: 'ctx-2' });

    expect(getMineMock).toHaveBeenCalledTimes(3);
    expect(getMineMock).toHaveBeenCalledWith({
      size: 1,
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
    expect(useNotificationStore.getState().unreadCount).toBe(6);
  });

  it('guards concurrent fetches and releases the lock after failure', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    getMineMock
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      )
      .mockRejectedValueOnce(new Error('offline'));

    const firstFetch = useNotificationStore
      .getState()
      .fetchUnreadCount({ contextId: 'ctx-1' });
    const secondFetch = useNotificationStore
      .getState()
      .fetchUnreadCount({ contextId: 'ctx-1' });

    expect(getMineMock).toHaveBeenCalledTimes(1);
    resolveFetch({ unreadCount: 4, notifications: emptyPage() });
    await Promise.all([firstFetch, secondFetch]);

    await useNotificationStore
      .getState()
      .fetchUnreadCount({ force: true, contextId: 'ctx-1' });

    expect(getMineMock).toHaveBeenCalledTimes(2);
    expect(useNotificationStore.getState().isFetching).toBe(false);
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it('resets count, fetch flags, and context', () => {
    useNotificationStore.setState({
      unreadCount: 9,
      hasFetched: true,
      isFetching: true,
      lastActiveContextId: 'ctx-1',
    });

    useNotificationStore.getState().reset();

    expect(useNotificationStore.getState()).toMatchObject({
      unreadCount: 0,
      hasFetched: false,
      isFetching: false,
      lastActiveContextId: null,
    });
  });
});

function emptyPage() {
  return {
    content: [],
    pageNumber: 0,
    pageSize: 1,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  };
}
