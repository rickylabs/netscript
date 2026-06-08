/**
 * Queue Options and Configuration
 *
 * Configuration types for queue creation and provider selection.
 *
 * @module
 */

/**
 * Supported queue providers.
 */
export enum QueueProvider {
  /**
   * Deno KV Queue - Built-in, zero-config default.
   * Best for: Development, single instance, < 1000 msg/sec
   */
  DenoKv = 'deno-kv',

  /**
   * Redis Queue - High throughput, pub/sub support.
   * Best for: Production, high throughput, > 10,000 msg/sec
   */
  Redis = 'redis',

  /**
   * RabbitMQ (AMQP) Queue - Enterprise messaging.
   * Best for: Complex routing, reliability, enterprise
   */
  RabbitMQ = 'rabbitmq',

  /**
   * PostgreSQL Queue - Transactional messaging.
   * Best for: Existing PostgreSQL infrastructure
   */
  Postgres = 'postgres',
}

/**
 * Base options for creating a queue.
 */
export interface QueueOptions {
  /**
   * Queue provider to use.
   * If not specified, auto-discovery will be used.
   */
  provider?: QueueProvider;

  /**
   * Enable auto-discovery of queue services from Aspire environment.
   * Priority: RabbitMQ > Redis > Deno KV (default)
   *
   * @default true
   */
  autoDiscover?: boolean;

  /**
   * Maximum retry attempts for failed messages.
   * Only applies when backend doesn't have native retry.
   *
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Delay between retry attempts in milliseconds.
   * Only applies when backend doesn't have native retry.
   *
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Provider-specific connection options.
   */
  connection?: QueueConnectionOptions;

  /**
   * Disable automatic tracing wrapper.
   * When true, the queue will not be automatically wrapped with TracedQueue.
   * Useful when manual tracing is preferred (e.g., in scheduler with traceJobDispatch).
   *
   * @default false
   */
  disableAutoTracing?: boolean;
}

/**
 * Provider-specific connection options.
 */
export interface QueueConnectionOptions {
  /**
   * Deno KV connection options.
   * Also includes options for the KV-polling adapter used with KV Connect.
   */
  denoKv?: {
    /**
     * KV database path or URL.
     * If not provided, uses Aspire service discovery or default Deno KV.
     */
    path?: string;

    /**
     * Enable verbose logging for debugging.
     * @default false
     */
    verbose?: boolean;

    // --- KV-Polling Adapter Options (used when KV Connect is detected) ---

    /**
     * Polling interval in milliseconds when no messages are available.
     * Only used with KV-polling adapter (KV Connect).
     * @default 1000
     */
    pollInterval?: number;

    /**
     * Visibility timeout in milliseconds.
     * How long a message is hidden from other consumers while being processed.
     * Only used with KV-polling adapter (KV Connect).
     * @default 30000 (30 seconds)
     */
    visibilityTimeout?: number;

    /**
     * Maximum number of retry attempts before sending to DLQ.
     * Only used with KV-polling adapter (KV Connect).
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay for exponential backoff in milliseconds.
     * Only used with KV-polling adapter (KV Connect).
     * @default 1000
     */
    retryBaseDelay?: number;

    /**
     * Maximum delay for exponential backoff in milliseconds.
     * Only used with KV-polling adapter (KV Connect).
     * @default 300000 (5 minutes)
     */
    retryMaxDelay?: number;

    /**
     * Deduplication window in milliseconds.
     * Only used with KV-polling adapter (KV Connect).
     * @default 300000 (5 minutes)
     */
    deduplicationWindow?: number;
  };

  /**
   * Redis connection options.
   */
  redis?: {
    /**
     * Redis connection URL.
     * If not provided, uses Aspire service discovery.
     */
    url?: string;

    /**
     * Redis connection options (ioredis).
     */
    options?: Record<string, unknown>;
  };

  /**
   * RabbitMQ (AMQP) connection options.
   */
  rabbitmq?: {
    /**
     * AMQP connection URL.
     * If not provided, uses Aspire service discovery.
     */
    url?: string;

    /**
     * Queue name for RabbitMQ.
     * @default 'default'
     */
    queueName?: string;
  };

  /**
   * PostgreSQL connection options.
   */
  postgres?: {
    /**
     * PostgreSQL connection URL.
     * If not provided, uses Aspire service discovery.
     */
    url?: string;

    /**
     * Table name for queue storage.
     * @default 'message_queue'
     */
    tableName?: string;
  };
}

/**
 * Options for creating a typed queue with Zod validation.
 */
export interface TypedQueueOptions extends QueueOptions {
  /**
   * Validate messages before enqueuing.
   * @default true
   */
  validateOnEnqueue?: boolean;

  /**
   * Validate messages when dequeuing.
   * @default true
   */
  validateOnDequeue?: boolean;

  /**
   * Action to take when validation fails on dequeue.
   * - 'discard': Discard invalid messages
   * - 'dlq': Move to dead-letter queue
   * - 'throw': Throw error and retry
   *
   * @default 'discard'
   */
  onValidationError?: 'discard' | 'dlq' | 'throw';
}
