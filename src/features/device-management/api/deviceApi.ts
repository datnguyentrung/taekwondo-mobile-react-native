import { javaApi } from '@/infrastructure/http/httpClient';
import type { DeviceBootstrap, DeviceEvent, ManagedDevice } from '../domain/device.types';

export type DeviceCreateRequest = {
  displayName: string;
  deviceType: 'FOG_GATEWAY' | 'KIOSK' | 'ESP32';
  branchId?: number | null;
  fogGatewayId?: string | null;
  pairedKioskId?: string | null;
};

export const deviceApi = {
  list: async (): Promise<ManagedDevice[]> => (await javaApi.get<ManagedDevice[]>('/devices')).data,
  create: async (request: DeviceCreateRequest) => (await javaApi.post<ManagedDevice>('/devices', request)).data,
  lifecycle: async (deviceId: string, targetStatus: string) => (await javaApi.patch<ManagedDevice>(`/devices/${deviceId}/lifecycle`, { targetStatus })).data,
  provisionCode: async (deviceId: string) => (await javaApi.post<{ code: string }>(`/devices/${deviceId}/provisioning-codes`)).data,
  revoke: async (deviceId: string) => (await javaApi.post<ManagedDevice>(`/devices/${deviceId}/credentials/revoke`)).data,
  configuration: async (deviceId: string, desiredConfig: string, expectedConfigVersion: number) => javaApi.put(`/devices/${deviceId}/configuration`, { desiredConfig, expectedConfigVersion }),
  claim: async (request: { code: string; deviceType: 'KIOSK'; installationId: string }) =>
    (await javaApi.post<{ deviceCode: string; secret: string; runtime: DeviceBootstrap['runtime'] }>('/device-provisioning/claim', request)).data,
  bootstrap: async (profile: { deviceCode: string; secret: string }): Promise<DeviceBootstrap> =>
    (await javaApi.get<DeviceBootstrap>('/device-runtime/bootstrap', {
      auth: { username: profile.deviceCode, password: profile.secret },
    })).data,
  events: async (): Promise<DeviceEvent[]> => (await javaApi.get<DeviceEvent[]>('/device-events')).data,
  acknowledge: async (eventId: string) => javaApi.patch(`/device-events/${eventId}/acknowledge`),
  resolve: async (eventId: string, note: string) => javaApi.patch(`/device-events/${eventId}/resolve`, { note }),
};
