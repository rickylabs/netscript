import { DurableStream, DurableStreamError, IdempotentProducer } from '@durable-streams/client';
import type { StateSchema, StreamStateDefinition } from '../domain/stream-schema.ts';
import type { StreamProducerPort } from '../ports/stream-producer-port.ts';
import { buildStreamUrl, getStreamsAuth } from './stream-url-resolver.ts';

/** Options accepted by {@link DurableStreamProducer}. */
export interface DurableStreamProducerOptions<TDef extends StreamStateDefinition> {
  /** Stream path relative to the base URL, for example `/workers/executions`. */
  readonly streamPath: string;
  /** State schema produced by {@link defineStreamSchema}. */
  readonly schema: StateSchema<TDef>;
  /** Stable producer identity for idempotent delivery. */
  readonly producerId: string;
  /** Optional abort signal used while opening the stream. */
  readonly signal?: AbortSignal;
}

/**
 * Server-side writer for a named durable stream.
 *
 * @remarks Uses `console.warn` for current alpha operator visibility; tracked as AP-13
 * architecture debt until the telemetry-integration wave supplies a structured reporter.
 *
 * @example
 * ```ts
 * const producer = createDurableStream({
 *   streamPath: "/workers/executions",
 *   schema,
 *   producerId: "workers-service",
 * });
 * ```
 */
