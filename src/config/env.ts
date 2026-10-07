import Constants from 'expo-constants';

type AppExtra = {
  apiUrlJava?: string;
  mqttBrokerUrl?: string;
  mqttDefaultTopic?: string;
};

const extra = Constants.expoConfig?.extra as AppExtra | undefined;

export const env = {
  javaApiUrl: extra?.apiUrlJava ?? 'http://localhost:8080/api/v1',
  mqttBrokerUrl: extra?.mqttBrokerUrl?.trim() || null,
  mqttDefaultTopic: extra?.mqttDefaultTopic?.trim() || null,
  apiTimeoutMs: 30_000,
} as const;
