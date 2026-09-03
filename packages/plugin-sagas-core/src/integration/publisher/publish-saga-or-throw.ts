import { type SagaMessage, SagasError } from '../../domain/mod.ts';
import type {
  SagaPublisherPort,
  SagaPublisherPublishOptions,
  SagaPublisherReceipt,
} from './saga-publisher-port.ts';

/**
 * Publish one saga message and throw when the publisher rejects it.
 *
 * @param publisher Non-throwing publisher port to invoke.
 * @param message Saga message to publish.
 * @param options Optional routing and correlation metadata.
 * @returns The accepted publisher receipt with its exact message type.
 * @throws {SagasError} When the publisher returns a rejected receipt.
 *
 * @example
 * ```ts
 * import type { SagaMessage, SagaPublisherPort } from '@netscript/plugin-sagas/runtime';
 *
 * declare const publisher: SagaPublisherPort<SagaMessage>;
 * declare const message: SagaMessage;
 *
 * const receipt = await publishSagaOrThrow(publisher, message);
 * console.log(receipt.acceptedAt);
 * ```
 */
export async function publishSagaOrThrow<
  TMessage extends SagaMessage,
  TNextMessage extends TMessage,
>(
  publisher: SagaPublisherPort<TMessage>,
  message: TNextMessage,
  options?: SagaPublisherPublishOptions,
): Promise<SagaPublisherReceipt<TNextMessage['type']>> {
  const result = await publisher.publish(message, options);
  if (result.published) return result;

  const diagnostic =
    `Saga publisher "${publisher.id}" rejected message "${result.messageType}": ${result.reason}`;
  throw result.retryable
    ? SagasError.retryable(diagnostic, result)
    : SagasError.nonRetryable(diagnostic, result);
}