export class DurableStreamProducer<TDef extends StreamStateDefinition>
  implements StreamProducerPort {
  /** Stream path owned by this producer. */
  readonly streamPath: string;

  readonly #schema: StateSchema<TDef>;
  readonly #producerId: string;
  #idempotent: IdempotentProducer | null = null;
  readonly #pendingEvents: string[] = [];
  readonly #initPromise: Promise<void>;
  #connectError: Error | null = null;
  #closed = false;

  /** Create a producer and begin connecting to the durable stream server. */
  constructor(options: DurableStreamProducerOptions<TDef>) {
    this.streamPath = options.streamPath;
    this.#schema = options.schema;
    this.#producerId = options.producerId;
    this.#initPromise = this.#connect(options.signal);
  }

  /** Whether this producer has begun shutdown and no longer accepts writes. */
  get closed(): boolean {
    return this.#closed;
  }

  async #connect(signal?: AbortSignal): Promise<void> {
    const url = buildStreamUrl(this.streamPath);
    const headers = getStreamsAuth();

    let handle: DurableStream;
    try {
      handle = await DurableStream.create({
        url,
        contentType: 'application/json',
        headers,
        signal,
      });
    } catch (error) {
      if (error instanceof DurableStreamError && error.code === 'CONFLICT_EXISTS') {
        handle = new DurableStream({ url, headers });
      } else {
        const wrapped = error instanceof Error ? error : new Error(String(error));
        this.#connectError = wrapped;
        // AbortError on signal cancellation is expected; everything else is a
        // connection failure that would silently drop subsequent writes, so
        // surface it through the warn channel for operator visibility.
        if (wrapped.name !== 'AbortError') {
          console.warn(
            `[DurableStreamProducer] Could not connect to stream "${this.streamPath}": ${wrapped.message}. Writes will be dropped until reconnect.`,
          );
        }
        return;
      }
    }

    const idempotent = new IdempotentProducer(handle, this.#producerId, {
      autoClaim: true,
      lingerMs: 10,
    });

    try {
      let event = this.#pendingEvents.shift();
      while (event !== undefined) {
        idempotent.append(event);
        event = this.#pendingEvents.shift();
      }
    } catch (error) {
      const wrapped = error instanceof Error ? error : new Error(String(error));
      this.#connectError = wrapped;
      console.warn(
        `[DurableStreamProducer] Could not drain pending events for stream "${this.streamPath}": ${wrapped.message}.`,
      );
      return;
    }

    this.#idempotent = idempotent;
  }

  #appendEvent(event: string): void {
    if (this.#connectError) {
      console.warn(
        `[DurableStreamProducer] Skipping event on stream "${this.streamPath}": producer connection failed with ${this.#connectError.message}.`,
      );
      return;
    }

    if (this.#idempotent) {
      this.#idempotent.append(event);
      return;
    }

    this.#pendingEvents.push(event);
  }

  #serializeEvent(
    entityType: string,
    operation: 'upsert' | 'delete',
    payload: Record<string, unknown>,
  ): string | null {
    try {
      return JSON.stringify(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[DurableStreamProducer] Skipping ${operation} on stream "${this.streamPath}" for entity "${entityType}": event payload could not be serialized: ${message}.`,
      );
      return null;
    }
  }

  /**
   * Upsert an entity into a stream collection.
   *
   * @param entityType - Collection key in the stream schema.
   * @param value - Entity value containing the configured primary key.
   */
  upsert<K extends keyof TDef & string>(
    entityType: K,
    value: Record<string, unknown>,
  ): void {
    if (this.#closed) {
      return;
    }

    const definition = this.#schema[entityType];
    if (!definition) {
      return;
    }

    const rawKey = value[definition.primaryKey];
    const key = rawKey === undefined || rawKey === null ? '' : String(rawKey);
    if (key === '') {
      console.warn(
        `[DurableStreamProducer] Skipping upsert on stream "${this.streamPath}" for entity "${entityType}": primary key "${definition.primaryKey}" is missing or empty.`,
      );
      return;
    }
    const event = this.#serializeEvent(entityType, 'upsert', {
      type: definition.type ?? entityType,
      key,
      value,
      headers: { operation: 'upsert' },
    });
    if (event) {
      this.#appendEvent(event);
    }
  }

  /**
   * Delete an entity from a stream collection.
   *
   * @param entityType - Collection key in the stream schema.
   * @param key - Primary key of the entity to delete.
   */
  delete<K extends keyof TDef & string>(entityType: K, key: string): void {
    if (this.#closed) {
      return;
    }

    const definition = this.#schema[entityType];
    if (!definition) {
      return;
    }

    if (key === '') {
      console.warn(
        `[DurableStreamProducer] Skipping delete on stream "${this.streamPath}" for entity "${entityType}": empty primary key.`,
      );
      return;
    }

    const event = this.#serializeEvent(entityType, 'delete', {
      type: definition.type ?? entityType,
      key,
      headers: { operation: 'delete' },
    });
    if (event) {
      this.#appendEvent(event);
    }
  }

  /** Flush pending writes before graceful shutdown. */
  async flush(): Promise<void> {
    await this.#initPromise;
    if (this.#connectError) {
      throw this.#connectError;
    }
    await this.#idempotent?.flush();
  }

  /** Flush pending writes and close this producer. */
  async close(): Promise<void> {
    this.#closed = true;
    await this.#initPromise;
    await this.#idempotent?.close();
    removeProducer(this.streamPath, this);
  }
}

const producers = new Map<string, DurableStreamProducer<StreamStateDefinition>>();

function removeProducer(
  streamPath: string,
  producer: DurableStreamProducer<StreamStateDefinition>,
): void {
  if (producers.get(streamPath) === producer) {
    producers.delete(streamPath);
  }
}

/**
 * Create or reuse a durable stream producer for a stream path.
 *
 * @param options - Producer options including stream path, schema, and producer ID.
 * @returns The singleton producer for the requested stream path.
 */
export function createDurableStream<TDef extends StreamStateDefinition>(
  options: DurableStreamProducerOptions<TDef>,
): DurableStreamProducer<TDef> {
  const existing = producers.get(options.streamPath);
  if (existing && !existing.closed) {
    return existing as DurableStreamProducer<TDef>;
  }
  if (existing?.closed) {
    producers.delete(options.streamPath);
  }

  const producer = new DurableStreamProducer(options);
  producers.set(options.streamPath, producer as DurableStreamProducer<StreamStateDefinition>);
  return producer;
}
