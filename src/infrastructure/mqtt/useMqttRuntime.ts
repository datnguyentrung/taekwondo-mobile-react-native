import { AppState } from 'react-native';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/authentication/store/auth.store';
import { deviceApi } from '@/features/device-management/api/deviceApi';
import { deviceProvisioningStorage } from '@/features/device-management/services/deviceProvisioningStorage';

import { mqttClient } from './mqttClient';

export function useMqttRuntime(): void {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== 'authenticated') {
      mqttClient.disconnect();
      return undefined;
    }

    let disposed = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = undefined;
      mqttClient.disconnect();
    };
    const start = async () => {
      const profile = await deviceProvisioningStorage.read();
      if (disposed || !profile) return;
      try {
        const bootstrap = await deviceApi.bootstrap(profile);
        if (disposed || bootstrap.lifecycleStatus !== 'ACTIVE' || !bootstrap.runtime.mqttWsUrl) {
          stop();
          return;
        }
        const publishHeartbeat = () => mqttClient.publish(
          bootstrap.runtime.heartbeatTopic,
          JSON.stringify({ deviceCode: profile.deviceCode, installationId: profile.installationId, sentAt: new Date().toISOString() }),
        );
        mqttClient.connect({
          brokerUrl: bootstrap.runtime.mqttWsUrl,
          username: profile.deviceCode,
          password: profile.secret,
          clientId: profile.deviceCode,
          onConnected: () => {
            if (disposed) return;
            if (heartbeat) clearInterval(heartbeat);
            publishHeartbeat();
            heartbeat = setInterval(publishHeartbeat, Math.max(10, bootstrap.runtime.heartbeatSeconds) * 1_000);
          },
          onAuthRejected: () => void deviceProvisioningStorage.clear(),
        });
      } catch {
        stop();
      }
    };
    void start();
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void start();
      else stop();
    });

    return () => {
      disposed = true;
      appStateSubscription.remove();
      stop();
    };
  }, [status]);
}
