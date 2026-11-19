import { fetch as expoFetch } from 'expo/fetch';

import {
  consumeFaceCheckInEvents,
  parseSseFrame,
} from './faceCheckInEventStream';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/features/authentication/store/auth.store', () => ({
  authStore: { getAccessToken: () => 'access-token' },
}));

function sseResponse(payload: string) {
  const bytes = new TextEncoder().encode(payload);
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: jest
          .fn()
          .mockResolvedValueOnce({ done: false, value: bytes })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn(),
      }),
    },
  };
}

describe('parseSseFrame', () => {
  it('parses event id, name and multiline JSON data', () => {
    const frame = parseSseFrame(
      'id: 12\r\nevent: face-check-in\r\ndata: {"stage":"READY",\r\ndata: "requestId":"request-1"}',
    );

    expect(frame).toEqual({
      id: '12',
      event: 'face-check-in',
      data: '{"stage":"READY",\n"requestId":"request-1"}',
    });
  });

  it('ignores heartbeat comments', () => {
    expect(parseSseFrame(': keepalive')).toBeNull();
  });

  it('reconnects with Last-Event-ID and suppresses replayed events', async () => {
    const ready = JSON.stringify({
      eventId: 1,
      requestId: 'request-1',
      deviceId: 'kiosk-01',
      stage: 'READY',
      occurredAt: '2026-11-06T10:00:00Z',
    });
    const succeeded = JSON.stringify({
      eventId: 2,
      requestId: 'request-1',
      deviceId: 'kiosk-01',
      stage: 'SUCCEEDED',
      occurredAt: '2026-11-06T10:00:02Z',
    });
    jest
      .mocked(expoFetch)
      .mockResolvedValueOnce(
        sseResponse(`id: 1\nevent: face-check-in\ndata: ${ready}\n\n`) as never,
      )
      .mockResolvedValueOnce(
        sseResponse(`id: 1\nevent: face-check-in\ndata: ${ready}\n\nid: 2\nevent: face-check-in\ndata: ${succeeded}`) as never,
      );
    const onEvent = jest.fn();

    const terminal = await consumeFaceCheckInEvents({
      requestId: 'request-1',
      signal: new AbortController().signal,
      onEvent,
    });

    expect(terminal.stage).toBe('SUCCEEDED');
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(expoFetch).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Last-Event-ID': '1' }),
      }),
    );
  });

  it('decodes a legacy string result as the typed terminal response', async () => {
    const rejected = JSON.stringify({
      eventId: 46,
      requestId: 'request-1',
      deviceId: 'kiosk-01',
      stage: 'REJECTED',
      occurredAt: '2026-11-07T15:58:36Z',
      result: JSON.stringify({
        status: 'REJECTED',
        person: {
          personId: 'person-1',
          fullName: 'Nguyễn Trung Đạt',
          personCode: 'VQ_datnt_311005',
        },
        error: { code: 'FACE_CHECK_IN_NO_ACTIVE_CONTEXT' },
      }),
    });
    jest.mocked(expoFetch).mockResolvedValueOnce(
      sseResponse(`id: 46\nevent: face-check-in\ndata: ${rejected}\n\n`) as never,
    );

    const terminal = await consumeFaceCheckInEvents({
      requestId: 'request-1',
      signal: new AbortController().signal,
      onEvent: jest.fn(),
    });

    expect(terminal.result?.person.fullName).toBe('Nguyễn Trung Đạt');
    expect(terminal.result?.person.personCode).toBe('VQ_datnt_311005');
  });
});
