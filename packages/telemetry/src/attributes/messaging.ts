/**
 * Semantic messaging attribute names used by queue instrumentation.
 */
export const MessagingAttributes = {
  SYSTEM: 'messaging.system',
  DESTINATION_NAME: 'messaging.destination.name',
  OPERATION: 'messaging.operation',
  OPERATION_NAME: 'messaging.operation.name',
  OPERATION_TYPE: 'messaging.operation.type',
  MESSAGE_ID: 'messaging.message.id',
  MESSAGE_CONVERSATION_ID: 'messaging.message.conversation_id',
  MESSAGE_BODY_SIZE: 'messaging.message.body.size',
  MESSAGE_ENVELOPE_SIZE: 'messaging.message.envelope.size',
  DESTINATION_KIND: 'netscript.messaging.destination.kind',
  CORRELATION_ID: 'netscript.correlation.id',
  DELIVERY_COUNT: 'netscript.messaging.message.delivery_count',
  PRIORITY: 'netscript.messaging.message.priority',
  PAYLOAD_SIZE: 'messaging.message.body.size',
  DELAY_MS: 'netscript.messaging.message.delay_ms',
  DLQ: 'netscript.messaging.destination.dlq',
  REQUEUE: 'netscript.messaging.requeue',
} as const;

/**
 * Deprecated messaging aliases emitted during the beta.5 duplicate-key window.
 */
export const DeprecatedMessagingAttributeAliases = {
  OPERATION: 'messaging.operation',
} as const;

/**
 * Messaging operation names used on queue spans.
 */
export const MessagingOperations = {
  CREATE: 'create',
  SEND: 'send',
  RECEIVE: 'receive',
  PROCESS: 'process',
  PUBLISH: 'publish',
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
