/**
 * Port implemented by stream producers that publish State Protocol changes.
 */
export interface StreamProducerPort {
  /** Upsert an entity into a named stream collection. */
  upsert(entityType: string, value: Record<string, unknown>): void;

  /** Delete an entity from a named stream collection by primary key. */
  delete(entityType: string, key: string): void;

  /** Flush pending writes before process shutdown. */
  flush(): Promise<void>;

  /** Flush and close the producer. */
  close(): Promise<void>;
}
