import { fetch as expoFetch } from 'expo/fetch';

import { javaApi } from '@/infrastructure/http/httpClient';
import { faceCheckInApi } from './faceCheckInApi';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/infrastructure/http/httpClient', () => ({
  javaApi: { post: jest.fn() },
}));

describe('faceCheckInApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers requestId and deviceId with Java without uploading an image', async () => {
    (javaApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        requestId: 'request-1',
        deviceId: 'kiosk-01',
        uploadTicket: 'ticket-1',
        expiresAt: '2026-11-06T10:00:30Z',
      },
    });

    const registration = await faceCheckInApi.registerScan(
      'request-1',
      'kiosk-01',
    );

    expect(javaApi.post).toHaveBeenCalledWith(
      '/training/face-check-in-scans',
      { requestId: 'request-1', deviceId: 'kiosk-01' },
    );
    expect(registration.uploadTicket).toBe('ticket-1');
  });

  it('uploads the photo and scan identity only to Fog', async () => {
    (expoFetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 202 });
    const controller = new AbortController();

    await faceCheckInApi.uploadPhotoToFog(
      '/capture/face.jpg',
      {
        requestId: 'request-1',
        deviceId: 'kiosk-01',
        uploadTicket: 'ticket-1',
        expiresAt: '2026-11-06T10:00:30Z',
      },
      controller.signal,
    );

    expect(expoFetch).toHaveBeenCalledWith(
      'http://localhost:8000/face-check-in-scans',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
        signal: controller.signal,
      }),
    );
    expect(javaApi.post).not.toHaveBeenCalled();
  });
});
