import type {
  CascadedMessage,
  SagaInstanceId,
  SagaMessage,
  SagaMessageId,
  SagaStateEnvelope,
} from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type { SagaClockPort, SagaStorePort } from '../ports/mod.ts';
import { type LoggerPort, NoopLogger } from './logger.ts';
import { sagaRetentionRemaining } from '../stores/saga-kv-retention.ts';

/** Lifecycle status for durable scheduled saga messages. */
export type SagaScheduledMessageStatus = 'pending' | 'claimed' | 'dispatched' | 'failed';

/** Durable scheduled message record stored by a scheduler backend. */
export type SagaScheduledMessageRecord = Readonly<{
  id: SagaMessageId;
  message: SagaMessage | CascadedMessage;
  scheduledFor: Date;
  status: SagaScheduledMessageStatus;
  attempts: number;
  createdAt: Date;
  claimedAt?: Date;
  dispatchedAt?: Date;
  failedAt?: Date;
  error?: string;
  /** Originating durable instance; cancellation never depends on the destination correlation. */
  instanceId?: SagaInstanceId;
  /** Absolute originating terminal deadline; replay never renews this window. */
  expiresAt?: Date;
}>;

/** Store boundary for Redis sorted-set, KV TTL, or database scheduler backends. */
export interface SagaSchedulerStorePort {
  /** Persist a scheduled message record. */
  save(record: SagaScheduledMessageRecord): Promise<void>;
  /** Claim due scheduled messages for dispatch. */
  claimDue(now: Date, limit: number): Promise<readonly SagaScheduledMessageRecord[]>;
  /** Mark a scheduled message as dispatched. */
  markDispatched(
    id: SagaMessageId,
    dispatchedAt: Date,
    claim?: SagaScheduledMessageRecord,
  ): Promise<void>;
  /** Mark a scheduled message as failed. */
  markFailed(
    id: SagaMessageId,
    failedAt: Date,
    error: string,
    claim?: SagaScheduledMessageRecord,
  ): Promise<void>;
  /** Compare and delete the supplied claim snapshot; missing or rewritten records return false. */
  cancel?(record: SagaScheduledMessageRecord): Promise<boolean>;
  /** Inspect a bounded page, assigning terminal deadlines or deleting expired scoped records. */
  cleanupRetention?(
    deadlines: (ids: readonly SagaInstanceId[]) => Promise<readonly (Date | undefined)[]>,
    now: Date,
  ): Promise<boolean>;
}

/** Dispatch function used by the scheduler when a record becomes due. */
export type SagaScheduledMessageDispatcher = (
  message: SagaMessage | CascadedMessage,
) => Promise<void>;

/** Lifecycle and scheduling boundary consumed by the saga bus bridge. */
export interface SagaSchedulerPort {
  /** Stable scheduler identifier used by diagnostics. */
  readonly id: string;
  /** Start accepting scheduled cascade messages. */
  start(): Promise<void>;
  /** Stop accepting scheduled cascade messages. */
  stop(): Promise<void>;
  /** Durably arrange delivery of a scheduled cascade. */
  scheduleCascaded(
    message: CascadedMessage<'scheduled'>,
    context?: Readonly<{ instanceId: SagaInstanceId }>,
  ): Promise<unknown>;
  /** Bind canonical state before startup so deadline cleanup can recover after a crash. */
  bindRetentionStore?(
    store: SagaStorePort,
    options?: Readonly<{
      completedRetentionDays?: number | ((envelope: SagaStateEnvelope) => number);
    }>,
  ): void;
  /** Cancel a bounded page of messages past their originating instance retention deadline. */
  cleanupRetention?(): Promise<boolean>;
}

/** Options for the durable saga scheduler. */
export type SagaSchedulerOptions = Readonly<{
  id?: string;
  clock: SagaClockPort;
  store: SagaSchedulerStorePort;
  dispatch: SagaScheduledMessageDispatcher;
  logger?: LoggerPort;
  batchSize?: number;
}>;

