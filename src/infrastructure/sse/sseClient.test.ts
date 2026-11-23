import { fetch as expoFetch } from 'expo/fetch';

import { streamSse } from './sseClient';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

type Reader = {
  read: jest.Mock;
  cancel: jest.Mock;
  releaseLock: jest.Mock;
};

function sseResponse(chunks: string[], options: { status?: number; contentType?: string } = {}) {
  const reader: Reader = {
    read: jest.fn(),
    cancel: jest.fn().mockResolvedValue(undefined),
    releaseLock: jest.fn(),
  };
  for (const chunk of chunks) {
    reader.read.mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunk) });
  }
  reader.read.mockResolvedValueOnce({ done: true, value: undefined });
  return {
    ok: (options.status ?? 200) >= 200 && (options.status ?? 200) < 300,
    status: options.status ?? 200,
    body: { getReader: () => reader },
    headers: { get: () => options.contentType ?? 'text/event-stream' },
    reader,
  };
}

async function take<T>(stream: AsyncGenerator<T>, count: number): Promise<T[]> {
  const values: T[] = [];
  for await (const value of stream) {
    values.push(value);
    if (values.length === count) break;
  }
  return values;
}

describe('streamSse', () => {
  const fetchMock = jest.mocked(expoFetch);

  beforeEach(() => fetchMock.mockReset());

  it('frames split chunks, ignores comments, supports multiline data and protects transport headers', async () => {
    const response = sseResponse([
      ': heartbeat\r\nid: 7\r\nevent: update\r\ndata: {"name":',
      '"Mai"}\r\ndata: {"active":true}\r\n\r\n',
    ]);
    fetchMock.mockResolvedValue(response as never);
    const headers = jest.fn().mockResolvedValue({
      Authorization: 'Bearer first',
      Accept: 'application/json',
      'Cache-Control': 'max-age=60',
    });

    const values = await take(
      streamSse({
        url: 'https://api.example.test/events',
        signal: new AbortController().signal,
        headers,
        decode: (event) => event.data,
        reconnect: false,
      }),
      1,
    );

    expect(values).toEqual(['{"name":"Mai"}\n{"active":true}']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/events',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer first',
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        }),
      }),
    );
    expect(response.reader.cancel).toHaveBeenCalledTimes(1);
    expect(response.reader.releaseLock).toHaveBeenCalledTimes(1);
  });

  it('reconnects with the latest event id and obtains fresh headers for every attempt', async () => {
    const first = sseResponse(['id: 10\ndata: first\n\n']);
    const second = sseResponse(['id: 11\ndata: second\n\n']);
    fetchMock.mockResolvedValueOnce(first as never).mockResolvedValueOnce(second as never);
    const controller = new AbortController();
    const headers = jest
      .fn()
      .mockResolvedValueOnce({ Authorization: 'Bearer first' })
      .mockResolvedValueOnce({ Authorization: 'Bearer refreshed' });

    const values = await take(
      streamSse({
        url: 'https://api.example.test/events',
        signal: controller.signal,
        headers,
        decode: (event) => event.data,
        reconnect: { initialDelayMs: 0, maxDelayMs: 0, multiplier: 1, jitterRatio: 0 },
      }),
      2,
    );

    expect(values).toEqual(['first', 'second']);
    expect(headers).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/events',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer refreshed',
          'Last-Event-ID': '10',
        }),
      }),
    );
  });

  it('ignores envelopes selected out by the decoder and accepts server retry directives', async () => {
    const response = sseResponse(['retry: 0\n\nevent: ignored\ndata: no\n\nevent: kept\ndata: yes\n\n']);
    fetchMock.mockResolvedValue(response as never);

    const values = await take(
      streamSse({
        url: 'https://api.example.test/events',
        signal: new AbortController().signal,
        headers: () => ({}),
        decode: (event) => event.event === 'kept' ? event.data : null,
        reconnect: false,
      }),
      1,
    );

    expect(values).toEqual(['yes']);
  });

  it('throws a non-retryable typed error for invalid SSE responses', async () => {
    const response = sseResponse([], { contentType: 'application/json' });
    fetchMock.mockResolvedValue(response as never);
    const stream = streamSse({
      url: 'https://api.example.test/events',
      signal: new AbortController().signal,
      headers: () => ({}),
      decode: (event) => event.data,
    });

    await expect(stream.next()).rejects.toEqual(
      expect.objectContaining({
        name: 'SseTransportError',
        kind: 'protocol',
        retryable: false,
      }),
    );
  });

  it('surfaces decoder failures without reconnecting', async () => {
    const response = sseResponse(['data: value\n\n']);
    fetchMock.mockResolvedValue(response as never);
    const stream = streamSse({
      url: 'https://api.example.test/events',
      signal: new AbortController().signal,
      headers: () => ({}),
      decode: () => {
        throw new Error('Unsupported event payload');
      },
      reconnect: { initialDelayMs: 0, maxDelayMs: 0, multiplier: 1, jitterRatio: 0 },
    });

    await expect(stream.next()).rejects.toThrow('Unsupported event payload');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ends normally when the server returns HTTP 204', async () => {
    const response = sseResponse([], { status: 204 });
    fetchMock.mockResolvedValue(response as never);
    const stream = streamSse({
      url: 'https://api.example.test/events',
      signal: new AbortController().signal,
      headers: () => ({}),
      decode: (event) => event.data,
    });

    await expect(stream.next()).resolves.toEqual({ done: true, value: undefined });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops without reconnecting when aborted during the reconnect delay', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const controller = new AbortController();
    const stream = streamSse({
      url: 'https://api.example.test/events',
      signal: controller.signal,
      headers: () => ({}),
      decode: (event) => event.data,
      reconnect: { initialDelayMs: 10_000, maxDelayMs: 10_000, multiplier: 1, jitterRatio: 0 },
    });
    const next = stream.next();
    await Promise.resolve();
    controller.abort();

    await expect(next).resolves.toEqual({ done: true, value: undefined });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
