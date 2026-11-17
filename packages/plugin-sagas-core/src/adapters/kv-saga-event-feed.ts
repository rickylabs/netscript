import { abortable } from '@std/async';
import type { KvKey, WatchableKv } from '@netscript/kv';
import { SagaEventFeedError } from '../domain/errors.ts';
import type { SagaSSEEvent } from '../domain/saga-message.ts';

/** Number of retained events in journal format 1; one additional key stores the head. */
export const SAGA_EVENT_HISTORY_LIMIT = 256;

/** Stable journal position and detached event payload. */
export type SagaEventFeedEntry = Readonly<{
  /** Opaque epoch:sequence cursor, stable across readers and API restarts. */
  id: string;
  /** Committed observation payload. */
  event: SagaSSEEvent;
}>;

/** Ready barrier followed by ordered journal entries. Ready never advances a data cursor. */
export type SagaEventFeedItem =
  | Readonly<{ type: 'ready' }>
  | (SagaEventFeedEntry & Readonly<{ type: 'event' }>);

/** Cancellation for an append; abort does not undo an already committed write. */
export type SagaEventFeedAppendOptions = Readonly<{
  /** Signal limiting the caller's wait for backend IO. */
  signal?: AbortSignal;
}>;

/** Replay position and cancellation for one independently owned reader. */
export type SagaEventFeedSubscribeOptions = Readonly<{
  /** Replay after this retained id; absent or empty starts live at readiness. */
  afterId?: string;
  /** Aborts the subscription without closing the host's KV. */
  signal?: AbortSignal;
}>;

type Head = { format: 1; epoch: string; sequence: number };
type Cursor = { epoch?: string; sequence: number };
type Slot = { epoch: string; sequence: number; event: SagaSSEEvent };
const HEAD_KEY: KvKey = ['saga', 'event-feed', 'v1', 'head'];
const EPOCH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EVENT_TYPES = new Set([
  'saga:started',
  'saga:message_received',
  'saga:state_changed',
  'saga:completed',
  'saga:failed',
  'saga:compensating',
  'heartbeat',
]);

/**
 * Bounded, portable observation journal over a host-owned atomic/watchable KV.
 *
 * A successful head CAS orders each append across processes. The first append
 * creates an epoch; later appends inherit it. Readers use fixed-key notifications
 * and their own cursor, never keyspace scans or destructive consumption. Retention
 * is global, including events excluded by presentation filters. Storage durability
 * and per-event value limits follow the supplied KV backend.
 */
export class KvSagaEventFeed {
  /** Construct a journal without opening, owning, or closing the supplied KV. */
  constructor(private readonly kv: WatchableKv) {}

  /**
   * Commit one detached event and return its stable id. Only CAS conflicts retry
   * (at most 64 attempts); a thrown native commit has an unknown outcome.
   */
  async append(
    event: SagaSSEEvent,
    options: SagaEventFeedAppendOptions = {},
  ): Promise<SagaEventFeedEntry> {
    const { signal } = options;
    try {
      signal?.throwIfAborted();
      this.assertCapabilities();
      const snapshot = structuredClone(event);
      for (let attempt = 0; attempt < 64; attempt++) {
        const entry = await wait(this.kv.get(HEAD_KEY), signal);
        const previous = entry ? parseHead(entry.value) : null;
        if (previous?.sequence === Number.MAX_SAFE_INTEGER) {
          throw unavailable('Saga event sequence exhausted.');
        }
        const head: Head = {
          format: 1,
          epoch: previous?.epoch ?? crypto.randomUUID(),
          sequence: (previous?.sequence ?? 0) + 1,
        };
        signal?.throwIfAborted();
        const result = await wait(
          this.kv.atomic!(
            [{ key: HEAD_KEY, versionstamp: entry?.versionstamp ?? null }],
            [
              { type: 'set', key: slotKey(head.sequence), value: { ...head, event: snapshot } },
              { type: 'set', key: HEAD_KEY, value: head },
            ],
          ),
          signal,
        );
        if (result.ok) return { id: id(head), event: structuredClone(snapshot) };
      }
      throw unavailable('Saga event journal remained busy after 64 conflicts.');
    } catch (error) {
      signal?.throwIfAborted();
      throw asFeedError(error);
    }
  }

