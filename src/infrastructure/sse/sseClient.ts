import { fetch as expoFetch } from 'expo/fetch';

import {
  SseTransportError,
  type SseEnvelope,
  type SseReconnectOptions,
  type SseStreamOptions,
} from './sse.types';

const defaultReconnect: Required<SseReconnectOptions> = {
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  multiplier: 2,
  jitterRatio: 0.2,
};

type SseResponse = {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
  headers?: { get(name: string): string | null };
};

function parseSseFrame(lines: string[]): SseEnvelope | null {
  const envelope: SseEnvelope = {};
  const data: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    const separator = line.indexOf(':');
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? '' : line.slice(separator + 1).replace(/^ /, '');

    if (field === 'id' && !value.includes('\0')) envelope.id = value;
    if (field === 'event') envelope.event = value;
    if (field === 'data') data.push(value);
    if (field === 'retry' && /^\d+$/.test(value)) envelope.retry = Number(value);
  }

  if (data.length) envelope.data = data.join('\n');
  return envelope.id !== undefined || envelope.event !== undefined || envelope.data !== undefined || envelope.retry !== undefined
    ? envelope
    : null;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function reconnectDelay(
  attempt: number,
  retryFromServer: number | undefined,
  reconnect: Required<SseReconnectOptions>,
): number {
  const base = retryFromServer ?? Math.min(
    reconnect.maxDelayMs,
    reconnect.initialDelayMs * reconnect.multiplier ** attempt,
  );
  const jitter = base * reconnect.jitterRatio;
  return Math.max(0, Math.round(base - jitter + Math.random() * jitter * 2));
}

async function waitForReconnect(delayMs: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return false;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), delayMs);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve(false);
      },
      { once: true },
    );
  });
}

function createHeaders(
  suppliedHeaders: Record<string, string>,
  lastEventId: string | undefined,
): Record<string, string> {
  const headers = Object.fromEntries(
    Object.entries(suppliedHeaders).filter(([name]) => {
      const normalizedName = name.toLowerCase();
      return normalizedName !== 'accept'
        && normalizedName !== 'cache-control'
        && normalizedName !== 'last-event-id';
    }),
  );

  return {
    ...headers,
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
  };
}

async function* readResponse<T>(
  response: SseResponse,
  decode: (envelope: SseEnvelope) => T | null,
  signal: AbortSignal,
  state: { lastEventId?: string; retryMs?: number; receivedEnvelope: boolean },
): AsyncGenerator<T> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let frameLines: string[] = [];

  const dispatch = function* (): Generator<T> {
    const envelope = parseSseFrame(frameLines);
    frameLines = [];
    if (!envelope) return;
    state.receivedEnvelope = true;
    if (envelope.id !== undefined) state.lastEventId = envelope.id;
    if (envelope.retry !== undefined) state.retryMs = envelope.retry;
    let value: T | null;
    try {
      value = decode(envelope);
    } catch (error) {
      throw new SseDecodeError(error);
    }
    if (value !== null) yield value;
  };

  const consumeText = function* (text: string): Generator<T> {
    pending += text;
    let match: RegExpExecArray | null;
    const lineBreak = /\r\n|\r|\n/g;
    let offset = 0;
    while ((match = lineBreak.exec(pending))) {
      const line = pending.slice(offset, match.index);
      offset = match.index + match[0].length;
      if (line === '') {
        yield* dispatch();
      } else {
        frameLines.push(line);
      }
    }
    pending = pending.slice(offset);
  };

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (value) yield* consumeText(decoder.decode(value, { stream: !done }));
      if (!done) continue;

      const finalText = decoder.decode();
      if (finalText) yield* consumeText(finalText);
      if (pending) frameLines.push(pending);
      if (frameLines.length) yield* dispatch();
      return;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

class SseDecodeError extends Error {
  constructor(readonly cause: unknown) {
    super('Unable to decode SSE envelope.');
    this.name = 'SseDecodeError';
  }
}

/**
 * Opens an authenticated server-sent-event stream. The caller owns event
 * decoding; this module owns HTTP streaming, framing, reconnect and cleanup.
 */
export async function* streamSse<T>(options: SseStreamOptions<T>): AsyncGenerator<T> {
  const reconnect = options.reconnect === false
    ? null
    : { ...defaultReconnect, ...options.reconnect };
  const state: { lastEventId?: string; retryMs?: number; receivedEnvelope: boolean } = {
    receivedEnvelope: false,
  };
  let attempt = 0;

  while (!options.signal.aborted) {
    try {
      const suppliedHeaders = await options.headers();
      const response = await expoFetch(options.url, {
        method: options.method ?? 'GET',
        ...(options.body !== undefined ? { body: options.body } : {}),
        signal: options.signal,
        headers: createHeaders(suppliedHeaders, state.lastEventId),
      }) as unknown as SseResponse;

      if (response.status === 204) return;
      if (!response.ok) {
        throw new SseTransportError(
          `Unable to open SSE stream (${response.status})`,
          'http',
          isRetryableStatus(response.status),
          response.status,
        );
      }
      if (!response.body) {
        throw new SseTransportError('SSE response has no readable body.', 'protocol', false, response.status);
      }
      const contentType = response.headers?.get('content-type');
      if (contentType && !contentType.toLowerCase().includes('text/event-stream')) {
        throw new SseTransportError(
          `Expected text/event-stream but received ${contentType}.`,
          'protocol',
          false,
          response.status,
        );
      }

      state.receivedEnvelope = false;
      for await (const value of readResponse(response, options.decode, options.signal, state)) {
        yield value;
      }
      if (options.signal.aborted || !reconnect) return;
      if (state.receivedEnvelope) attempt = 0;
    } catch (error) {
      if (options.signal.aborted) return;
      if (error instanceof SseDecodeError) throw error.cause;
      if (error instanceof SseTransportError && !error.retryable) throw error;
      if (!reconnect) {
        throw error instanceof SseTransportError
          ? error
          : new SseTransportError('Unable to read SSE stream.', 'network', true);
      }
    }

    if (!reconnect) return;
    const delayMs = reconnectDelay(attempt, state.retryMs, reconnect);
    state.retryMs = undefined;
    attempt += 1;
    if (!await waitForReconnect(delayMs, options.signal)) return;
  }
}
