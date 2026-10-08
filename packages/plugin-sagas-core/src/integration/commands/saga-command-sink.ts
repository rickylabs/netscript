import { type CommandOutboxSink, CommandRelayError } from '@netscript/service/commands/relay';
import {
  type SagaCorrelationKey,
  type SagaMessage,
  type SagaMessageId,
  SagasError,
} from '../../domain/mod.ts';
import { publishSagaOrThrow } from '../publisher/publish-saga-or-throw.ts';
import type { SagaPublisherPort } from '../publisher/saga-publisher-port.ts';
/** Checked existing publisher supplied at the composition root. */
export type SagaCommandSinkOptions = Readonly<{
  /** Relay registry identity. */ id: string;
  /** Existing documented saga acceptance boundary. */ publisher: SagaPublisherPort;
}>;
/** Validate a bounded protocol identity at its owning boundary. */
function identity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.isWellFormed() &&
    new TextEncoder().encode(value).length <= 256;
}
/** Refine the validated raw outbox identity into its saga message role. */
function messageIdentity(value: unknown): value is SagaMessageId {
  return identity(value);
}
/** Refine the validated correlation into its saga routing role. */
function correlationIdentity(value: unknown): value is SagaCorrelationKey {
  return identity(value);
}
/**
 * Compose a thin sink over publishSagaOrThrow and the existing publisher port.
 * Stable outbox identity is the saga message and idempotency key. A checked receipt
 * must match the message type and contain valid acceptance time. No queue starts.
 * Cancellation is cooperative before/after the awaited publisher; this existing
 * port has no signal parameter. The supplied publisher owns transport timeouts.
 * @example
 * ```ts
 * import { createSagaCommandOutboxSink, type SagaCommandSinkOptions } from '@netscript/plugin-sagas-core/integration/commands';
 * declare const options: SagaCommandSinkOptions;
 * const sink = createSagaCommandOutboxSink(options);
 * ```
 */
export function createSagaCommandOutboxSink(options: SagaCommandSinkOptions): CommandOutboxSink {
  if (!identity(options.id) || typeof options.publisher?.publish !== 'function') {
    throw new TypeError('[netscript.command.saga] invalid composition');
  }
  const publisher = options.publisher;
  return Object.freeze<CommandOutboxSink>({
    id: options.id,
    async publish(delivery, signal) {
      signal?.throwIfAborted();
      if (
        !messageIdentity(delivery.id) || !correlationIdentity(delivery.correlationId)
      ) throw new CommandRelayError('misconfigured');
      const trace = delivery.trace === undefined ? {} : {
        traceparent: delivery.trace.traceparent,
        ...(delivery.trace.tracestate === undefined
          ? {}
          : { tracestate: delivery.trace.tracestate }),
      };
      const message: SagaMessage = {
        id: delivery.id,
        type: delivery.topic,
        payload: delivery.payload,
        correlationKey: delivery.correlationId,
        idempotencyKey: delivery.id,
        ...trace,
      };
      let receipt;
      try {
        receipt = await publishSagaOrThrow(publisher, message, {
          topic: delivery.topic,
          correlationKey: delivery.correlationId,
          idempotencyKey: delivery.id,
          ...trace,
        });
      } catch (error) {
        if (error instanceof SagasError) {
          throw new CommandRelayError(error.retryable ? 'unavailable' : 'rejected');
        }
        throw error;
      }
      signal?.throwIfAborted();
      try {
        if (
          receipt.published !== true || receipt.messageType !== delivery.topic ||
          !(receipt.acceptedAt instanceof Date) || !Number.isFinite(receipt.acceptedAt.getTime()) ||
          (receipt.messageId !== undefined && receipt.messageId !== delivery.id)
        ) throw new CommandRelayError('invalid_response');
        return Object.freeze({
          identity: receipt.messageId ?? delivery.id,
          acceptedAt: new Date(receipt.acceptedAt.getTime()),
        });
      } catch {
        throw new CommandRelayError('invalid_response');
      }
    },
  });
}
