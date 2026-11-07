import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';

import { consumeFaceCheckInEvents } from './faceCheckInEventStream';
import { faceCheckInApi } from './faceCheckInApi';
import type { FaceCheckInEvent } from '../types/faceScanner.types';

type RunFaceCheckInOptions = {
  photoFilePath: string;
  signal: AbortSignal;
  onEvent: (event: FaceCheckInEvent) => void;
};

export async function runFaceCheckIn({
  photoFilePath,
  signal,
  onEvent,
}: RunFaceCheckInOptions): Promise<FaceCheckInEvent> {
  const requestId = Crypto.randomUUID();
  console.log('[FaceCheckIn] registering scan with Java', {
    requestId,
    deviceId: env.kioskDeviceId,
  });
  const registration = await faceCheckInApi.registerScan(
    requestId,
    env.kioskDeviceId,
  );

  if (
    registration.requestId !== requestId ||
    registration.deviceId !== env.kioskDeviceId
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
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const stream = consumeFaceCheckInEvents({
    requestId,
    signal,
    onEvent: (event) => {
      if (event.deviceId !== env.kioskDeviceId) return;
      onEvent(event);
      if (event.stage === 'READY') {
        console.log('[FaceCheckIn] READY received; sending photo to Fog', { requestId });
        resolveReady?.();
      }
      if (
        event.stage === 'REJECTED' ||
        event.stage === 'FAILED' ||
        event.stage === 'EXPIRED'
      ) {
        rejectReady?.(new Error(`Face check-in ended at ${event.stage}`));
      }
    },
  });
  void stream.catch((error) => rejectReady?.(error));

  await ready;
  await faceCheckInApi.uploadPhotoToFog(photoFilePath, registration, signal);
  return stream;
}
