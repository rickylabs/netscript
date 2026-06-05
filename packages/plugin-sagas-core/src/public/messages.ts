import type {
  CascadedMessage,
  CascadedMessageOptions,
  CascadedMessageTarget,
  SagaDefinition,
  SagaId,
  SagaMessage,
} from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';

/** Delay accepted by the `schedule()` cascaded-message constructor. */
export type SagaScheduleDelay = Date | number | `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`;

/** Options accepted by `send()`. */
export type SendOptions = CascadedMessageOptions;

/** Options accepted by `spawn()`. */
export type SpawnOptions = Pick<CascadedMessageOptions, 'idempotencyKey' | 'concurrencyKey'>;

/** Create a cascaded send message. */
export function send(
  target: CascadedMessageTarget | string,
  payload: unknown,
  options: SendOptions = {},
): CascadedMessage<'send'> {
  return Object.freeze({
    kind: 'send',
    target: normalizeTarget(target),
    payload,
    idempotencyKey: options.idempotencyKey,
    concurrencyKey: options.concurrencyKey,
    retry: options.retry,
    queue: options.queue,
  });
}

/** Create a cascaded scheduled message. */
export function schedule(
  message: SagaMessage | CascadedMessage,
  delay: SagaScheduleDelay,
): CascadedMessage<'scheduled'> {
  return Object.freeze({
    kind: 'scheduled',
    message,
    scheduledFor: resolveScheduledFor(delay),
  });
}

/** Create a cascaded child-saga spawn message. */
export function spawn(
  child: SagaDefinition | SagaId | string,
  input: unknown,
  options: SpawnOptions = {},
): CascadedMessage<'spawn'> {
  return Object.freeze({
    kind: 'spawn',
    sagaId: normalizeSagaId(child),
    input,
    idempotencyKey: options.idempotencyKey,
    concurrencyKey: options.concurrencyKey,
  });
}

/** Create a terminal saga completion message. */
export function sagaComplete(result?: unknown): CascadedMessage<'complete'> {
  return Object.freeze({
    kind: 'complete',
    result,
  });
}

/** Create a terminal saga failure message. */
export function sagaFail(reason: string | Error): CascadedMessage<'fail'> {
  return Object.freeze({
    kind: 'fail',
    reason: typeof reason === 'string' ? reason : reason.message,
  });
}

/** Create a cascaded compensation message. */
export function sagaCompensate(
  message: SagaMessage | CascadedMessage,
  reason?: string,
): CascadedMessage<'compensate'> {
  return Object.freeze({
    kind: 'compensate',
    message,
    reason,
  });
}

function normalizeTarget(target: CascadedMessageTarget | string): CascadedMessageTarget {
  if (typeof target !== 'string') return target;
  assertNonEmpty(target, 'Cascaded message target must not be empty.');
  return Object.freeze({ kind: 'message', id: target });
}

function normalizeSagaId(child: SagaDefinition | SagaId | string): SagaId {
  if (typeof child === 'object' && 'id' in child) return child.id;
  assertNonEmpty(child, 'Child saga id must not be empty.');
  return child.trim() as SagaId;
}

function resolveScheduledFor(delay: SagaScheduleDelay): Date {
  if (delay instanceof Date) return delay;
  if (typeof delay === 'number') {
    if (!Number.isFinite(delay) || delay < 0) {
      throw SagasError.validationFailed('Schedule delay must be a non-negative finite number.');
    }
    return new Date(Date.now() + delay);
  }

  const match = /^(\d+)(ms|s|m|h|d)$/.exec(delay);
  if (!match) {
    throw SagasError.validationFailed(
      'Schedule delay must use an ms, s, m, h, or d suffix.',
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 'ms'
    ? 1
    : unit === 's'
    ? 1000
    : unit === 'm'
    ? 60 * 1000
    : unit === 'h'
    ? 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;
  return new Date(Date.now() + amount * multiplier);
}

function assertNonEmpty(value: string, message: string): void {
  if (value.trim().length === 0) {
    throw SagasError.validationFailed(message);
  }
}
