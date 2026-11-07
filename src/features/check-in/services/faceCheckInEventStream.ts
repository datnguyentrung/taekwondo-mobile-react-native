import { env } from '@/config/env';
import { authStore } from '@/features/authentication/store/auth.store';
import { fetch as expoFetch } from 'expo/fetch';

import {
  isFaceCheckInStage,
  isTerminalFaceCheckInStage,
} from '../domain/faceCheckInProgress';
import type {
  BackendFaceCheckInResponse,
  FaceCheckInEvent,
} from '../types/faceScanner.types';

const RECONNECT_DELAY_MS = 250;

type StreamOptions = {
  requestId: string;
  signal: AbortSignal;
  onEvent: (event: FaceCheckInEvent) => void;
};

type ParsedSseFrame = {
  id?: string;
  event?: string;
  data?: string;
};

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export function parseSseFrame(frame: string): ParsedSseFrame | null {
  const parsed: ParsedSseFrame = {};
  const data: string[] = [];

  for (const line of frame.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;
    const separator = line.indexOf(':');
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? '' : line.slice(separator + 1).replace(/^ /, '');
    if (field === 'id') parsed.id = value;
    if (field === 'event') parsed.event = value;
    if (field === 'data') data.push(value);
  }

  if (data.length) parsed.data = data.join('\n');
  return parsed.id || parsed.event || parsed.data ? parsed : null;
}

async function delay(signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw signal.reason ?? new Error('Aborted');
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, RECONNECT_DELAY_MS);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error('Aborted'));
      },
      { once: true },
    );
  });
}

function decodeResult(value: unknown): BackendFaceCheckInResponse | null | undefined {
  if (value == null) return value as null | undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as BackendFaceCheckInResponse;
    } catch {
      return undefined;
    }
  }
  return typeof value === 'object'
    ? (value as BackendFaceCheckInResponse)
    : undefined;
}

function decodeEvent(frame: ParsedSseFrame): FaceCheckInEvent | null {
  if (frame.event && frame.event !== 'face-check-in') return null;
  if (!frame.data) return null;
  try {
    const event = JSON.parse(frame.data) as FaceCheckInEvent;
    if (
      !event ||
      typeof event.eventId !== 'number' ||
      typeof event.requestId !== 'string' ||
      typeof event.deviceId !== 'string' ||
      !isFaceCheckInStage(event.stage)
    ) {
      return null;
    }
    return {
      ...event,
      result: decodeResult((event as { result?: unknown }).result),
    };
  } catch {
    return null;
  }
}

export async function consumeFaceCheckInEvents({
  requestId,
  signal,
  onEvent,
}: StreamOptions): Promise<FaceCheckInEvent> {
  let lastEventId: string | undefined;
  const deliveredEventIds = new Set<number>();
  let lastFailure: string | undefined;

  while (!signal.aborted) {
    try {
      const accessToken = authStore.getAccessToken();
      if (!accessToken) throw new Error('Missing access token for face check-in SSE');

      const response = await expoFetch(
        `${env.javaApiUrl}/training/face-check-in-scans/${requestId}/events`,
        {
          method: 'GET',
          signal,
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`,
            'Cache-Control': 'no-cache',
            'ngrok-skip-browser-warning': 'true',
            ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
          },
        },
      );

      console.log('[FaceCheckIn] SSE response', {
        requestId,
        status: response.status,
        ok: response.ok,
        hasBody: Boolean(response.body),
        lastEventId: lastEventId ?? null,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Unable to open face check-in SSE (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let terminal: FaceCheckInEvent | null = null;

      while (!signal.aborted) {
        const { done, value } = await reader.read();
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });

        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? '';
        if (done && buffer.trim()) {
          frames.push(buffer);
          buffer = '';
        }
        for (const rawFrame of frames) {
          const frame = parseSseFrame(rawFrame);
          const event = frame ? decodeEvent(frame) : null;
          if (!event || event.requestId !== requestId) continue;
          lastEventId = frame?.id || String(event.eventId);
          if (deliveredEventIds.has(event.eventId)) continue;
          deliveredEventIds.add(event.eventId);
          console.log('[FaceCheckIn] SSE event', {
            requestId,
            eventId: event.eventId,
            stage: event.stage,
            hasResult: Boolean(event.result),
            hasPerson: Boolean(event.result?.person),
          });
          console.log(
            '[FaceCheckIn] SSE full event from Java',
            JSON.stringify(event, null, 2),
          );
          onEvent(event);
          if (isTerminalFaceCheckInStage(event.stage)) {
            terminal = event;
            break;
          }
        }

        if (terminal || done) break;
      }

      reader.releaseLock();
      if (terminal) return terminal;
      console.warn('[FaceCheckIn] SSE ended before a terminal event; reconnecting', {
        requestId,
      });
    } catch (error) {
      if (signal.aborted) throw signal.reason ?? error;
      const failure = describeError(error);
      if (failure !== lastFailure) {
        console.warn('[FaceCheckIn] SSE open/read failure; reconnecting', {
          requestId,
          error: failure,
        });
        lastFailure = failure;
      }
    }
    await delay(signal);
  }

  throw signal.reason ?? new Error('Face check-in SSE was aborted');
}
