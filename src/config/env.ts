import Constants from 'expo-constants';

type AppExtra = {
  apiUrlJava?: string;
  apiUrlFog?: string;
  kioskDeviceId?: string;
  mqttEnabled?: boolean;
  mqttBrokerUrl?: string;
  mqttDefaultTopic?: string;
  mqttCommandTopic?: string;
};

const extra = Constants.expoConfig?.extra as AppExtra | undefined;
const kioskDeviceId = extra?.kioskDeviceId?.trim() || 'kiosk-01';

export const env = {
  javaApiUrl: extra?.apiUrlJava ?? 'http://localhost:8080/api/v1',
  fogApiUrl: extra?.apiUrlFog?.trim() || 'http://localhost:8000',
  kioskDeviceId,
  mqttEnabled:
    typeof extra?.mqttEnabled === 'boolean'
      ? extra.mqttEnabled
      : process.env.EXPO_PUBLIC_MQTT_ENABLED === 'true',
  mqttBrokerUrl: extra?.mqttBrokerUrl?.trim() || null,
  mqttDefaultTopic: extra?.mqttDefaultTopic?.trim() || null,
  mqttCommandTopic:
    extra?.mqttCommandTopic?.trim() ||
    `taekwondo/kiosks/${kioskDeviceId}/commands`,
  apiTimeoutMs: 30_000,
} as const;
