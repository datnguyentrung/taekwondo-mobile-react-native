import { act, renderHook } from '@testing-library/react-native';

import { useAuthStore } from '@/features/authentication/store/auth.store';

import { useMqttRuntime } from './useMqttRuntime';

jest.mock('@/features/device-management/services/deviceProvisioningStorage', () => ({
  deviceProvisioningStorage: {
    read: jest.fn(async () => ({
      deviceCode: 'kiosk-01', secret: 'device-secret', installationId: 'install-1',
    })),
  },
}));

jest.mock('@/features/device-management/api/deviceApi', () => ({
  deviceApi: {
    bootstrap: jest.fn(async () => ({
      deviceCode: 'kiosk-01', deviceType: 'KIOSK', lifecycleStatus: 'ACTIVE',
      runtime: { mqttWsUrl: 'wss://broker.example.com/mqtt', heartbeatTopic: 'heartbeats', heartbeatSeconds: 30 },
    })),
  },
}));

jest.mock('./mqttClient', () => ({
  mqttClient: {
    connect: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
    disconnect: jest.fn(),
  },
}));

const mqttClientMock = jest.requireMock('./mqttClient').mqttClient as {
  connect: jest.Mock;
  subscribe: jest.Mock;
  publish: jest.Mock;
  disconnect: jest.Mock;
};

describe('useMqttRuntime', () => {
  beforeEach(() => {
    mqttClientMock.connect.mockClear();
    mqttClientMock.subscribe.mockClear();
    mqttClientMock.publish.mockClear();
    mqttClientMock.disconnect.mockClear();
    useAuthStore.setState({ status: 'anonymous' });
  });

  it('connects only after authentication, then disconnects on logout', async () => {
    const { unmount } = await renderHook(() => useMqttRuntime());

    expect(mqttClientMock.connect).not.toHaveBeenCalled();

    await act(async () => {
      useAuthStore.setState({ status: 'authenticated' });
    });

    expect(mqttClientMock.connect).toHaveBeenCalledWith(expect.objectContaining({ brokerUrl: 'wss://broker.example.com/mqtt', username: 'kiosk-01', password: 'device-secret', clientId: 'kiosk-01' }));
    expect(mqttClientMock.subscribe).not.toHaveBeenCalled();

    const connection = mqttClientMock.connect.mock.calls[0][0] as { onConnected: () => void };
    expect(mqttClientMock.publish).not.toHaveBeenCalled();
    connection.onConnected();
    expect(mqttClientMock.publish).toHaveBeenCalledWith('heartbeats', expect.stringContaining('kiosk-01'));

    await act(async () => {
      useAuthStore.setState({ status: 'anonymous' });
    });
    expect(mqttClientMock.disconnect).toHaveBeenCalled();

    unmount();
  });

  it('does not connect when no active provisioned profile exists', async () => {
    const storage = jest.requireMock('@/features/device-management/services/deviceProvisioningStorage').deviceProvisioningStorage as { read: jest.Mock };
    storage.read.mockResolvedValueOnce(null);

    const { unmount } = await renderHook(() => useMqttRuntime());

    await act(async () => {
      useAuthStore.setState({ status: 'authenticated' });
    });

    expect(mqttClientMock.connect).not.toHaveBeenCalled();
    unmount();
  });
});
