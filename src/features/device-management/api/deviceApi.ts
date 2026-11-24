import { javaApi } from '@/infrastructure/http/httpClient';
import { create } from 'axios';
import type { DeviceBootstrap, DeviceEvent, ManagedDevice } from '../domain/device.types';

export type DeviceCreateRequest = {
  displayName: string;
  deviceType: 'FOG_GATEWAY' | 'KIOSK' | 'ESP32';
  branchId?: number | null;
  fogGatewayId?: string | null;
  pairedKioskId?: string | null;
};
export type DeviceUpdateRequest = { displayName: string; branchId?: number | null; fogGatewayId?: string | null; pairedKioskId?: string | null; groupCode?: string | null; areaLabel?: string | null; locationLabel?: string | null; };
export type Esp32PairingSession = { sessionId: string; hardwareId: string; firmwareVersion: string | null; hardwareVersion: string | null; status: 'WAITING' | 'APPROVED'; expiresAt: string; };

function fogClient(fogHttpUrl: string) {
  return create({ baseURL: fogHttpUrl, timeout: 10_000 });
}

export const deviceApi = {
  list: async (): Promise<ManagedDevice[]> => (await javaApi.get<ManagedDevice[]>('/devices')).data,
  create: async (request: DeviceCreateRequest) => (await javaApi.post<ManagedDevice>('/devices', request)).data,
  get: async (deviceId: string): Promise<ManagedDevice> => (await javaApi.get<ManagedDevice>(`/devices/${deviceId}`)).data,
  update: async (deviceId: string, request: DeviceUpdateRequest): Promise<ManagedDevice> => (await javaApi.put<ManagedDevice>(`/devices/${deviceId}`, request)).data,
  remove: async (deviceId: string): Promise<void> => { await javaApi.delete(`/devices/${deviceId}`); },
  lifecycle: async (deviceId: string, targetStatus: string) => (await javaApi.patch<ManagedDevice>(`/devices/${deviceId}/lifecycle`, { targetStatus })).data,
  provisionCode: async (deviceId: string) => (await javaApi.post<{ code: string }>(`/devices/${deviceId}/provisioning-codes`)).data,
  claimFogAt: async (ipAddress: string, port: number, code: string) =>
    (await create({ baseURL: `http://${ipAddress}:${port}`, timeout: 10_000 }).post<{ deviceCode: string; status: string }>('/local/device-provisioning/fog/claim', { code })).data,
  esp32PairingSessions: async (fogHttpUrl: string): Promise<Esp32PairingSession[]> =>
    (await fogClient(fogHttpUrl).get<Esp32PairingSession[]>('/local/device-provisioning/esp32/pairing-sessions')).data,
  approveEsp32Pairing: async (fogHttpUrl: string, sessionId: string, code: string) =>
    (await fogClient(fogHttpUrl).post(`/local/device-provisioning/esp32/pairing-sessions/${sessionId}/approve`, { code })).data,
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
