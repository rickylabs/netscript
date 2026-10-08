/** Abort-aware supervision of the public durable stream read seam. @module */

import { DurableStreamError, FetchError } from '@durable-streams/client';
import type {
  DurableStream,
  JsonBatch,
  StreamOptions,
  StreamResponse,
} from '@durable-streams/client';
import type {
  NetScriptStreamDBReconnectOptions,
  NetScriptStreamDBStatus,
} from './create-stream-db.ts';

/** Clock port for recovery backoff; abort must interrupt the wait. */
export type StreamDBRecoveryWait = (delayMs: number, signal: AbortSignal) => Promise<void>;

interface RecoveryState {
  status: NetScriptStreamDBStatus;
  retries: number;
  offset: string;
  upToDate: boolean;
  cursor?: string;
}

/** Default clock adapter removes its abort listener on either completion path. */
async function waitForRecovery(delayMs: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(finish, delayMs);
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abort, { once: true });
  });
}

function isRecoverableReadError(error: unknown): boolean {
  if (error instanceof FetchError || error instanceof DurableStreamError) {
    const status = error.status;
    return status === 404 || status === 429 || (status !== undefined && status >= 500);
  }
  // Native fetch rejects network failures with TypeError. Subscriber exceptions
  // are separately tagged before reaching this classification boundary.
  return error instanceof TypeError;
}

/** Retain the native handle while supervising only StreamDB's JSON subscription. */
export function createStreamDBRecoveryAdapter(
  native: DurableStream,
  options: NetScriptStreamDBReconnectOptions = {},
  wait: StreamDBRecoveryWait = waitForRecovery,
): { readonly stream: DurableStream; readonly status: NetScriptStreamDBStatus; stop(): void } {
  const maxRetries = options.maxRetries ?? 5;
  const initialDelayMs = options.initialDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 5_000;
  if (
    !Number.isSafeInteger(maxRetries) || maxRetries < 0 ||
    !Number.isFinite(initialDelayMs) || initialDelayMs <= 0 ||
    !Number.isFinite(maxDelayMs) || maxDelayMs < initialDelayMs
  ) throw new TypeError('StreamDB recovery requires finite retries and positive capped delays.');

  const lifetime = new AbortController();
  let state: RecoveryState = { status: 'idle', retries: 0, offset: '-1', upToDate: false };

  async function read<TJson>(
    readOptions: Omit<StreamOptions, 'url'> = {},
  ): Promise<StreamResponse<TJson>> {
    const signal = readOptions.signal
      ? AbortSignal.any([lifetime.signal, readOptions.signal])
      : lifetime.signal;
    signal.throwIfAborted();
    state = {
      status: 'connecting',
      retries: 0,
      offset: readOptions.offset ?? '-1',
      upToDate: false,
    };

    async function retry(error: unknown): Promise<void> {
      if (signal.aborted) {
        state.status = 'stopped';
        signal.throwIfAborted();
      }
      if (!isRecoverableReadError(error) || state.retries >= maxRetries) {
        state.status = 'failed';
        throw error;
      }
      state.status = 'retrying';
      const delayMs = Math.min(maxDelayMs, initialDelayMs * 2 ** state.retries++);
      try {
        await wait(delayMs, signal);
      } catch (error) {
        state.status = signal.aborted ? 'stopped' : 'failed';
        throw error;
      }
    }

    async function connect(): Promise<{ session: StreamResponse<TJson>; release(): void }> {
      while (true) {
        signal.throwIfAborted();
        const attempt = new AbortController();
        const abort = () => attempt.abort(signal.reason);
        signal.addEventListener('abort', abort, { once: true });
        const release = () => {
          signal.removeEventListener('abort', abort);
          attempt.abort();
        };
        try {
          const session = await native.stream<TJson>({
            ...readOptions,
            signal: attempt.signal,
            offset: state.offset,
            live: false,
            params: {
              ...readOptions.params,
              ...(state.upToDate ? { live: 'long-poll' } : {}),
              ...(state.cursor ? { cursor: state.cursor } : {}),
            },
          });
          // Native closed may settle before consumption. Observe its rejection
          // without using it to decide whether a batch was parsed or committed.
          void session.closed.catch(() => {});
          if (signal.aborted) {
            session.cancel();
            signal.throwIfAborted();
          }
          return { session, release };
        } catch (error) {
          release();
          await retry(error);
        }
      }
    }

    const first = await connect();
    let resolveClosed!: () => void;
    let rejectClosed!: (error: unknown) => void;
    const closed = new Promise<void>((resolve, reject) => {
      resolveClosed = resolve;
      rejectClosed = reject;
    });
    let subscribed = false;

    function subscribeJson<T = TJson>(subscriber: (batch: JsonBatch<T>) => void | Promise<void>) {
      if (subscribed) throw new TypeError('StreamDB read already has a subscriber.');
      subscribed = true;
      let current = first;
      let session = current.session;
      async function consume(): Promise<void> {
        while (!signal.aborted) {
          let subscriberFailed = false;
          try {
            // Native json() spreads the parsed array into push, exceeding V8's
            // argument limit on large catch-up batches. text() keeps the same
            // finite response boundary without accumulating via spread.
            const parsed = JSON.parse((await session.text()).trim() || '[]');
            const items: T[] = Array.isArray(parsed) ? parsed : [parsed];
            const batch: JsonBatch<T> = {
              items,
              offset: session.offset,
              cursor: session.cursor,
              upToDate: session.upToDate,
              streamClosed: session.streamClosed,
            };
            try {
              await subscriber(batch);
            } catch (error) {
              subscriberFailed = true;
              throw error;
            }
            signal.throwIfAborted();
            state.offset = batch.offset;
            state.cursor = batch.cursor;
            state.upToDate = batch.upToDate;
            state.retries = 0;
            state.status = 'live';
            if (batch.streamClosed) break;
          } catch (error) {
            if (signal.aborted) {
              state.status = lifetime.signal.aborted ? 'stopped' : 'failed';
              if (state.status === 'failed') throw error;
              return;
            }
            if (subscriberFailed) {
              state.status = 'failed';
              throw error;
            }
            await retry(error);
          } finally {
            session.cancel();
            current.release();
          }
          current = await connect();
          session = current.session;
        }
        state.status = 'stopped';
      }
      void consume().then(resolveClosed, rejectClosed);
      return () => {
        lifetime.abort();
        state.status = 'stopped';
        session.cancel();
        current.release();
      };
    }

    return new Proxy(first.session, {
      get(target, key) {
        if (key === 'closed') return closed;
        if (key === 'subscribeJson') return subscribeJson;
        if (key === 'offset') return state.offset;
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  const stream = new Proxy(native, {
    get(target, key) {
      if (key === 'stream') return read;
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return {
    stream,
    get status() {
      return state.status;
    },
    stop() {
      state.status = 'stopped';
      lifetime.abort();
    },
  };
}
