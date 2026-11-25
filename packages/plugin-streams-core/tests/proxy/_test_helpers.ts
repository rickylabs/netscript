import type {
  StreamProxyClockPort,
  StreamProxyRevocationSignal,
  StreamProxyRevocationSource,
} from '../../proxy.ts';

export interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}

export function createDeferred<T = void>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

interface ScheduledTimer {
  readonly id: number;
  readonly fireAt: number;
  readonly onFire: () => void;
  canceled: boolean;
}

/** Deterministic fake clock with chronological timer advancement and zero real timers. */
export class FakeClock implements StreamProxyClockPort {
  #nowMs: number;
  #nextId = 1;
  #timers: ScheduledTimer[] = [];

  constructor(initialMs = 1_700_000_000_000) {
    this.#nowMs = initialMs;
  }

  nowMs(): number {
    return this.#nowMs;
  }

  get pendingCount(): number {
    return this.#timers.filter((t) => !t.canceled).length;
  }

  schedule(delayMs: number, onFire: () => void): () => void {
    const timer: ScheduledTimer = {
      id: this.#nextId++,
      fireAt: this.#nowMs + Math.max(0, delayMs),
      onFire,
      canceled: false,
    };
    this.#timers.push(timer);
    return (): void => {
      timer.canceled = true;
    };
  }

  /** Advance clock time without firing scheduled timers (tests post-await expiry check). */
  setNowWithoutFiring(nextNowMs: number): void {
    this.#nowMs = nextNowMs;
  }

  /** Advance clock time by `deltaMs`, firing due timers in chronological order. */
  async advance(deltaMs: number): Promise<void> {
    const targetMs = this.#nowMs + deltaMs;
    while (true) {
      const due = this.#timers
        .filter((t) => !t.canceled && t.fireAt <= targetMs)
        .sort((a, b) => a.fireAt - b.fireAt || a.id - b.id);
      const next = due[0];
      if (!next) break;
      next.canceled = true;
      this.#nowMs = next.fireAt;
      next.onFire();
      // Yield microtasks so timer-triggered async continuations can progress/schedule.
      await flushMicrotasks();
    }
    this.#nowMs = targetMs;
    this.#timers = this.#timers.filter((t) => !t.canceled);
    await flushMicrotasks();
  }
}

export async function flushMicrotasks(turns = 8): Promise<void> {
  for (let i = 0; i < turns; i += 1) {
    await Promise.resolve();
  }
}

export function sseDataBlock(payload: unknown, eol = '\n'): string {
  return `event: data${eol}data: ${JSON.stringify(payload)}${eol}${eol}`;
}

export function sseControlBlock(
  control: {
    readonly streamNextOffset: string;
    readonly streamCursor?: string;
    readonly upToDate?: boolean;
    readonly streamClosed?: boolean;
  },
  eol = '\n',
): string {
  return `event: control${eol}data: ${JSON.stringify(control)}${eol}${eol}`;
}

export function makeStateChange(
  key: string,
  value: Record<string, unknown>,
): readonly [{
  readonly type: string;
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly headers: {
    readonly operation: 'upsert';
    readonly correlationId: string;
    readonly traceparent: string;
  };
}] {
  return [{
    type: 'item',
    key,
    value,
    headers: {
      operation: 'upsert' as const,
      correlationId: `corr-${key}`,
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    },
  }];
}

export interface ControlledUpstreamReader {
  readonly index: number;
  readonly url: string;
  readonly headers: Headers;
  readonly signal: AbortSignal | undefined;
  canceled: boolean;
  cancelReason: unknown;
  push(chunk: string | Uint8Array): void;
  close(): void;
  error(err: unknown): void;
}

export interface ControlledUpstreamOptions {
  readonly responseHeaders?: HeadersInit;
  readonly slowCancelDeferred?: Deferred<void>;
  readonly onOpen?: (reader: ControlledUpstreamReader) => void;
}

export interface ControlledUpstreamHandle {
  readonly fetch: typeof fetch;
  readonly readers: readonly ControlledUpstreamReader[];
  readonly activeCount: number;
  readonly totalOpened: number;
}

