import { deviceApi } from '../api/deviceApi';
import { deviceProvisioningStorage } from './deviceProvisioningStorage';

/** Resolves the live kiosk identity/endpoints; never trusts an Expo public env. */
export async function getActiveKioskRuntime() {
  const profile = await deviceProvisioningStorage.read();
  if (!profile) throw new Error('Thiết bị này chưa được đăng ký làm Kiosk');
  const bootstrap = await deviceApi.bootstrap(profile);
  if (bootstrap.lifecycleStatus !== 'ACTIVE') {
    throw new Error('Kiosk chưa được kích hoạt hoặc đã bị tạm khóa');
  }
  return { profile, bootstrap };
}
