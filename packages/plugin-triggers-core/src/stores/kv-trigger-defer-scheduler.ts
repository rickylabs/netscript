import type { KvKey, KvStore } from '@netscript/kv';
import type { TriggerClockPort } from '../ports/trigger-clock-port.ts';
import type {
  TriggerDeferRecord,
  TriggerDeferReplayResult,
  TriggerDeferRunOptions,
  TriggerDeferScheduleInput,
  TriggerDeferSchedulerPort,
} from '../ports/trigger-defer-scheduler-port.ts';

const DEFAULT_DEFER_POLL_INTERVAL_MS = 1_000;
const DEFAULT_TRIGGER_DEFER_PREFIX = ['triggers', 'deferred'] as const satisfies KvKey;

/** Options for the KV-backed one-shot trigger defer scheduler. */
export type KvTriggerDeferSchedulerOptions = Readonly<{
  kv: KvStore;
  prefix?: KvKey;
  clock?: TriggerClockPort;
}>;

/** Persist and replay one-shot deferred trigger events over a KV adapter. */
export class KvTriggerDeferScheduler implements TriggerDeferSchedulerPort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #clock: TriggerClockPort;

  /** Create a durable defer scheduler over the supplied KV adapter. */
  constructor(options: KvTriggerDeferSchedulerOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_TRIGGER_DEFER_PREFIX;
    this.#clock = options.clock ?? new SystemTriggerClock();
  }

  /** Persist one event until its requested replay time. */
  async schedule(input: TriggerDeferScheduleInput): Promise<TriggerDeferRecord> {
    const until = requireTimestamp(input.action.until);
    const record: TriggerDeferRecord = Object.freeze({
      id: await deferRecordId(input.event.id, until),
      triggerId: input.event.triggerId,
      event: input.event,
      until,
      createdAt: this.#clock.now().toISOString(),
    });
    await this.#kv.set(this.#recordKey(record.id), record);
    return record;
  }

  /** Cancel one pending replay. */
  async cancel(id: string): Promise<boolean> {
    const key = this.#recordKey(id);
    const exists = await this.#kv.has(key);
    if (exists) await this.#kv.delete(key);
    return exists;
  }

  /** List pending records in deterministic due-time order. */
  async list(): Promise<readonly TriggerDeferRecord[]> {
    const records: TriggerDeferRecord[] = [];
    for await (const entry of this.#kv.list<TriggerDeferRecord>({ prefix: this.#prefix })) {
      records.push(entry.value);
    }
    records.sort((left, right) =>
      Date.parse(left.until) - Date.parse(right.until) || left.id.localeCompare(right.id)
    );
    return Object.freeze(records);
  }

  /** Replay due records, deleting only successful deliveries. */
  async replayDue(
    replay: (record: TriggerDeferRecord) => Promise<void>,
  ): Promise<readonly TriggerDeferReplayResult[]> {
    const now = this.#clock.now().getTime();
    const results: TriggerDeferReplayResult[] = [];
    for (const record of await this.list()) {
      if (Date.parse(record.until) > now) break;
      try {
        await replay(record);
        await this.#kv.delete(this.#recordKey(record.id));
        results.push(Object.freeze({ record, status: 'replayed' }));
      } catch (error) {
        results.push(Object.freeze({ record, status: 'failed', error: errorMessage(error) }));
      }
    }
    return Object.freeze(results);
  }

  /** Poll the durable records and replay due work until aborted. */
  async run(
    replay: (record: TriggerDeferRecord) => Promise<void>,
    options: TriggerDeferRunOptions = {},
  ): Promise<void> {
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_DEFER_POLL_INTERVAL_MS;
    while (!options.signal?.aborted) {
      await this.replayDue(replay);
      const next = (await this.list())[0];
      const untilNext = next === undefined
        ? pollIntervalMs
        : Math.max(0, Date.parse(next.until) - this.#clock.now().getTime());
      const sleepMs = Math.min(pollIntervalMs, untilNext || pollIntervalMs);
      try {
        await this.#clock.sleep(sleepMs, { signal: options.signal });
      } catch (error) {
        if (options.signal?.aborted) return;
        throw error;
      }
    }
  }

  #recordKey(id: string): KvKey {
    return [...this.#prefix, id];
  }
}

class SystemTriggerClock implements TriggerClockPort {
  now(): Date {
    return new Date();
  }

  sleep(ms: number, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (options.signal?.aborted) {
        reject(options.signal.reason);
        return;
      }
      const timeout = setTimeout(resolve, ms);
      options.signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(options.signal?.reason);
      }, { once: true });
    });
  }
}

function requireTimestamp(value: string): string {
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) {
    throw new TypeError(`Invalid deferred trigger timestamp: ${value}`);
  }
  return timestamp.toISOString();
}

async function deferRecordId(eventId: string, until: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${eventId}\0${until}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
