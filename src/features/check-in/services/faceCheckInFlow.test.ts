import * as Crypto from 'expo-crypto';

import { consumeFaceCheckInEvents } from './faceCheckInEventStream';
import { faceCheckInApi } from './faceCheckInApi';
import { runFaceCheckIn } from './faceCheckInFlow';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('./faceCheckInApi', () => ({
  faceCheckInApi: {
    registerScan: jest.fn(),
    uploadPhotoToFog: jest.fn(),
  },
}));
jest.mock('./faceCheckInEventStream', () => ({
  consumeFaceCheckInEvents: jest.fn(),
}));

describe('runFaceCheckIn', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens SSE, waits for READY and then uploads the photo to Fog', async () => {
    jest.mocked(Crypto.randomUUID).mockReturnValue('request-1');
    jest.mocked(faceCheckInApi.registerScan).mockResolvedValue({
      requestId: 'request-1',
      deviceId: 'kiosk-01',
      uploadTicket: 'ticket-1',
      expiresAt: '2026-11-06T10:00:30Z',
    });
    jest.mocked(faceCheckInApi.uploadPhotoToFog).mockResolvedValue();
    jest.mocked(consumeFaceCheckInEvents).mockImplementationOnce(
      async ({ onEvent }) => {
        onEvent({
          eventId: 1,
          requestId: 'request-1',
          deviceId: 'kiosk-01',
          stage: 'READY',
          occurredAt: '2026-11-06T10:00:00Z',
        });
        return {
          eventId: 8,
          requestId: 'request-1',
          deviceId: 'kiosk-01',
          stage: 'SUCCEEDED',
          occurredAt: '2026-11-06T10:00:02Z',
        };
      },
    );
    const controller = new AbortController();

    const terminal = await runFaceCheckIn({
      photoFilePath: '/capture/face.jpg',
      signal: controller.signal,
      onEvent: jest.fn(),
    });

    expect(
      jest.mocked(consumeFaceCheckInEvents).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(faceCheckInApi.uploadPhotoToFog).mock.invocationCallOrder[0]!,
    );
    expect(faceCheckInApi.uploadPhotoToFog).toHaveBeenCalledWith(
      '/capture/face.jpg',
      expect.objectContaining({ uploadTicket: 'ticket-1' }),
      controller.signal,
    );
    expect(terminal.stage).toBe('SUCCEEDED');
  });
});
