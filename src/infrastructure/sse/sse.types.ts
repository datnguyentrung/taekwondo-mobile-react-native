export type SseEnvelope = {
  id?: string;
  event?: string;
  data?: string;
  retry?: number;
};

export type SseHeadersProvider = () =>
  | Record<string, string>
  | Promise<Record<string, string>>;

export type SseReconnectOptions = {
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
  jitterRatio?: number;
};

export type SseStreamOptions<T> = {
  url: string;
  method?: 'GET' | 'POST';
  body?: BodyInit;
  signal: AbortSignal;
  headers: SseHeadersProvider;
  decode: (envelope: SseEnvelope) => T | null;
  reconnect?: false | SseReconnectOptions;
};

export type SseTransportErrorKind = 'http' | 'protocol' | 'network';

export class SseTransportError extends Error {
  constructor(
    message: string,
    public readonly kind: SseTransportErrorKind,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'SseTransportError';
  }
}
