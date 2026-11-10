import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/features/authentication/store/auth.store';
import {
  deviceApi,
  deviceProvisioningStorage,
} from '@/features/device-management';
import { mqttClient } from '@/infrastructure/mqtt/mqttClient';

import { parseCheckInOpenCommand } from '../domain/checkInCommand';

/** Opens the check-in tab only for an MQTT command addressed to this kiosk. */
export function useKioskCheckInCommand(): void {
  const status = useAuthStore((state) => state.status);
  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return undefined;

    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      try {
        const profile = await deviceProvisioningStorage.read();
        if (!profile || disposed) return;

        const bootstrap = await deviceApi.bootstrap(profile);
        if (
          disposed ||
          bootstrap.deviceType !== 'KIOSK' ||
          bootstrap.lifecycleStatus !== 'ACTIVE' ||
          !bootstrap.runtime.commandTopic
        ) return;

        unsubscribe = mqttClient.subscribe(bootstrap.runtime.commandTopic, (message) => {
          const command = parseCheckInOpenCommand(message.rawPayload, profile.deviceCode);
          if (!command) return;

          const eventId = command.eventId ?? message.rawPayload;
          if (lastEventId.current === eventId) return;
          lastEventId.current = eventId;
          router.navigate('/(app)/(tabs)/check-in' as Href);
        });
      } catch {
        // MQTT runtime will retry bootstrap on the next foreground transition.
      }
    };

    void subscribe();
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [status]);
}
