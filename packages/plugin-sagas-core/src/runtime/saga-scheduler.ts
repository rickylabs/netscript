import type { CascadedMessage, SagaMessage, SagaMessageId } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type { SagaClockPort } from '../ports/mod.ts';
import { type LoggerPort, NoopLogger } from './logger.ts';

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
}>;

/** Store boundary for Redis sorted-set, KV TTL, or database scheduler backends. */
export interface SagaSchedulerStorePort {
  /** Persist a scheduled message record. */
  save(record: SagaScheduledMessageRecord): Promise<void>;
  /** Claim due scheduled messages for dispatch. */
  claimDue(now: Date, limit: number): Promise<readonly SagaScheduledMessageRecord[]>;
  /** Mark a scheduled message as dispatched. */
  markDispatched(id: SagaMessageId, dispatchedAt: Date): Promise<void>;
  /** Mark a scheduled message as failed. */
  markFailed(id: SagaMessageId, failedAt: Date, error: string): Promise<void>;
}

/** Dispatch function used by the scheduler when a record becomes due. */
export type SagaScheduledMessageDispatcher = (
  message: SagaMessage | CascadedMessage,
) => Promise<void>;

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
  failures: readonly SagaSchedulerDrainFailure[];
}>;

/** Durable timer scheduler for `schedule()` cascaded messages. */
export class SagaScheduler {
  /** Stable scheduler identifier. */
  readonly id: string;
  readonly #clock: SagaClockPort;
  readonly #store: SagaSchedulerStorePort;
  readonly #dispatch: SagaScheduledMessageDispatcher;
  readonly #logger: LoggerPort;
  readonly #batchSize: number;
  #running = false;

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
    this.#running = true;
    return Promise.resolve();
  }

  /** Stop the scheduler drain loop boundary. */
  stop(): Promise<void> {
    this.#running = false;
    return Promise.resolve();
  }

  /** Persist a message for future dispatch. */
  async schedule(
    message: SagaMessage | CascadedMessage,
    scheduledFor: Date,
  ): Promise<SagaScheduledMessageRecord> {
    if (Number.isNaN(scheduledFor.getTime())) {
      throw SagasError.validationFailed('Scheduled message date must be valid.');
    }

    const now = this.#clock.now();
    const record = Object.freeze({
      id: createScheduleId(message, scheduledFor, now),
      message,
      scheduledFor,
      status: 'pending',
      attempts: 0,
      createdAt: now,
    }) satisfies SagaScheduledMessageRecord;

    await this.#store.save(record);
    return record;
  }

  /** Persist a scheduled cascade message for future dispatch. */
  async scheduleCascaded(
    message: CascadedMessage<'scheduled'>,
  ): Promise<SagaScheduledMessageRecord> {
    return await this.schedule(message.message, message.scheduledFor);
  }

  /** Claim and dispatch due scheduled messages once. */
  async drainDue(): Promise<SagaSchedulerDrainResult> {
    if (!this.#running) {
      throw SagasError.validationFailed(
        'SagaScheduler must be started before draining due messages.',
      );
    }

    const due = await this.#store.claimDue(this.#clock.now(), this.#batchSize);
    const outcomes = await Promise.all(due.map((record) => this.#dispatchRecord(record)));
    const failures = outcomes.filter((outcome): outcome is SagaSchedulerDrainFailure =>
      outcome !== 'dispatched'
    );

    return Object.freeze({
      claimed: due.length,
      dispatched: outcomes.length - failures.length,
      failed: failures.length,
      failures,
    });
  }

  async #dispatchRecord(
    record: SagaScheduledMessageRecord,
  ): Promise<'dispatched' | SagaSchedulerDrainFailure> {
    try {
      await this.#dispatch(record.message);
      await this.#store.markDispatched(record.id, this.#clock.now());
      return 'dispatched';
    } catch (error) {
      const dispatchError = errorMessage(error);
      this.#logger.error('Saga scheduler dispatch failed.', {
        scheduledMessageId: record.id,
        error: dispatchError,
      });

      try {
        await this.#store.markFailed(record.id, this.#clock.now(), dispatchError);
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

function createScheduleId(
  message: SagaMessage | CascadedMessage,
  scheduledFor: Date,
  createdAt: Date,
): SagaMessageId {
  const discriminator = 'type' in message ? message.type : message.kind;
  return `${discriminator}:${scheduledFor.toISOString()}:${createdAt.getTime()}` as SagaMessageId;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
