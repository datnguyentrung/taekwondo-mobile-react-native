import { useEffect } from 'react';
import { mqttClient } from './mqttClient';
import { useToast } from '@/shared/ui/Toast';

interface UseMqttToastOptions {
  topic?: string;
  enabled?: boolean;
}

/**
 * Hook tạm thời lắng nghe dữ liệu từ MQTT broker và hiển thị Toast lên UI
 */
export function useMqttToast(options: UseMqttToastOptions = {}) {
  const {
    topic,
    enabled = false,
  } = options;

  const toast = useToast();

  useEffect(() => {
    if (!enabled || !topic) return;

    const unsubscribe = mqttClient.subscribe(topic, (message) => {
      toast.show({
        message: `[${message.topic}] ${message.rawPayload}`,
        variant: 'info',
        duration: 3500,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [topic, enabled, toast]);
}
