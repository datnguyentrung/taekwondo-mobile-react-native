import { useEffect, useRef } from 'react';

import { mqttClient } from './mqttClient';
import type { MessageHandler } from './mqtt.types';

export function useMqttSubscription(
  topic: string | null | undefined,
  handler: MessageHandler,
  enabled = true,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled || !topic) return undefined;

    return mqttClient.subscribe(topic, (message) => handlerRef.current(message));
  }, [enabled, topic]);
}