export function createControlledUpstream(
  options: ControlledUpstreamOptions = {},
): ControlledUpstreamHandle {
  const encoder = new TextEncoder();
  const readers: ControlledUpstreamReader[] = [];
  let activeCount = 0;

  const fetchImpl: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const reqHeaders = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    const idx = readers.length;
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let isClosed = false;

    activeCount += 1;
    let released = false;
    const markReleased = (): void => {
      if (released) return;
      released = true;
      activeCount -= 1;
    };

    const entry: ControlledUpstreamReader = {
      index: idx,
      url,
      headers: reqHeaders,
      signal: init?.signal ?? undefined,
      canceled: false,
      cancelReason: undefined,
      push(chunk: string | Uint8Array): void {
        if (isClosed) return;
        const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
        try {
          controller.enqueue(bytes);
        } catch {
          // Already closed/cancelled.
        }
      },
      close(): void {
        if (isClosed) return;
        isClosed = true;
        markReleased();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      },
      error(err: unknown): void {
        if (isClosed) return;
        isClosed = true;
        markReleased();
        try {
          controller.error(err);
        } catch {
          // Already closed.
        }
      },
    };

    const body = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
      },
      async cancel(reason) {
        isClosed = true;
        entry.canceled = true;
        entry.cancelReason = reason;
        if (options.slowCancelDeferred) {
          await options.slowCancelDeferred.promise;
        }
        markReleased();
      },
    });

    readers.push(entry);
    options.onOpen?.(entry);

    const headers = new Headers(options.responseHeaders);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'text/event-stream; charset=utf-8');
    }
    return Promise.resolve(new Response(body, { status: 200, headers }));
  };

  return {
    fetch: fetchImpl,
    readers,
    get activeCount(): number {
      return activeCount;
    },
    get totalOpened(): number {
      return readers.length;
    },
  };
}

export async function readAllText(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return text;
}

export async function readOneChunkText(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<{ readonly done: boolean; readonly text: string }> {
  const { done, value } = await reader.read();
  if (done) return { done: true, text: '' };
  return { done: false, text: new TextDecoder().decode(value) };
}

export interface TestGrant {
  readonly sessionId: string;
}

export interface SharedRevocationHub {
  readonly revocationSource: StreamProxyRevocationSource<TestGrant>;
  isActive(sessionId: string): boolean;
  revoke(sessionId: string, pushAction?: 'recheck' | 'revoked'): number;
  unsubscribeCount(sessionId: string): number;
  activeSubscriptions(sessionId: string): number;
}

/** Shared synthetic revocation hub simulating a cross-gateway revocation store + push channel. */
export function createSharedRevocationHub(): SharedRevocationHub {
  const revoked = new Set<string>();
  const subscribers = new Map<string, Set<(signal?: StreamProxyRevocationSignal) => void>>();
  const unsubscribeCounts = new Map<string, number>();

  const revocationSource: StreamProxyRevocationSource<TestGrant> = {
    subscribe(grant, notify) {
      let set = subscribers.get(grant.sessionId);
      if (!set) {
        set = new Set();
        subscribers.set(grant.sessionId, set);
      }
      set.add(notify);
      return (): void => {
        set?.delete(notify);
        unsubscribeCounts.set(grant.sessionId, (unsubscribeCounts.get(grant.sessionId) ?? 0) + 1);
      };
    },
  };

  return {
    revocationSource,
    isActive(sessionId: string): boolean {
      return !revoked.has(sessionId);
    },
    revoke(sessionId: string, pushAction?: 'recheck' | 'revoked'): number {
      revoked.add(sessionId);
      if (!pushAction) return 0;
      const listeners = [...(subscribers.get(sessionId) ?? [])];
      for (const notify of listeners) {
        notify({ action: pushAction, reason: 'session_revoked' });
      }
      return listeners.length;
    },
    unsubscribeCount(sessionId: string): number {
      return unsubscribeCounts.get(sessionId) ?? 0;
    },
    activeSubscriptions(sessionId: string): number {
      return subscribers.get(sessionId)?.size ?? 0;
    },
  };
}
