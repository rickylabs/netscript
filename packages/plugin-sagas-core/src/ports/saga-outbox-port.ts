import type { CascadedMessage, SagaInstanceId, SagaMessageId } from '../domain/mod.ts';

/** Transactional outbox record reserved for T2 durability. */
export type SagaOutboxRecord = Readonly<{
  id: SagaMessageId;
  instanceId: SagaInstanceId;
  messages: readonly CascadedMessage[];
  createdAt: Date;
  publishedAt?: Date;
}>;

/** Reserved T2 port for atomic state and cascaded-message commits. */
export interface SagaOutboxPort {
  /** Stable adapter identifier used by runtime diagnostics and plugin registration. */
  readonly id: string;
  /** Persist cascaded messages for later publication. */
  enqueue(record: SagaOutboxRecord): Promise<void>;
  /** Claim a bounded batch of unpublished outbox records. */
  claim(limit: number): Promise<readonly SagaOutboxRecord[]>;
  /** Mark an outbox record as published at the supplied time. */
  markPublished(id: SagaMessageId, publishedAt: Date): Promise<void>;
}
