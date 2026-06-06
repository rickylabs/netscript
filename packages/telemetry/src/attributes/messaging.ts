/**
 * Semantic messaging attribute names used by queue instrumentation.
 */
export const MessagingAttributes = {
  SYSTEM: 'messaging.system',
  DESTINATION_NAME: 'messaging.destination.name',
  DESTINATION_KIND: 'messaging.destination.kind',
  OPERATION: 'messaging.operation',
  MESSAGE_ID: 'messaging.message.id',
  CORRELATION_ID: 'messaging.message.correlation_id',
  DELIVERY_COUNT: 'messaging.message.delivery_count',
  PRIORITY: 'messaging.message.priority',
  PAYLOAD_SIZE: 'messaging.message.payload_size_bytes',
  DLQ: 'messaging.destination.dlq',
} as const;

/**
 * Messaging operation names used on queue spans.
 */
export const MessagingOperations = {
  PUBLISH: 'publish',
  RECEIVE: 'receive',
  ACK: 'ack',
  NACK: 'nack',
  CLAIM: 'claim',
  SETTLE: 'settle',
} as const;

/**
 * Messaging system names supported by NetScript queue instrumentation.
 */
export const MessagingSystems = {
  DENO_KV_QUEUE: 'deno-kv-queue',
  DENO_KV_POLLING: 'deno-kv-polling',
  RABBITMQ: 'rabbitmq',
  REDIS: 'redis',
} as const;
