/**
 * Queue Factory
 *
 * Factory function for creating queue instances with auto-discovery.
 * Automatically detects available queue services from Aspire environment.
 *
 * When using Deno KV, automatically detects whether native queue operations
 * are supported (local/SQLite) or if the KV-polling fallback is needed (KV Connect).
 *
 * @module
 */

import { getPostgresUri, getServiceUrl, isServiceAvailable } from '@netscript/sdk/discovery';
import { getRedisConnectionFromEnv } from '@netscript/kv';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import type { MessageQueue } from '../ports/mod.ts';
import {
  QueueConfigurationError,
  QueueConnectionError,
  type QueueOptions,
  QueueProvider,
} from '../ports/mod.ts';
import { isTelemetryEnabled } from '@netscript/telemetry/config';
import { traceQueue } from '@netscript/telemetry/instrumentation';

export type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  QueueConnectionOptions,
  QueueOptions,
  QueueProvider,
  TypedQueueOptions,
} from '../ports/mod.ts';

/**
 * Get the messaging system name for tracing based on the queue provider.
 */
function getQueueSystemName(provider: QueueProvider): string {
  switch (provider) {
    case QueueProvider.RabbitMQ:
      return 'rabbitmq';
    case QueueProvider.Redis:
      return 'redis';
    case QueueProvider.DenoKv:
      return 'deno-kv-polling';
    case QueueProvider.Postgres:
      return 'postgresql';
    default:
      return 'unknown';
  }
}

/**
 * Check if a KV path is a remote KV Connect URL.
 * KV Connect uses HTTP/HTTPS URLs and doesn't support native queue operations.
 */
function isKvConnect(path: string | undefined): boolean {
  if (!path) {
    return false;
  }
  return path.startsWith('http://') || path.startsWith('https://');
}

/**
 * Get KV connection path from Aspire environment.
 * Returns the path/URL that would be used for KV connections.
 */
