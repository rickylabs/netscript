/** Per-write correlation and message identity accepted by stream producers. */
export interface StreamWriteContextV1 {
  /** Stable correlation identity; the entity key is used when absent or empty. */
  readonly correlationId?: string;
  /** Stable message identity; the entity key is used when absent or empty. */
  readonly messageId?: string;
}

/**
 * Port implemented by stream producers that publish State Protocol changes.
 */
export interface StreamProducerPort {
  /** Upsert an entity into a named stream collection. */
  upsert(
    entityType: string,
    value: Record<string, unknown>,
    context?: StreamWriteContextV1,
  ): void;

  /** Delete an entity from a named stream collection by primary key. */
  delete(entityType: string, key: string, context?: StreamWriteContextV1): void;

  /** Flush pending writes before process shutdown. */
  flush(): Promise<void>;

  /** Flush and close the producer. */
  close(): Promise<void>;
}
