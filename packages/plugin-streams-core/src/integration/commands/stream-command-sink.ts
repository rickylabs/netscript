import { type CommandOutboxSink, CommandRelayError } from '@netscript/service/commands/relay';
import { getParentContextFromHeaders } from '@netscript/telemetry';
import { withContextAsync } from '@netscript/telemetry/context';
import type { StreamProducerPort } from '../../ports/stream-producer-port.ts';
/** Existing producer and registry identity. */
export type StreamCommandSinkOptions = Readonly<{
  /** Relay registry identity. */ id: string;
  /** Consumer-owned producer; this sink never stops it. */ producer: StreamProducerPort;
}>;
/** Record envelope validation before selecting the existing producer operation. */
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Compose a thin sink awaiting the producer's actual delivered completion.
 * Payload is {operation:'upsert',value:record} or {operation:'delete',key:string};
 * topic names the producer collection. Local FIFO acceptance is insufficient.
 * Existing producer retries/duplicate acknowledgements retain its own tuple.
 * Relay redelivery is a new producer operation with the same message identity,
 * so downstream processing must independently be idempotent. Cancellation is
 * cooperative around awaited completion; consumer retains producer ownership.
 * @example
 * ```ts
 * import { createStreamCommandOutboxSink, type StreamCommandSinkOptions } from '@netscript/plugin-streams-core/integration/commands';
 * declare const options: StreamCommandSinkOptions;
 * const sink = createStreamCommandOutboxSink(options);
 * ```
 */
export function createStreamCommandOutboxSink(
  options: StreamCommandSinkOptions,
): CommandOutboxSink {
  if (
    typeof options.id !== 'string' || !options.id.trim() || !options.id.isWellFormed() ||
    new TextEncoder().encode(options.id).length > 256 ||
    typeof options.producer?.upsert !== 'function' || typeof options.producer?.delete !== 'function'
  ) throw new TypeError('[netscript.command.stream] invalid composition');
  const upsert = options.producer.upsert.bind(options.producer),
    remove = options.producer.delete.bind(options.producer);
  return Object.freeze<CommandOutboxSink>({
    id: options.id,
    async publish(message, signal) {
      signal?.throwIfAborted();
      const payload = message.payload;
      if (!record(payload)) throw new CommandRelayError('misconfigured');
      const context = { messageId: message.id, correlationId: message.correlationId };
      const publish = () => {
        if (
          payload.operation === 'upsert' && record(payload.value) &&
          Object.keys(payload).every((key) => key === 'operation' || key === 'value')
        ) return upsert(message.topic, payload.value, context);
        if (
          payload.operation === 'delete' && typeof payload.key === 'string' &&
          payload.key.length > 0 && Object.keys(payload).every((key) =>
            key === 'operation' || key === 'key'
          )
        ) return remove(message.topic, payload.key, context);
        throw new CommandRelayError('misconfigured');
      };
      const receipt = message.trace
        ? await withContextAsync(
          getParentContextFromHeaders({ ...message.trace }),
          () => Promise.resolve(publish()),
        )
        : publish();
      if (
        !receipt || typeof receipt.accepted !== 'boolean' || !Number.isSafeInteger(receipt.id) ||
        receipt.id < 1 || !(receipt.completion instanceof Promise)
      ) throw new CommandRelayError('invalid_response');
      const outcome = await receipt.completion;
      signal?.throwIfAborted();
      if (!receipt.accepted) throw new CommandRelayError('rejected');
      if (!outcome || typeof outcome !== 'object') throw new CommandRelayError('invalid_response');
      if (
        outcome.status === 'delivered' && Number.isSafeInteger(outcome.attempts) &&
        outcome.attempts > 0
      ) return;
      if (outcome.status === 'rejected') throw new CommandRelayError('rejected');
      if (
        outcome.status === 'delivery-unknown' || outcome.status === 'cancelled'
      ) throw new CommandRelayError('unavailable');
      throw new CommandRelayError('invalid_response');
    },
  });
}
