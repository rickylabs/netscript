/**
 * Thin command relay integration over the existing checked saga publisher.
 * Publication happens only during relay drain after the originating local commit.
 * No queue, relay, scheduler or resource starts on import/construction.
 * @module
 */
export { createSagaCommandOutboxSink } from './src/integration/commands/saga-command-sink.ts';
export type { SagaCommandSinkOptions } from './src/integration/commands/saga-command-sink.ts';
export type { SagaCorrelationKey, SagaMessage, SagaMessageId } from './src/domain/mod.ts';
export type {
  SagaPublisherBatchMode,
  SagaPublisherPort,
  SagaPublisherPublishManyOptions,
  SagaPublisherPublishOptions,
  SagaPublisherReceipt,
  SagaPublisherRejected,
  SagaPublisherResult,
} from './src/integration/publisher/saga-publisher-port.ts';
export type {
  CommandJson,
  CommandOutboxAcceptance,
  CommandOutboxDelivery,
  CommandOutboxSink,
  CommandTraceContext,
} from '@netscript/service/commands/relay';
