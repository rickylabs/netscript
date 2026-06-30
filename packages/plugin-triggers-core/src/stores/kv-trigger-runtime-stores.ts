import { getKv } from '@netscript/kv';
import type { AtomicMutation, KvKey, KvStore } from '@netscript/kv';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
} from '@netscript/plugin-triggers-core/domain';
import type {
  TriggerDlqEntry,
  TriggerDlqListOptions,
  TriggerDlqPort,
  TriggerEventListOptions,
  TriggerEventStorePort,
  TriggerIdempotencyClaim,
  TriggerIdempotencyKeyInput,
  TriggerIdempotencyPort,
} from '@netscript/plugin-triggers-core/ports';

const DEFAULT_ACTIVE_CLAIM_TTL_MS = 15 * 60 * 1000;
const DEFAULT_TRIGGER_KV_PREFIX = ['triggers'] as const satisfies KvKey;
const TRIGGER_KV_PATH_ENV = 'NETSCRIPT_TRIGGER_KV_PATH';

/** Shared options for KV-backed trigger runtime stores. */
export type TriggerRuntimeKvStoreOptions = Readonly<{
  kv: KvStore;
  prefix?: KvKey;
  now?: () => Date;
}>;

/** Open the shared KV adapter used by production trigger runtime stores. */
export function openTriggerRuntimeKv(): Promise<KvStore> {
  return getKv({ path: Deno.env.get(TRIGGER_KV_PATH_ENV) });
}

/** KV-backed trigger event store for ack-then-process ingress durability. */
export class KvTriggerEventStore implements TriggerEventStorePort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;

  /** Create an event store over the supplied KV adapter. */
  constructor(options: TriggerRuntimeKvStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_TRIGGER_KV_PREFIX;
    this.#now = options.now ?? (() => new Date());
  }

  /** Persist or replace a trigger event. */
  async save(event: TriggerEvent): Promise<void> {
    await requireAtomic(this.#kv)([], [
      { type: 'set', key: this.#eventKey(event.id), value: event },
      { type: 'set', key: this.#triggerEventKey(event.triggerId, event.id), value: event.id },
    ]);
  }

  /** Load a trigger event by id. */
  async load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    const entry = await this.#kv.get<TriggerEvent>(this.#eventKey(eventId));
    return entry?.value ?? undefined;
  }

  /** Update a trigger event status and optional metadata. */
  async updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const event = await this.load(eventId);
    if (event === undefined) {
      return;
    }
    await this.save({
      ...event,
      status,
      updatedAt: this.#now().toISOString(),
      metadata: metadata ?? event.metadata,
    });
  }

  /** List trigger events matching the supplied filter. */
  async list(options: TriggerEventListOptions = {}): Promise<readonly TriggerEvent[]> {
    const events: TriggerEvent[] = [];
    for await (const entry of this.#kv.list<TriggerEvent>({ prefix: this.#eventsPrefix() })) {
      if (matchesEvent(entry.value, options)) {
        events.push(entry.value);
      }
      if (options.limit !== undefined && events.length >= options.limit) {
        break;
      }
    }
    return events;
  }

  #eventsPrefix(): KvKey {
    return [...this.#prefix, 'events'];
  }

  #eventKey(eventId: TriggerEventId): KvKey {
    return [...this.#eventsPrefix(), eventId];
  }

  #triggerEventKey(triggerId: string, eventId: TriggerEventId): KvKey {
    return [...this.#prefix, 'by-trigger', triggerId, eventId];
  }
}