function getKvPathFromEnvironment(): string | undefined {
  const kvHttpUrl = Deno.env.get('services__kv__http__0');
  if (kvHttpUrl) {
    return kvHttpUrl;
  }

  const kvUrl = Deno.env.get('KV_URL') || Deno.env.get('DENO_KV_URL');
  if (kvUrl) {
    return kvUrl;
  }

  const sqlitePath = Deno.env.get('services__kv__sqlite__0');
  if (sqlitePath) {
    return sqlitePath;
  }

  const connectionString = Deno.env.get('ConnectionStrings__kv');
  if (connectionString) {
    const match = connectionString.match(/Data Source=([^;]+)/i);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Create a message queue instance with auto-discovery.
 *
 * Priority order for auto-discovery:
 * 1. RabbitMQ (if available via Aspire)
 * 2. Redis (if available via Aspire)
 * 3. Deno KV (default, always available)
 *    - Uses native queue if local/SQLite
 *    - Uses KV-polling if KV Connect (remote HTTP)
 *
 * @template T - Message payload type
 * @param name - Queue name for namespacing
 * @param options - Queue configuration options
 * @returns MessageQueue instance
 */
export function createQueue<T = unknown>(
  name: string,
  options: QueueOptions = {},
): MessageQueue<T> {
  const {
    provider,
    autoDiscover = true,
    connection,
    disableAutoTracing = false,
  } = options;

  const selectedProvider = provider ?? (autoDiscover ? detectProvider() : QueueProvider.DenoKv);
  const queueFactory = createQueueFactory<T>(name, selectedProvider, connection);
  const withTelemetry = isTelemetryEnabled() && !disableAutoTracing;
  const nativeRetrial = getNativeRetrial(selectedProvider, connection);

  return createLazyQueue(
    async () => {
      const baseQueue = await queueFactory();
      if (!withTelemetry) {
        return baseQueue;
      }

      return traceQueue(baseQueue, {
        queueName: name,
        system: getQueueSystemName(selectedProvider),
      });
    },
    nativeRetrial,
  );
}

/**
 * Detect available queue provider from Aspire environment.
 * Priority: RabbitMQ > Redis > Deno KV
 */
function detectProvider(): QueueProvider {
  const hasRedis = !!getRedisConnectionFromEnv();
  const hasRabbitMQ = isServiceAvailable('rabbitmq');

  if (hasRabbitMQ) {
    return QueueProvider.RabbitMQ;
  }

  if (hasRedis) {
    return QueueProvider.Redis;
  }

  return QueueProvider.DenoKv;
}

function createLazyQueue<T>(
  factory: () => Promise<MessageQueue<T>>,
  nativeRetrial: boolean,
): MessageQueue<T> {
  let queuePromise: Promise<MessageQueue<T>> | null = null;

  const ensureQueue = (): Promise<MessageQueue<T>> => {
    if (!queuePromise) {
      queuePromise = factory();
    }
    return queuePromise;
  };

  return {
    nativeRetrial,
    async enqueue(message, enqueueOptions) {
      const queue = await ensureQueue();
      await queue.enqueue(message, enqueueOptions);
    },
    async enqueueMany(messages, enqueueOptions) {
      const queue = await ensureQueue();
      if (queue.enqueueMany) {
        await queue.enqueueMany(messages, enqueueOptions);
        return;
      }

      for (const message of messages) {
        await queue.enqueue(message, enqueueOptions);
      }
    },
    async listen(handler, listenOptions) {
      const queue = await ensureQueue();
      await queue.listen(handler, listenOptions);
    },
    async stop() {
      if (!queuePromise) {
        return;
      }

      const queue = await queuePromise;
      await queue.stop();
    },
  };
}

function createQueueFactory<T>(
  name: string,
  provider: QueueProvider,
  connection?: QueueOptions['connection'],
): () => Promise<MessageQueue<T>> {
  switch (provider) {
    case QueueProvider.RabbitMQ:
      return () => createRabbitMqQueue<T>(name, connection);
    case QueueProvider.Redis:
      return () => createRedisQueue<T>(name, connection);
    case QueueProvider.DenoKv:
      return () => Promise.resolve(createDenoKvQueue<T>(name, connection));
    case QueueProvider.Postgres:
      return () => createPostgresQueue<T>(name, connection);
    default:
      return () =>
        Promise.reject(
          new QueueConfigurationError(`Unknown queue provider: ${provider}`, { provider }),
        );
  }
}

function getNativeRetrial(
  provider: QueueProvider,
  connection?: QueueOptions['connection'],
): boolean {
  if (provider === QueueProvider.DenoKv) {
    const explicitPath = connection?.denoKv?.path;
    const kvPath = explicitPath ?? getKvPathFromEnvironment();
    return !isKvConnect(kvPath);
  }

  return provider === QueueProvider.Redis || provider === QueueProvider.RabbitMQ ||
    provider === QueueProvider.Postgres;
}

/**
 * Create Deno KV queue instance.
 */
function createDenoKvQueue<T>(
  name: string,
  connection?: QueueOptions['connection'],
): MessageQueue<T> {
  const explicitPath = connection?.denoKv?.path;
  const verbose = connection?.denoKv?.verbose ?? false;
  const kvPath = explicitPath ?? getKvPathFromEnvironment();

  if (isKvConnect(kvPath)) {
    return new KvPollingAdapter<T>({
      queueName: name,
      verbose,
      pollInterval: connection?.denoKv?.pollInterval,
      visibilityTimeout: connection?.denoKv?.visibilityTimeout,
      maxRetries: connection?.denoKv?.maxRetries,
    });
  }

  return new DenoKvAdapter<T>({
    queueName: name,
    useShared: !explicitPath,
    verbose,
  });
}

/**
 * Create Redis queue instance.
 */
async function createRedisQueue<T>(
  name: string,
  connection?: QueueOptions['connection'],
): Promise<MessageQueue<T>> {
  const url = connection?.redis?.url ?? getRedisConnectionFromEnv();
  const options = url?.startsWith('rediss://')
    ? {
      ...connection?.redis?.options,
      tls: {
        rejectUnauthorized: false,
      },
    }
    : connection?.redis?.options;

  if (!url) {
    throw new QueueConnectionError(
      'Redis connection not found. Expected Redis/Garnet environment or Aspire service discovery variables',
    );
  }

  const { RedisAdapter } = await import('../adapters/redis.adapter.ts');
  return new RedisAdapter<T>(url, name, options);
}

/**
 * Create RabbitMQ (AMQP) queue instance.
 */
async function createRabbitMqQueue<T>(
  name: string,
  connection?: QueueOptions['connection'],
): Promise<MessageQueue<T>> {
  const url = connection?.rabbitmq?.url ??
    (() => {
      try {
        return getServiceUrl('rabbitmq', 'http').replace('http://', 'amqp://');
      } catch {
        const amqpUrl = Deno.env.get('services__rabbitmq__amqp__0');
        if (!amqpUrl) {
          throw new QueueConnectionError('RabbitMQ service not found in Aspire environment');
        }
        return amqpUrl;
      }
    })();

  const queueName = connection?.rabbitmq?.queueName ?? name;
  const { AmqpAdapter } = await import('../adapters/amqp.adapter.ts');
  return new AmqpAdapter<T>(url, queueName);
}

/**
 * Create PostgreSQL queue instance.
 */
async function createPostgresQueue<T>(
  name: string,
  connection?: QueueOptions['connection'],
): Promise<MessageQueue<T>> {
  const url = connection?.postgres?.url ?? getPostgresUri();

  if (!url) {
    throw new QueueConnectionError(
      'PostgreSQL connection not found. Expected postgres connection options or Aspire PostgreSQL environment variables',
    );
  }

  const { PostgresAdapter } = await import('../adapters/postgres.adapter.ts');
  return new PostgresAdapter<T>({
    url,
    queueName: name,
    tableName: connection?.postgres?.tableName,
  });
}
