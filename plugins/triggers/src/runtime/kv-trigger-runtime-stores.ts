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

export type TriggerRuntimeKvStoreOptions = Readonly<{
  kv: Deno.Kv;
  prefix?: readonly Deno.KvKeyPart[];
  now?: () => Date;
}>;

/** Open the Deno KV database used by production trigger runtime stores. */
export function openTriggerRuntimeKv(): Promise<Deno.Kv> {
  return Deno.openKv(Deno.env.get('NETSCRIPT_TRIGGER_KV_PATH'));
}

/** Deno KV-backed trigger event store for ack-then-process ingress durability. */
export class KvTriggerEventStore implements TriggerEventStorePort {
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];
  readonly #now: () => Date;

  constructor(options: TriggerRuntimeKvStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['triggers'];
    this.#now = options.now ?? (() => new Date());
  }

  async save(event: TriggerEvent): Promise<void> {
    await this.#kv.atomic()
      .set(this.#eventKey(event.id), event)
      .set(this.#triggerEventKey(event.triggerId, event.id), event.id)
      .commit();
  }

  async load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    const entry = await this.#kv.get<TriggerEvent>(this.#eventKey(eventId));
    return entry.value ?? undefined;
  }

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

  #eventsPrefix(): Deno.KvKey {
    return [...this.#prefix, 'events'];
  }

  #eventKey(eventId: TriggerEventId): Deno.KvKey {
    return [...this.#eventsPrefix(), eventId];
  }

  #triggerEventKey(triggerId: string, eventId: TriggerEventId): Deno.KvKey {
    return [...this.#prefix, 'by-trigger', triggerId, eventId];
  }
}

/** Deno KV-backed three-tier idempotency store for trigger processing. */
export class KvTriggerIdempotencyStore implements TriggerIdempotencyPort {
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];
  readonly #now: () => Date;
  readonly #activeTtlMs: number;

  constructor(
    options: TriggerRuntimeKvStoreOptions & Readonly<{ activeTtlMs?: number }>,
  ) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['triggers'];
    this.#now = options.now ?? (() => new Date());
    this.#activeTtlMs = options.activeTtlMs ?? DEFAULT_ACTIVE_CLAIM_TTL_MS;
  }

  async resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    const resolved = await resolveKey(input);
    const activeKey = this.#activeKey(resolved.key);
    const completedKey = this.#completedKey(resolved.key);
    const result = await this.#kv.atomic()
      .check({ key: activeKey, versionstamp: null })
      .check({ key: completedKey, versionstamp: null })
      .set(activeKey, { claimedAt: this.#now().toISOString() }, { expireIn: this.#activeTtlMs })
      .commit();
    return { ...resolved, claimed: result.ok };
  }

  async markCompleted(key: string, ttlMs: number): Promise<void> {
    const atomic = this.#kv.atomic()
      .delete(this.#activeKey(key));
    if (ttlMs > 0) {
      atomic.set(
        this.#completedKey(key),
        { completedAt: this.#now().toISOString() },
        { expireIn: ttlMs },
      );
    } else {
      atomic.delete(this.#completedKey(key));
    }
    await atomic.commit();
  }

  async release(key: string): Promise<void> {
    await this.#kv.delete(this.#activeKey(key));
  }

  #idempotencyPrefix(): Deno.KvKey {
    return [...this.#prefix, 'idempotency'];
  }

  #activeKey(key: string): Deno.KvKey {
    return [...this.#idempotencyPrefix(), 'active', key];
  }

  #completedKey(key: string): Deno.KvKey {
    return [...this.#idempotencyPrefix(), 'completed', key];
  }
}

/** Deno KV-backed trigger DLQ for exhausted events. */
export class KvTriggerDlqStore implements TriggerDlqPort {
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];

  constructor(options: TriggerRuntimeKvStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['triggers'];
  }

  async enqueue(entry: TriggerDlqEntry): Promise<void> {
    await this.#kv.atomic()
      .set(this.#entryKey(entry.id), entry)
      .set(this.#triggerEntryKey(entry.triggerId, entry.id), entry.id)
      .commit();
  }

  async list(options: TriggerDlqListOptions = {}): Promise<readonly TriggerDlqEntry[]> {
    const entries: TriggerDlqEntry[] = [];
    for await (const entry of this.#kv.list<TriggerDlqEntry>({ prefix: this.#entriesPrefix() })) {
      if (matchesDlqEntry(entry.value, options)) {
        entries.push(entry.value);
      }
    }
    return entries;
  }

  async replay(eventId: TriggerEventId): Promise<void> {
    const entry = await this.#kv.get<TriggerDlqEntry>(this.#entryKey(eventId));
    const atomic = this.#kv.atomic().delete(this.#entryKey(eventId));
    if (entry.value !== null) {
      atomic.delete(this.#triggerEntryKey(entry.value.triggerId, eventId));
    }
    await atomic.commit();
  }

  #entriesPrefix(): Deno.KvKey {
    return [...this.#prefix, 'dlq', 'entries'];
  }

  #entryKey(eventId: TriggerEventId): Deno.KvKey {
    return [...this.#entriesPrefix(), eventId];
  }

  #triggerEntryKey(triggerId: string, eventId: TriggerEventId): Deno.KvKey {
    return [...this.#prefix, 'dlq', 'by-trigger', triggerId, eventId];
  }
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