/** KV-backed three-tier idempotency store for trigger processing. */
export class KvTriggerIdempotencyStore implements TriggerIdempotencyPort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;
  readonly #activeTtlMs: number;

  /** Create an idempotency store over the supplied KV adapter. */
  constructor(
    options: TriggerRuntimeKvStoreOptions & Readonly<{ activeTtlMs?: number }>,
  ) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_TRIGGER_KV_PREFIX;
    this.#now = options.now ?? (() => new Date());
    this.#activeTtlMs = options.activeTtlMs ?? DEFAULT_ACTIVE_CLAIM_TTL_MS;
  }

  /** Resolve and claim an idempotency key for a trigger event. */
  async resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    const resolved = await resolveKey(input);
    const activeKey = this.#activeKey(resolved.key);
    const completedKey = this.#completedKey(resolved.key);
    const result = await requireAtomic(this.#kv)(
      [
        { key: activeKey, versionstamp: null },
        { key: completedKey, versionstamp: null },
      ],
      [{
        type: 'set',
        key: activeKey,
        value: { claimedAt: this.#now().toISOString() },
        expireIn: this.#activeTtlMs,
      }],
    );
    return { ...resolved, claimed: result.ok };
  }

  /** Mark an idempotency key as completed for the supplied TTL. */
  async markCompleted(key: string, ttlMs: number): Promise<void> {
    const mutations: AtomicMutation[] = [{ type: 'delete', key: this.#activeKey(key) }];
    mutations.push(
      ttlMs > 0
        ? {
          type: 'set',
          key: this.#completedKey(key),
          value: { completedAt: this.#now().toISOString() },
          expireIn: ttlMs,
        }
        : { type: 'delete', key: this.#completedKey(key) },
    );
    await requireAtomic(this.#kv)([], mutations);
  }

  /** Release an active idempotency claim. */
  async release(key: string): Promise<void> {
    await this.#kv.delete(this.#activeKey(key));
  }

  #idempotencyPrefix(): KvKey {
    return [...this.#prefix, 'idempotency'];
  }

  #activeKey(key: string): KvKey {
    return [...this.#idempotencyPrefix(), 'active', key];
  }

  #completedKey(key: string): KvKey {
    return [...this.#idempotencyPrefix(), 'completed', key];
  }
}

/** KV-backed trigger DLQ for exhausted events. */
export class KvTriggerDlqStore implements TriggerDlqPort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;

  /** Create a DLQ store over the supplied KV adapter. */
  constructor(options: TriggerRuntimeKvStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_TRIGGER_KV_PREFIX;
  }

  /** Enqueue a failed trigger event into the DLQ. */
  async enqueue(entry: TriggerDlqEntry): Promise<void> {
    await requireAtomic(this.#kv)([], [
      { type: 'set', key: this.#entryKey(entry.id), value: entry },
      { type: 'set', key: this.#triggerEntryKey(entry.triggerId, entry.id), value: entry.id },
    ]);
  }

  /** List DLQ entries matching the supplied filter. */
  async list(options: TriggerDlqListOptions = {}): Promise<readonly TriggerDlqEntry[]> {
    const entries: TriggerDlqEntry[] = [];
    for await (const entry of this.#kv.list<TriggerDlqEntry>({ prefix: this.#entriesPrefix() })) {
      if (matchesDlqEntry(entry.value, options)) {
        entries.push(entry.value);
      }
    }
    return entries;
  }

  /** Remove a DLQ entry after replay has been accepted. */
  async replay(eventId: TriggerEventId): Promise<void> {
    const entry = await this.#kv.get<TriggerDlqEntry>(this.#entryKey(eventId));
    const mutations: AtomicMutation[] = [{ type: 'delete', key: this.#entryKey(eventId) }];
    if (entry?.value !== undefined) {
      mutations.push({
        type: 'delete',
        key: this.#triggerEntryKey(entry.value.triggerId, eventId),
      });
    }
    await requireAtomic(this.#kv)([], mutations);
  }

  #entriesPrefix(): KvKey {
    return [...this.#prefix, 'dlq', 'entries'];
  }

  #entryKey(eventId: TriggerEventId): KvKey {
    return [...this.#entriesPrefix(), eventId];
  }

  #triggerEntryKey(triggerId: string, eventId: TriggerEventId): KvKey {
    return [...this.#prefix, 'dlq', 'by-trigger', triggerId, eventId];
  }
}

function requireAtomic(kv: KvStore): NonNullable<KvStore['atomic']> {
  if (!kv.atomic) {
    throw new Error('Trigger KV runtime store requires atomic compare-and-swap support.');
  }
  return kv.atomic.bind(kv);
}

function matchesEvent(event: TriggerEvent, options: TriggerEventListOptions): boolean {
  return (options.triggerId === undefined || event.triggerId === options.triggerId) &&
    (options.status === undefined || event.status === options.status);
}

function matchesDlqEntry(entry: TriggerDlqEntry, options: TriggerDlqListOptions): boolean {
  return (options.triggerId === undefined || entry.triggerId === options.triggerId) &&
    (options.since === undefined || new Date(entry.failedAt).getTime() >= options.since.getTime());
}

async function resolveKey(input: TriggerIdempotencyKeyInput): Promise<
  Omit<TriggerIdempotencyClaim, 'claimed'>
> {
  if (input.event.idempotencyKey !== undefined) {
    return { key: input.event.idempotencyKey, source: 'caller' };
  }
  const headerKey = input.requestHeaders?.['x-idempotency-key'] ??
    input.requestHeaders?.['idempotency-key'];
  if (headerKey !== undefined && headerKey.length > 0) {
    return { key: headerKey, source: 'request-header' };
  }
  return { key: await payloadHash(input.event.payload), source: 'payload-hash' };
}

async function payloadHash(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}
