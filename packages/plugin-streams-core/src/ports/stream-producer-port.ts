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
  /** Current lifecycle and buffer snapshot. */
  readonly state: StreamProducerStateSnapshotV1;

  /** Whether writes can currently be attempted without reconnecting first. */
  readonly isReady: boolean;

  /** Whether shutdown or terminal failure prevents new writes. */
  readonly closed: boolean;

  /** Upsert an entity into a named stream collection. */
  upsert(
    entityType: string,
    value: Record<string, unknown>,
    context?: StreamWriteContextV1,
  ): StreamWriteReceiptV1;

  /** Delete an entity from a named stream collection by primary key. */
  delete(
    entityType: string,
    key: string,
    context?: StreamWriteContextV1,
  ): StreamWriteReceiptV1;

  /** Wait for the current or next ready transition. */
  waitUntilReady(options?: StreamProducerReadinessOptionsV1): Promise<void>;

  /** Flush pending writes before process shutdown. */
  flush(): Promise<void>;

  /** Stop local work without sending durable EOF. */
  stop(): Promise<void>;

  /** Flush and close the producer. */
  close(): Promise<void>;
}
import type {
  StreamProducerReadinessOptionsV1,
  StreamProducerStateSnapshotV1,
  StreamWriteReceiptV1,
} from '../domain/producer-contract-v1.ts';
