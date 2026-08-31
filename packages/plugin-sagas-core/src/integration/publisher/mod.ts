/**
 * Publisher port contracts for submitting saga messages from plugin surfaces.
 *
 * @module
 */

export type { SagaCorrelationKey, SagaMessage, SagaMessageId } from '../../domain/mod.ts';
export type {
  SagaPublisherBatchMode,
  SagaPublisherPort,
  SagaPublisherPublishManyOptions,
  SagaPublisherPublishOptions,
  SagaPublisherReceipt,
  SagaPublisherRejected,
  SagaPublisherResult,
} from './saga-publisher-port.ts';
export { publishSagaOrThrow } from './publish-saga-or-throw.ts';
