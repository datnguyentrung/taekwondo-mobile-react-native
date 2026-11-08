import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';

import { isTerminalFaceCheckInStage } from '../domain/faceCheckInProgress';
import { consumeFaceCheckInEvents } from './faceCheckInEventStream';
import { faceCheckInApi } from './faceCheckInApi';
import type { FaceCheckInEvent } from '../types/faceScanner.types';

type RunFaceCheckInOptions = {
  photoFilePath: string;
  signal: AbortSignal;
  onEvent: (event: FaceCheckInEvent) => void;
};

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
  let terminalEvent: FaceCheckInEvent | undefined;
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
    await faceCheckInApi.uploadPhotoToFog(photoFilePath, registration, signal);
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