  /**
   * Subscribe live or resume after a retained id. Each reader buffers at most 256
   * records and coalesces head notifications independently of consumer speed.
   * A replay gap fails explicitly. Abort or iterator return releases only this
   * subscription; the host retains ownership of KV.
   */
  async *subscribe(
    options: SagaEventFeedSubscribeOptions = {},
  ): AsyncGenerator<SagaEventFeedItem> {
    const controller = new AbortController();
    const signal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;
    let pump: ReturnType<typeof watchHead> | undefined;
    try {
      signal.throwIfAborted();
      this.assertCapabilities();
      const requested = options.afterId ? parseCursor(options.afterId) : undefined;
      pump = watchHead(this.kv, signal);
      await wait(pump.ready, signal);
      pump.check();
      const initial = await this.readHead(signal);
      const cursor: Cursor = requested ?? {
        epoch: initial?.epoch,
        sequence: initial?.sequence ?? 0,
      };
      validateCursor(cursor, initial);
      yield { type: 'ready' };
      while (!signal.aborted) {
        // Capture before IO/yields: a concurrent wake must survive a slow reader.
        const wake = pump.token();
        pump.check();
        const head = await this.readHead(signal);
        pump.check();
        if (head && !cursor.epoch) cursor.epoch = head.epoch;
        validateCursor(cursor, head);
        if (head && cursor.sequence < head.sequence) {
          const keys = Array.from(
            { length: head.sequence - cursor.sequence },
            (_, offset) => slotKey(cursor.sequence + offset + 1),
          );
          const entries = await wait(
            this.kv.getMany
              ? this.kv.getMany<Slot>(keys)
              : Promise.all(keys.map((key) => this.kv.get<Slot>(key))),
            signal,
          );
          const start = cursor.sequence + 1;
          // Validate the whole snapshot before yielding any potentially torn batch.
          if (
            entries.length !== keys.length ||
            entries.some((entry, offset) =>
              !entry || !isRecord(entry.value) || entry.value.epoch !== head.epoch ||
              entry.value.sequence !== start + offset || !isEvent(entry.value.event)
            )
          ) {
            throw gap(head);
          }
          for (const [offset, entry] of entries.entries()) {
            signal.throwIfAborted();
            pump.check();
            cursor.sequence = start + offset;
            yield {
              type: 'event',
              id: id({ epoch: head.epoch, sequence: cursor.sequence }),
              event: structuredClone(entry!.value.event),
            };
          }
        }
        await wait(wake, signal);
      }
    } catch (error) {
      signal.throwIfAborted();
      throw asFeedError(error);
    } finally {
      controller.abort();
      await pump?.done;
    }
  }

  /** Read and validate the fixed journal head. */
  private async readHead(signal: AbortSignal): Promise<Head | null> {
    const entry = await wait(this.kv.get(HEAD_KEY), signal);
    return entry ? parseHead(entry.value) : null;
  }

  /** Reject unsupported custom stores instead of using a racy fallback. */
  private assertCapabilities(): void {
    if (!this.kv.atomic || !this.kv.supportsWatch || typeof this.kv.watch !== 'function') {
      throw unavailable('Saga event feed requires atomic and fixed-key watch support.');
    }
  }
}

function slotKey(sequence: number): KvKey {
  return ['saga', 'event-feed', 'v1', 'slot', (sequence - 1) % SAGA_EVENT_HISTORY_LIMIT];
}

