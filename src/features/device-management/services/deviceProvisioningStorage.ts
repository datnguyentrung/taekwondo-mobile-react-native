import { secureStorage } from '@/infrastructure/storage/secureStorage';
import type { DeviceProvisioningProfile } from '../domain/device.types';
const KEY = 'device-provisioning-profile-v1';
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const deviceProvisioningStorage = {
  async read(): Promise<DeviceProvisioningProfile | null> { const raw = await secureStorage.get(KEY); return raw ? JSON.parse(raw) as DeviceProvisioningProfile : null; },
  async write(profile: DeviceProvisioningProfile): Promise<void> {
    await secureStorage.set(KEY, JSON.stringify(profile));
    notify();
  },
  async clear(): Promise<void> {
    await secureStorage.remove(KEY);
    notify();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
