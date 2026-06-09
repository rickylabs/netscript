/**
 * @module @netscript/plugin-sagas-core/transports
 *
 * Saga transport adapters.
 */

export { createNetScriptRedisTransport, NetScriptRedisTransport } from './redis-transport.ts';
export { createGarnetListTransport, GarnetListTransport } from './list-transport.ts';
export {
  decodeListDelayedEntry,
  encodeListDelayedEntry,
  ListDelayedMessageProcessor,
} from './list-transport-delayed.ts';
export {
  decodeListTransportMessage,
  encodeListTransportMessage,
  ListTransportAck,
  ListTransportSubscription,
  ListTransportSubscriptionRecord,
} from './list-transport-subscription.ts';
export {
  decodeRedisDelayedEntry,
  encodeRedisDelayedEntry,
  RedisDelayedMessageProcessor,
} from './redis-transport-delayed.ts';
export {
  decodeRedisTransportMessage,
  encodeRedisTransportMessage,
  RedisTransportAck,
  RedisTransportSubscription,
} from './redis-transport-subscription.ts';
export type { SagaMessage, SagaMessageId } from '../domain/mod.ts';
export type {
  SagaTransportAck,
  SagaTransportHandler,
  SagaTransportMessage,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
export type {
  GarnetListTransportOptions,
  ListTransportClient,
  ListTransportClientFactory,
} from './list-transport.ts';
export type {
  ListDelayedClient,
  ListDelayedMessageEntry,
  ListDelayedMessageProcessorOptions,
} from './list-transport-delayed.ts';
export type {
  ListBlockingClient,
  ListDecodedTransportMessage,
  ListStoredEnvelope,
} from './list-transport-subscription.ts';
export type {
  NetScriptRedisTransportOptions,
  RedisConnectionOptions,
  RedisStreamClient,
  RedisStreamClientFactory,
  RedisTransportLogger,
} from './redis-transport.ts';
export type {
  RedisDelayedClient,
  RedisDelayedMessageEntry,
  RedisDelayedMessageProcessorOptions,
} from './redis-transport-delayed.ts';
export type {
  RedisClaimedMessageResult,
  RedisPendingMessageResult,
  RedisStoredEnvelope,
  RedisStreamReadGroupResult,
  RedisTransportSubscriptionRecord,
} from './redis-transport-subscription.ts';