function id(cursor: { epoch: string; sequence: number }): string {
  return `${cursor.epoch}:${cursor.sequence}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isEvent(value: unknown): value is SagaSSEEvent {
  return isRecord(value) && typeof value.type === 'string' && EVENT_TYPES.has(value.type) &&
    typeof value.timestamp === 'string' &&
    ['sagaName', 'sagaId', 'instanceId', 'correlationId', 'correlationKey'].every((key) =>
      value[key] === undefined || typeof value[key] === 'string'
    ) && (value.data === undefined || isRecord(value.data));
}

function parseHead(value: unknown): Head {
  if (
    !isRecord(value) || value.format !== 1 || typeof value.epoch !== 'string' ||
    !EPOCH.test(value.epoch) || typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) || value.sequence < 1
  ) throw unavailable('Saga event journal head is corrupt.');
  return { format: 1, epoch: value.epoch, sequence: value.sequence };
}

function parseCursor(value: string): Cursor {
  if (value.length > 100) {
    throw new SagaEventFeedError('Invalid saga event cursor.', { reason: 'invalid-cursor' });
  }
  const [epoch, decimal, extra] = value.split(':');
  const sequence = Number(decimal);
  if (
    value.length > 100 || extra !== undefined || !EPOCH.test(epoch) ||
    !/^(0|[1-9][0-9]*)$/.test(decimal ?? '') || !Number.isSafeInteger(sequence)
  ) throw new SagaEventFeedError('Invalid saga event cursor.', { reason: 'invalid-cursor' });
  return { epoch, sequence };
}

function validateCursor(cursor: Cursor, head: Head | null): void {
  if (!cursor.epoch) return;
  if (!head || head.epoch !== cursor.epoch) throw gap(head);
  if (cursor.sequence > head.sequence) {
    throw new SagaEventFeedError('Saga event cursor is ahead of the journal.', {
      reason: 'invalid-cursor',
    });
  }
  if (cursor.sequence < Math.max(0, head.sequence - SAGA_EVENT_HISTORY_LIMIT)) throw gap(head);
}

function gap(head: Head | null): SagaEventFeedError {
  return new SagaEventFeedError(
    'Saga event history is no longer available; refresh the snapshot.',
    {
      reason: 'history-lost',
      oldestId: head ? id({ ...head, sequence: Math.max(1, head.sequence - 255) }) : undefined,
      latestId: head ? id(head) : undefined,
    },
  );
}

function unavailable(message: string, cause?: unknown): SagaEventFeedError {
  return new SagaEventFeedError(message, { reason: 'unavailable', cause });
}

function asFeedError(error: unknown): SagaEventFeedError {
  return error instanceof SagaEventFeedError ? error : unavailable('Saga event KV failed.', error);
}

function wait<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  return signal ? abortable(promise, signal) : promise;
}

/** Drain notifications continuously, keeping one wake token and a terminal state. */
function watchHead(kv: WatchableKv, signal: AbortSignal) {
  let state: 'starting' | 'watching' | 'failed' | 'closed' = 'starting';
  let failure: unknown;
  let wake = Promise.withResolvers<void>();
  const first = Promise.withResolvers<void>();
  void first.promise.catch(() => {});
  const watch = kv.watch([HEAD_KEY], { initial: true, signal });
  const notify = (): void => {
    wake.resolve();
    wake = Promise.withResolvers<void>();
  };
  const done = (async () => {
    try {
      for await (const _batch of watch) {
        state = 'watching';
        first.resolve();
        notify();
      }
      if (!signal.aborted) throw unavailable('Saga event head watch ended unexpectedly.');
      state = 'closed';
    } catch (error) {
      if (signal.aborted) state = 'closed';
      else {
        state = 'failed';
        failure = error;
      }
    } finally {
      first.reject(failure ?? signal.reason ?? unavailable('Saga event watch ended before ready.'));
      notify();
    }
  })();
  return {
    ready: watch.ready ?? first.promise,
    token: () => wake.promise,
    check: (): void => {
      if (state === 'failed') throw asFeedError(failure);
    },
    done,
  };
}
