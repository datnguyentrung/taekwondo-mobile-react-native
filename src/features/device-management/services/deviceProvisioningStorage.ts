import { secureStorage } from '@/infrastructure/storage/secureStorage';
import type { DeviceProvisioningProfile } from '../domain/device.types';
const KEY = 'device-provisioning-profile-v1';
export const deviceProvisioningStorage = {
  async read(): Promise<DeviceProvisioningProfile | null> { const raw = await secureStorage.get(KEY); return raw ? JSON.parse(raw) as DeviceProvisioningProfile : null; },
  write(profile: DeviceProvisioningProfile): Promise<void> { return secureStorage.set(KEY, JSON.stringify(profile)); },
  clear(): Promise<void> { return secureStorage.remove(KEY); },
};