/** Failed scheduled dispatch details. */
export type SagaSchedulerDrainFailure = Readonly<{
  id: SagaMessageId;
  dispatchError: string;
  markFailedError?: string;
}>;

/** Result returned from one scheduler drain cycle. */
export type SagaSchedulerDrainResult = Readonly<{
  claimed: number;
  dispatched: number;
  failed: number;
  /** Expired origin records withheld from dispatch, present when nonzero. */
  cancelled?: number;
  failures: readonly SagaSchedulerDrainFailure[];
}>;

/** Durable timer scheduler for `schedule()` cascaded messages. */
export class SagaScheduler implements SagaSchedulerPort {
  /** Stable scheduler identifier. */
  readonly id: string;
  readonly #clock: SagaClockPort;
  readonly #store: SagaSchedulerStorePort;
  readonly #dispatch: SagaScheduledMessageDispatcher;
  readonly #logger: LoggerPort;
  readonly #batchSize: number;
  #running = false;
  #retentionStore?: SagaStorePort;
  #days: number | ((envelope: SagaStateEnvelope) => number) = 7;

  /** Create a durable saga scheduler. */
  constructor(options: SagaSchedulerOptions) {
    if (
      options.batchSize !== undefined &&
      (!Number.isInteger(options.batchSize) || options.batchSize < 1)
    ) {
      throw SagasError.validationFailed('Saga scheduler batchSize must be a positive integer.');
    }
    this.id = options.id ?? 'saga-scheduler';
    this.#clock = options.clock;
    this.#store = options.store;
    this.#dispatch = options.dispatch;
    this.#logger = options.logger ?? new NoopLogger();
    this.#batchSize = options.batchSize ?? 100;
  }

