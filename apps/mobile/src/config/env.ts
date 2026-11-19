import Constants from 'expo-constants';

type AppExtra = {
  apiUrlJava?: string;
  apiUrlFog?: string;
};

const extra = Constants.expoConfig?.extra as AppExtra | undefined;

export const env = {
  javaApiUrl: extra?.apiUrlJava ?? 'http://localhost:8080/api/v1',
  fogApiUrl: extra?.apiUrlFog ?? 'http://localhost:8000',
  apiTimeoutMs: 30_000,
} as const;
