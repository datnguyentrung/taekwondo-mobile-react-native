import { act, renderHook } from '@testing-library/react-native';

import { useAuthStore } from '@/features/authentication/store/auth.store';

import { useMqttRuntime } from './useMqttRuntime';

jest.mock('@/config/env', () => ({
  env: {
    mqttBrokerUrl: 'wss://broker.example.com/mqtt',
    mqttDefaultTopic: 'shared/topic',
  },
}));

jest.mock('./mqttClient', () => ({
  mqttClient: {
    connect: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    disconnect: jest.fn(),
  },
}));

const mqttClientMock = jest.requireMock('./mqttClient').mqttClient as {
  connect: jest.Mock;
  subscribe: jest.Mock;
  disconnect: jest.Mock;
};

describe('useMqttRuntime', () => {
  beforeEach(() => {
    mqttClientMock.connect.mockClear();
    mqttClientMock.subscribe.mockClear();
    mqttClientMock.disconnect.mockClear();
    useAuthStore.setState({ status: 'anonymous' });
  });

  it('connects and subscribes only after authentication, then disconnects on logout', async () => {
    const { unmount } = await renderHook(() => useMqttRuntime());

    expect(mqttClientMock.connect).not.toHaveBeenCalled();

    await act(async () => {
      useAuthStore.setState({ status: 'authenticated' });
    });

    expect(mqttClientMock.connect).toHaveBeenCalledWith('wss://broker.example.com/mqtt');
    expect(mqttClientMock.subscribe).toHaveBeenCalledWith('shared/topic', expect.any(Function));

    await act(async () => {
      useAuthStore.setState({ status: 'anonymous' });
    });
    expect(mqttClientMock.disconnect).toHaveBeenCalled();

    unmount();
  });
});
