import {
  DEFAULT_TRIGGER_BACKOFF_MULTIPLIER,
  DEFAULT_TRIGGER_CIRCUIT_BREAKER_COOLDOWN_MS,
  DEFAULT_TRIGGER_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  DEFAULT_TRIGGER_CIRCUIT_BREAKER_PROBE_INTERVAL_MS,
  DEFAULT_TRIGGER_CONCURRENCY_LIMIT,
  DEFAULT_TRIGGER_IDEMPOTENCY_TTL_MS,
  DEFAULT_TRIGGER_INITIAL_DELAY_MS,
  DEFAULT_TRIGGER_MAX_ATTEMPTS,
  DEFAULT_TRIGGER_MAX_DELAY_MS,
  type TriggerActionResult,
  type TriggerContext,
  type TriggerDefinition,
  type TriggerEvent,
  TriggerKindNotImplementedError,
  type TriggerKnownKind,
  type TriggerRetryPolicy,
  TriggersError,
} from '../domain/mod.ts';
import type {
  ProcessableTriggerDefinition,
  TriggerDlqPort,
  TriggerIdempotencyPort,
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
} from '../ports/mod.ts';
import { type LoggerPort, NoopLogger } from './logger.ts';

type RunnableTriggerDefinition = TriggerDefinition<string, TriggerEvent, TriggerContext>;

/** Dispatches actions emitted by trigger handlers. */
export type TriggerActionDispatcher = (
  action: TriggerActionResult,
  event: TriggerEvent,
  definition: ProcessableTriggerDefinition,
) => Promise<void>;

/** Options accepted by the trigger processor runtime. */
export type TriggerProcessorOptions = Readonly<{
  idempotency: TriggerIdempotencyPort;
  dlq: TriggerDlqPort;
  dispatchAction?: TriggerActionDispatcher;
  logger?: LoggerPort;
  now?: () => Date;
  random?: () => number;
}>;

type CircuitBreakerState = Readonly<{
  failures: number;
  openedAt?: number;
}>;

type ConcurrencySlot = Readonly<{
  active: number;
  limit: number;
}>;

const RESERVED_KINDS = new Set<TriggerKnownKind>(['queue', 'stream', 'manual']);

/** T1 trigger processor with idempotency, retry, concurrency, DLQ, and circuit breaker handling. */
export class TriggerProcessor implements TriggerProcessorPort {
  readonly #idempotency: TriggerIdempotencyPort;
  readonly #dlq: TriggerDlqPort;
  readonly #dispatchAction: TriggerActionDispatcher;
  readonly #logger: LoggerPort;
  readonly #now: () => Date;
  readonly #random: () => number;
  readonly #inFlight = new Set<Promise<unknown>>();
  readonly #concurrency = new Map<string, ConcurrencySlot>();
  readonly #circuits = new Map<string, CircuitBreakerState>();
  #stopping = false;

  constructor(options: TriggerProcessorOptions) {
    this.#idempotency = options.idempotency;
    this.#dlq = options.dlq;
    this.#dispatchAction = options.dispatchAction ?? (() => Promise.resolve());
    this.#logger = options.logger ?? new NoopLogger();
    this.#now = options.now ?? (() => new Date());
    this.#random = options.random ?? Math.random;
  }

