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
  readonly id: string;
  enqueue(record: SagaOutboxRecord): Promise<void>;
  claim(limit: number): Promise<readonly SagaOutboxRecord[]>;
  markPublished(id: SagaMessageId, publishedAt: Date): Promise<void>;
}