  /** Start the scheduler drain loop boundary. */
  start(): Promise<void> {
    if (this.#running) throw SagasError.validationFailed('Saga scheduler is already running.');
    if (this.#retentionStore && (!this.#store.cancel || !this.#store.cleanupRetention)) {
      throw SagasError.validationFailed(
        'Bound saga scheduler requires store retention capabilities.',
      );
    }
    this.#running = true;
    return Promise.resolve();
  }

  /** Stop the scheduler drain loop boundary. */
  stop(): Promise<void> {
    this.#running = false;
    return Promise.resolve();
  }

  /** Bind canonical origin state and its terminal policy before startup. */
  bindRetentionStore(
    store: SagaStorePort,
    options: Readonly<{
      completedRetentionDays?: number | ((envelope: SagaStateEnvelope) => number);
    }> = {},
  ): void {
    if (this.#running) throw SagasError.validationFailed('Bind saga retention before startup.');
    this.#retentionStore = store;
    this.#days = options.completedRetentionDays ?? 7;
  }

  /** Sweep one bounded store page; the service retention loop drives this without app reads. */
  async cleanupRetention(): Promise<boolean> {
    if (!this.#retentionStore || !this.#store.cleanupRetention) return false;
    return await this.#store.cleanupRetention((ids) => this.#deadlines(ids), this.#clock.now());
  }

  async #deadlines(ids: readonly SagaInstanceId[]): Promise<readonly (Date | undefined)[]> {
    const store = this.#retentionStore;
    if (!store) return ids.map(() => undefined);
    const envelopes = store.loadMany
      ? await store.loadMany(ids)
      : await Promise.all(ids.map((id) => store.load(id)));
    const now = this.#clock.now();
    return envelopes.map((envelope) => {
      if (!envelope) return now;
      const days = typeof this.#days === 'function' ? this.#days(envelope) : this.#days;
      const remaining = sagaRetentionRemaining(envelope, days, now);
      return remaining === undefined ? undefined : new Date(now.getTime() + remaining);
    });
  }

  /** Persist a message for future dispatch. */
  async schedule(
    message: SagaMessage | CascadedMessage,
    scheduledFor: Date,
    instanceId?: SagaInstanceId,
  ): Promise<SagaScheduledMessageRecord> {
    if (Number.isNaN(scheduledFor.getTime())) {
      throw SagasError.validationFailed('Scheduled message date must be valid.');
    }

    const now = this.#clock.now();
    const record = Object.freeze({
      id: await createScheduleId(message, scheduledFor, instanceId),
      message,
      scheduledFor,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      ...(instanceId === undefined ? {} : { instanceId }),
      ...(instanceId && this.#retentionStore
        ? { expiresAt: (await this.#deadlines([instanceId]))[0] }
        : {}),
    }) satisfies SagaScheduledMessageRecord;

    await this.#store.save(record);
    return record;
  }

  /** Persist a scheduled cascade message for future dispatch. */
  async scheduleCascaded(
    message: CascadedMessage<'scheduled'>,
    context?: Readonly<{ instanceId: SagaInstanceId }>,
  ): Promise<SagaScheduledMessageRecord> {
    return await this.schedule(
      {
        ...message.message,
        idempotencyKey: message.idempotencyKey ?? message.message.idempotencyKey,
      },
      message.scheduledFor,
      context?.instanceId,
    );
  }

  /** Claim and dispatch due scheduled messages once. */
  async drainDue(): Promise<SagaSchedulerDrainResult> {
    if (!this.#running) {
      throw SagasError.validationFailed(
        'SagaScheduler must be started before draining due messages.',
      );
    }

    const due = await this.#store.claimDue(this.#clock.now(), this.#batchSize);
    const ids = due.flatMap((record) => record.instanceId ? [record.instanceId] : []);
    const deadlines = await this.#deadlines(ids);
    let index = 0;
    const retained: SagaScheduledMessageRecord[] = [];
    for (const record of due) {
      const deadline = record.instanceId ? deadlines[index++] : undefined;
      if (deadline && deadline.getTime() <= this.#clock.now().getTime()) {
        await this.#store.cancel?.(record);
      } else retained.push(record);
    }
    const outcomes = await Promise.all(retained.map((record) => this.#dispatchRecord(record)));
    const failures = outcomes.filter((outcome): outcome is SagaSchedulerDrainFailure =>
      outcome !== 'dispatched'
    );

    return Object.freeze({
      claimed: due.length,
      dispatched: outcomes.length - failures.length,
      failed: failures.length,
      ...(due.length === retained.length ? {} : { cancelled: due.length - retained.length }),
      failures,
    });
  }

  async #dispatchRecord(
    record: SagaScheduledMessageRecord,
  ): Promise<'dispatched' | SagaSchedulerDrainFailure> {
    try {
      await this.#dispatch(record.message);
      await this.#store.markDispatched(record.id, this.#clock.now(), record);
      return 'dispatched';
    } catch (error) {
      const dispatchError = errorMessage(error);
      this.#logger.error('Saga scheduler dispatch failed.', {
        scheduledMessageId: record.id,
        error: dispatchError,
      });

      try {
        await this.#store.markFailed(record.id, this.#clock.now(), dispatchError, record);
        return Object.freeze({ id: record.id, dispatchError });
      } catch (markFailedError) {
        const markFailedMessage = errorMessage(markFailedError);
        this.#logger.error('Saga scheduler failed to mark scheduled message failed.', {
          scheduledMessageId: record.id,
          dispatchError,
          error: markFailedMessage,
        });
        return Object.freeze({
          id: record.id,
          dispatchError,
          markFailedError: markFailedMessage,
        });
      }
    }
  }
}

/** Create a durable saga scheduler. */
export function createSagaScheduler(options: SagaSchedulerOptions): SagaScheduler {
  return new SagaScheduler(options);
}

async function createScheduleId(
  message: SagaMessage | CascadedMessage,
  scheduledFor: Date,
  instanceId?: SagaInstanceId,
): Promise<SagaMessageId> {
  const discriminator = 'type' in message ? message.type : message.kind;
  const identity = JSON.stringify([
    instanceId,
    discriminator,
    scheduledFor.toISOString(),
    message.idempotencyKey ?? ('id' in message ? message.id : undefined) ?? crypto.randomUUID(),
  ]);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  ) as SagaMessageId;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
