/**
 * PostgreSQL Queue Adapter
 *
 * Uses a PostgreSQL table with row claims and visibility timeout for NetScript queue integration.
 *
 * @module
 */

import { Pool } from 'npm:pg@^8.21.0';
import type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';
import { QueueConnectionError, QueueError, QueueErrorCode } from '../ports/mod.ts';
import { createEnvelope, createMessageContext, isMessageEnvelope } from './_envelope.ts';

export type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

const DEFAULT_TABLE_NAME = 'message_queue';
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_VISIBILITY_TIMEOUT_MS = 30_000;

interface PostgresQueryResult<Row = Record<string, unknown>> {
  readonly rows: Row[];
}

/**
 * Minimal PostgreSQL client capability consumed by {@link PostgresAdapter}.
 */
export interface PostgresQueueClient {
  /**
   * Run a parameterized SQL query.
   *
   * @param text - SQL text.
   * @param values - Bound query parameters.
   * @returns Query rows returned by PostgreSQL.
   */
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<PostgresQueryResult<Row>>;

  /**
   * Optional pool shutdown hook.
   */
  end?(): Promise<void>;
}

/**
 * Options for creating a PostgreSQL queue adapter.
 */
export interface PostgresAdapterOptions {
  /**
   * PostgreSQL connection URL used when a client is not supplied.
   */
  url?: string;
  /**
   * Queue name stored in the shared queue table.
   */
  queueName?: string;
  /**
   * Queue table name. May include a schema prefix.
   *
   * @default 'message_queue'
   */
  tableName?: string;
  /**
   * Delay between empty queue polls while listening.
   *
   * @default 1000
   */
  pollInterval?: number;
  /**
   * Time before a claimed-but-unacked message can be claimed again.
   *
   * @default 30000
   */
  visibilityTimeout?: number;
  /**
   * Caller-owned PostgreSQL client or pool, primarily for tests.
   */
  client?: PostgresQueueClient;
}

interface PostgresMessageRow extends Record<string, unknown> {
  readonly message_id: string;
  readonly payload: unknown;
  readonly headers: unknown;
  readonly delivery_count: number;
  readonly enqueued_at: Date | string;
}

/**
 * PostgreSQL queue adapter implementation.
 *
 * @template T - Message payload type.
 */
export class PostgresAdapter<T = unknown> implements MessageQueue<T> {
  private readonly queueName: string;
  private readonly tableName: string;
  private readonly tableIdentifier: string;
  private readonly pollInterval: number;
  private readonly visibilityTimeout: number;
  private readonly explicitClient?: PostgresQueueClient;
  private readonly url?: string;
  private readonly consumerId = crypto.randomUUID();
  private client: PostgresQueueClient | null = null;
  private schemaReady: Promise<void> | null = null;
  private listening = false;
  private abortController?: AbortController;

  /**
   * PostgreSQL supports native retry-style redelivery through visibility timeout.
   */
  readonly nativeRetrial = true;

  /**
   * Create a PostgreSQL queue adapter.
   *
   * @param options - Adapter configuration and optional caller-owned client.
   */
  constructor(options: PostgresAdapterOptions = {}) {
    this.queueName = options.queueName ?? 'default';
    this.tableName = options.tableName ?? DEFAULT_TABLE_NAME;
    this.tableIdentifier = quoteQualifiedIdentifier(this.tableName);
    this.pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL_MS;
    this.visibilityTimeout = options.visibilityTimeout ?? DEFAULT_VISIBILITY_TIMEOUT_MS;
    this.explicitClient = options.client;
    this.url = options.url;
  }

