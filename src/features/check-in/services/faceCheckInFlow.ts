import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';
import { getActiveKioskRuntime } from '@/features/device-management/services/deviceRuntime';
import { deviceProvisioningStorage } from '@/features/device-management/services/deviceProvisioningStorage';

import { isTerminalFaceCheckInStage } from '../domain/faceCheckInProgress';
import { consumeFaceCheckInEvents } from './faceCheckInEventStream';
import { faceCheckInApi } from './faceCheckInApi';
import type { FaceCheckInEvent } from '../types/faceScanner.types';

type RunFaceCheckInOptions = {
  photoFilePath: string;
  signal: AbortSignal;
  onEvent: (event: FaceCheckInEvent) => void;
};

type FaceCheckInRuntime = {
  deviceId: string;
  fogApiUrl: string;
};

/**
 * A provisioned kiosk keeps its server-managed runtime. Regular mobile clients
 * use the shared Fog endpoint, so face check-in is not gated on kiosk enrollment.
 */
async function getFaceCheckInRuntime(): Promise<FaceCheckInRuntime> {
  const profile = await deviceProvisioningStorage.read();
  if (!profile) {
    return { deviceId: 'mobile-app', fogApiUrl: env.fogApiUrl };
  }

  const { bootstrap } = await getActiveKioskRuntime();
  if (!bootstrap.runtime.fogHttpUrl) {
    throw new Error('Kiosk chưa có địa chỉ fog runtime');
  }
  return { deviceId: profile.deviceCode, fogApiUrl: bootstrap.runtime.fogHttpUrl };
}

function isFogFaceRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: unknown; status?: unknown };
  return candidate.name === 'FaceCheckInTransportError' && candidate.status === 422;
}

export async function runFaceCheckIn({
  photoFilePath,
  signal,
  onEvent,
}: RunFaceCheckInOptions): Promise<FaceCheckInEvent> {
  const { deviceId, fogApiUrl } = await getFaceCheckInRuntime();
  const requestId = Crypto.randomUUID();
  console.log('[FaceCheckIn] registering scan with Java', {
    requestId,
    deviceId,
  });
  const registration = await faceCheckInApi.registerScan(
    requestId,
    deviceId,
  );

  if (
    registration.requestId !== requestId ||
    registration.deviceId !== deviceId
  ) {
    throw new Error('Face check-in registration identity mismatch');
  }
  console.log('[FaceCheckIn] scan registered; opening SSE', {
    requestId,
    deviceId: registration.deviceId,
    expiresAt: registration.expiresAt,
  });

  let resolveReady: (() => void) | undefined;
  let rejectReady: ((error: unknown) => void) | undefined;
  let terminalEvent: FaceCheckInEvent | undefined;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const stream = consumeFaceCheckInEvents({
    requestId,
    signal,
    onEvent: (event) => {
      if (event.deviceId !== deviceId) return;
      onEvent(event);
      if (event.stage === 'READY') {
        console.log('[FaceCheckIn] READY received; sending photo to Fog', { requestId });
        resolveReady?.();
      }
      if (isTerminalFaceCheckInStage(event.stage)) {
        terminalEvent = event;
        // A terminal event can arrive before READY when the scan expires.
        // Resolve so the flow can return the authoritative SSE outcome.
        resolveReady?.();
      }
    },
  });
  void stream.catch((error) => rejectReady?.(error));

  await ready;
  if (terminalEvent) return terminalEvent;

  try {
    await faceCheckInApi.uploadPhotoToFog(photoFilePath, registration, signal, fogApiUrl);
  } catch (error) {
    // Fog returns HTTP 422 for image/face validation, while it reports the same
    // business result to Java as a terminal SSE event. Prefer Java's event so
    // the screen receives the canonical code and does not show a false transport
    // failure. Authentication and network failures remain immediate failures.
    if (terminalEvent) return terminalEvent;
    if (isFogFaceRejection(error)) {
      console.log('[FaceCheckIn] Fog rejected image; awaiting Java terminal SSE', {
        requestId,
      });
      return stream;
    }
    throw error;
  }
  return stream;
}