  /** Process a unified trigger event through the T1 pipeline. */
  async process<TDefinition extends ProcessableTriggerDefinition>(
    event: TriggerEvent,
    definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    if (this.#stopping) {
      throw TriggersError.retryable('Trigger processor is stopping.');
    }
    if (RESERVED_KINDS.has(definition.kind as TriggerKnownKind)) {
      throw new TriggerKindNotImplementedError(definition.kind);
    }

    const run = this.#track(
      this.#processTracked(event, definition as RunnableTriggerDefinition),
    );
    return await run;
  }

  /** Stop the processor after draining in-flight dispatches. */
  async stop(options: TriggerProcessorStopOptions = {}): Promise<void> {
    this.#stopping = true;
    const drain = Promise.allSettled([...this.#inFlight]);
    if (options.drainTimeoutMs === undefined) {
      await drain;
      return;
    }
    await Promise.race([drain, delay(options.drainTimeoutMs)]);
  }

  async #processTracked(
    event: TriggerEvent,
    definition: RunnableTriggerDefinition,
  ): Promise<TriggerProcessResult> {
    const claim = await this.#idempotency.resolveKey({
      event,
      requestHeaders: event.requestHeaders,
    });
    if (!claim.claimed) {
      this.#logger.info('trigger.event.deduplicated', {
        triggerId: event.triggerId,
        eventId: event.id,
        idempotencyKey: claim.key,
      });
      throw TriggersError.deduplicated(claim.key);
    }
    if (claim.source === 'payload-hash') {
      this.#logger.warn('trigger.idempotency.payload_hash_fallback', {
        triggerId: event.triggerId,
        eventId: event.id,
      });
    }

    try {
      const result = await this.#withConcurrency(
        event,
        definition,
        () => this.#processWithRetry(event, definition),
      );
      await this.#idempotency.markCompleted(claim.key, resolveDedupTtl(definition));
      return result;
    } catch (error) {
      await this.#idempotency.release(claim.key);
      throw error;
    }
  }

  async #processWithRetry(
    event: TriggerEvent,
    definition: RunnableTriggerDefinition,
  ): Promise<TriggerProcessResult> {
    const retry: TriggerRetryPolicy = definition.retry ?? defaultRetryPolicy();
    for (let attempt = 1; attempt <= retry.maxAttempts; attempt += 1) {
      try {
        this.#assertCircuitClosed(definition);
        const actions = await definition.handler(event, {
          triggerId: event.triggerId,
          now: this.#now,
        });
        for (const action of actions) {
          await this.#dispatchAction(action, event, definition);
        }
        this.#recordCircuitSuccess(definition);
        return Object.freeze({
          event,
          status: actions.some((action) => isDeferAction(action)) ? 'deferred' : 'completed',
          actionsDispatched: actions.length,
        });
      } catch (error) {
        this.#recordCircuitFailure(definition);
        const retryable = isRetryable(error, retry.nonRetryableErrors) &&
          attempt < retry.maxAttempts;
        if (!retryable) {
          await this.#dlq.enqueue({
            id: event.id,
            triggerId: event.triggerId,
            event,
            reason: errorMessage(error),
            failedAt: this.#now().toISOString(),
            attempts: attempt,
          });
          this.#logger.error('trigger.event.dlq', {
            triggerId: event.triggerId,
            eventId: event.id,
            attempts: attempt,
          });
          return Object.freeze({ event, status: 'dlq', actionsDispatched: 0 });
        }
        await delay(computeRetryDelayMs(attempt, retry, this.#random));
      }
    }

    return Object.freeze({ event, status: 'failed', actionsDispatched: 0 });
  }

  async #withConcurrency<TResult>(
    event: TriggerEvent,
    definition: RunnableTriggerDefinition,
    run: () => Promise<TResult>,
  ): Promise<TResult> {
    const spec = definition.concurrency;
    const limit = spec?.limit ?? DEFAULT_TRIGGER_CONCURRENCY_LIMIT;
    const key = `${definition.id}:${
      spec?.key?.(event) ?? event.metadata?.concurrencyKey ?? 'global'
    }`;
    const slot = this.#concurrency.get(key) ?? Object.freeze({ active: 0, limit });
    if (slot.active >= slot.limit) {
      throw TriggersError.retryable(`Trigger concurrency limit reached for key ${key}.`);
    }

    this.#concurrency.set(key, Object.freeze({ active: slot.active + 1, limit: slot.limit }));
    try {
      return await run();
    } finally {
      const current = this.#concurrency.get(key);
      if (!current || current.active <= 1) {
        this.#concurrency.delete(key);
      } else {
        this.#concurrency.set(
          key,
          Object.freeze({ active: current.active - 1, limit: current.limit }),
        );
      }
    }
  }

  #assertCircuitClosed(definition: RunnableTriggerDefinition): void {
    const spec = definition.circuitBreaker ?? defaultCircuitBreakerSpec();
    const state = this.#circuits.get(definition.id);
    if (!state?.openedAt) return;
    const elapsedMs = this.#now().getTime() - state.openedAt;
    if (elapsedMs < spec.cooldownMs) {
      throw TriggersError.retryable(`Trigger circuit breaker open for ${definition.id}.`);
    }
  }

  #recordCircuitSuccess(definition: RunnableTriggerDefinition): void {
    this.#circuits.delete(definition.id);
  }

  #recordCircuitFailure(definition: RunnableTriggerDefinition): void {
    const spec = definition.circuitBreaker ?? defaultCircuitBreakerSpec();
    const current: CircuitBreakerState = this.#circuits.get(definition.id) ??
      Object.freeze({ failures: 0 });
    const failures = current.failures + 1;
    this.#circuits.set(
      definition.id,
      Object.freeze({
        failures,
        openedAt: failures >= spec.failureThreshold ? this.#now().getTime() : current.openedAt,
      }),
    );
  }

  #track<TResult>(promise: Promise<TResult>): Promise<TResult> {
    this.#inFlight.add(promise);
    promise.then(
      () => this.#inFlight.delete(promise),
      () => this.#inFlight.delete(promise),
    );
    return promise;
  }
}

/** Create the default retry policy. */
export function defaultRetryPolicy(): TriggerRetryPolicy {
  return Object.freeze({
    maxAttempts: DEFAULT_TRIGGER_MAX_ATTEMPTS,
    initialDelayMs: DEFAULT_TRIGGER_INITIAL_DELAY_MS,
    maxDelayMs: DEFAULT_TRIGGER_MAX_DELAY_MS,
    backoffMultiplier: DEFAULT_TRIGGER_BACKOFF_MULTIPLIER,
    jitter: true,
  });
}

function defaultCircuitBreakerSpec(): Required<NonNullable<TriggerDefinition['circuitBreaker']>> {
  return Object.freeze({
    failureThreshold: DEFAULT_TRIGGER_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
    cooldownMs: DEFAULT_TRIGGER_CIRCUIT_BREAKER_COOLDOWN_MS,
    probeIntervalMs: DEFAULT_TRIGGER_CIRCUIT_BREAKER_PROBE_INTERVAL_MS,
  });
}

function resolveDedupTtl(definition: RunnableTriggerDefinition): number {
  return definition.deduplication?.ttlMs ?? DEFAULT_TRIGGER_IDEMPOTENCY_TTL_MS;
}

function isRetryable(error: unknown, nonRetryableErrors: readonly string[] = []): boolean {
  if (error instanceof TriggersError) {
    return error.retryable && !nonRetryableErrors.includes(error.code);
  }
  if (error instanceof Error) {
    return !nonRetryableErrors.includes(error.name);
  }
  return true;
}

function computeRetryDelayMs(
  attempt: number,
  retry: NonNullable<TriggerDefinition['retry']>,
  random: () => number,
): number {
  const exponential = retry.initialDelayMs * retry.backoffMultiplier ** Math.max(0, attempt - 1);
  const capped = Math.min(exponential, retry.maxDelayMs);
  return retry.jitter ? Math.floor(capped * random()) : capped;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDeferAction(action: TriggerActionResult): boolean {
  return typeof action === 'object' && action !== null && 'kind' in action &&
    action.kind === 'defer';
}