  /**
   * Enqueue one message into the PostgreSQL queue table.
   *
   * @param message - Message payload to enqueue.
   * @param options - Optional delay and metadata settings.
   */
  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    try {
      const client = await this.ensureClient();
      const envelope = createEnvelope(message, options);
      const availableAt = new Date(Date.now() + (options?.delay ?? 0));
      await client.query(
        `INSERT INTO ${this.tableIdentifier} (
          queue_name,
          message_id,
          payload,
          headers,
          delivery_count,
          enqueued_at,
          available_at
        ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7)`,
        [
          this.queueName,
          envelope.messageId,
          JSON.stringify(envelope),
          JSON.stringify(envelope.headers),
          envelope.deliveryCount,
          envelope.enqueuedAt,
          availableAt,
        ],
      );
    } catch (error) {
      throw new QueueError(
        `Failed to enqueue message: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.ENQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName, tableName: this.tableName },
        },
      );
    }
  }

  /**
   * Enqueue messages sequentially using the same options.
   *
   * @param messages - Message payloads to enqueue.
   * @param options - Optional delay and metadata settings applied to each message.
   */
  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    try {
      for (const message of messages) {
        await this.enqueue(message, options);
      }
    } catch (error) {
      throw new QueueError(
        `Failed to enqueue messages: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.ENQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName, count: messages.length },
        },
      );
    }
  }

  /**
   * Listen for PostgreSQL-backed messages until stopped or aborted.
   *
   * @param handler - Async callback invoked for each decoded message.
   * @param options - Listener cancellation and visibility timeout settings.
   */
  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    if (this.listening) {
      throw new QueueError('Queue is already listening', QueueErrorCode.CONFIGURATION_ERROR);
    }

    this.listening = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const externalSignal = options?.signal;
    const onAbort = (): void => this.abortController?.abort();
    if (externalSignal?.aborted) {
      this.abortController.abort();
    } else {
      externalSignal?.addEventListener('abort', onAbort, { once: true });
    }

    try {
      await this.ensureClient();
      while (!signal.aborted) {
        const row = await this.claimNextMessage(options?.visibilityTimeout);
        if (!row) {
          await wait(this.pollInterval, signal);
          continue;
        }

        await this.processRow(row, handler);
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      throw new QueueError(
        `Queue listener failed: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.DEQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName, tableName: this.tableName },
        },
      );
    } finally {
      externalSignal?.removeEventListener('abort', onAbort);
      this.listening = false;
    }
  }

  /**
   * Stop the active PostgreSQL listener.
   */
  stop(): Promise<void> {
    this.abortController?.abort();
    this.listening = false;
    return Promise.resolve();
  }

  private async ensureClient(): Promise<PostgresQueueClient> {
    if (this.client) {
      return this.client;
    }

    if (this.explicitClient) {
      this.client = this.explicitClient;
      await this.ensureSchema(this.client);
      return this.client;
    }

    if (!this.url) {
      throw new QueueConnectionError('PostgreSQL connection URL is required');
    }

    try {
      this.client = new Pool({ connectionString: this.url }) as PostgresQueueClient;
      await this.ensureSchema(this.client);
      return this.client;
    } catch (error) {
      throw new QueueConnectionError(
        `Failed to initialize PostgreSQL queue: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private async ensureSchema(client: PostgresQueueClient): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema(client);
    }
    await this.schemaReady;
  }

  private async createSchema(client: PostgresQueueClient): Promise<void> {
    await client.query(
      `CREATE TABLE IF NOT EXISTS ${this.tableIdentifier} (
        queue_name TEXT NOT NULL,
        message_id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        headers JSONB NOT NULL DEFAULT '{}'::jsonb,
        delivery_count INTEGER NOT NULL DEFAULT 0,
        enqueued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        locked_at TIMESTAMPTZ,
        locked_by TEXT
      )`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${indexName(this.tableName, 'available')}
        ON ${this.tableIdentifier} (queue_name, available_at, enqueued_at)
        WHERE locked_at IS NULL`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${indexName(this.tableName, 'locked')}
        ON ${this.tableIdentifier} (queue_name, locked_at)
        WHERE locked_at IS NOT NULL`,
    );
  }

  private async claimNextMessage(
    visibilityTimeout = this.visibilityTimeout,
  ): Promise<PostgresMessageRow | null> {
    const client = await this.ensureClient();
    const result = await client.query<PostgresMessageRow>(
      `UPDATE ${this.tableIdentifier}
        SET locked_by = $2,
          locked_at = NOW(),
          delivery_count = delivery_count + 1
        WHERE message_id = (
          SELECT message_id
          FROM ${this.tableIdentifier}
          WHERE queue_name = $1
            AND available_at <= NOW()
            AND (
              locked_at IS NULL
              OR locked_at < NOW() - ($3::integer * INTERVAL '1 millisecond')
            )
          ORDER BY available_at ASC, enqueued_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING message_id, payload, headers, delivery_count, enqueued_at`,
      [this.queueName, this.consumerId, visibilityTimeout],
    );
    return result.rows[0] ?? null;
  }

  private async processRow(
    row: PostgresMessageRow,
    handler: (message: T, context: MessageContext) => Promise<void>,
  ): Promise<void> {
    let payload: T;
    let headers = normalizeHeaders(row.headers);
    let messageId = row.message_id;
    let enqueuedAt = new Date(row.enqueued_at);
    let deliveryCount = row.delivery_count;

    const rawMessage = row.payload;
    if (isMessageEnvelope<T>(rawMessage)) {
      payload = rawMessage.payload;
      headers = rawMessage.headers;
      messageId = rawMessage.messageId;
      enqueuedAt = new Date(rawMessage.enqueuedAt);
      deliveryCount = row.delivery_count;
    } else {
      payload = rawMessage as T;
    }

    let settled = false;
    const context = this.createContext(
      row.message_id,
      messageId,
      enqueuedAt,
      headers,
      deliveryCount,
      () => settled = true,
    );

    try {
      await handler(payload, context);
      if (!settled) {
        await context.ack();
      }
    } catch (error) {
      if (!settled) {
        await context.nack({ requeue: true });
      }
      throw error;
    }
  }

  private createContext(
    storageMessageId: string,
    messageId: string,
    enqueuedAt: Date,
    headers: Record<string, string>,
    deliveryCount: number,
    markSettled: () => void,
  ): MessageContext {
    return createMessageContext(
      messageId,
      enqueuedAt,
      headers,
      deliveryCount,
      async () => {
        await this.ack(storageMessageId);
        markSettled();
      },
      async (options) => {
        if (options?.requeue ?? true) {
          await this.release(storageMessageId);
        } else {
          await this.ack(storageMessageId);
        }
        markSettled();
      },
    );
  }

  private async ack(messageId: string): Promise<void> {
    const client = await this.ensureClient();
    await client.query(
      `DELETE FROM ${this.tableIdentifier}
        WHERE queue_name = $1 AND message_id = $2`,
      [this.queueName, messageId],
    );
  }

  private async release(messageId: string): Promise<void> {
    const client = await this.ensureClient();
    await client.query(
      `UPDATE ${this.tableIdentifier}
        SET locked_at = NULL,
          locked_by = NULL,
          available_at = NOW()
        WHERE queue_name = $1 AND message_id = $2`,
      [this.queueName, messageId],
    );
  }
}

function quoteQualifiedIdentifier(name: string): string {
  const parts = name.split('.');
  if (parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(part))) {
    throw new QueueError(
      `Invalid PostgreSQL queue table name: ${name}`,
      QueueErrorCode.CONFIGURATION_ERROR,
      { context: { tableName: name } },
    );
  }
  return parts.map((part) => `"${part.replaceAll('"', '""')}"`).join('.');
}

function indexName(tableName: string, suffix: string): string {
  const normalized = tableName.replaceAll('.', '_');
  const raw = `${normalized}_${suffix}_idx`;
  const trimmed = raw.length <= 50 ? raw : raw.slice(0, 50);
  return quoteQualifiedIdentifier(trimmed);
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, String(value)]),
  );
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
