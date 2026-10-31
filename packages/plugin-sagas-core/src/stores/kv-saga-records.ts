import type {
  SagaMessage,
  SagaState,
  SagaStateEnvelope,
  SagaStateMetadata,
  SagaTransition,
  SagaTransitionRecord,
} from '../domain/mod.ts';

// Native KV preserves Date; JSON-backed KV adapters persist its ISO string representation.
type KvDates<T> = {
  [Key in keyof T]: T[Key] extends Date | undefined ? T[Key] | string : T[Key];
};

/** Storage shape accepted from both structured-clone and JSON KV providers. */
export type KvSagaEnvelope<TState extends SagaState = SagaState> = Readonly<{
  metadata: KvDates<SagaStateMetadata>;
  state: TState;
}>;

/** History dates have the same provider-dependent wire representation as envelope metadata. */
export type KvSagaRecord<TState extends SagaState = SagaState> = Readonly<{
  version: number;
  transition: Omit<SagaTransition<TState>, 'occurredAt' | 'message'> & {
    occurredAt: Date | string;
    message: KvDates<SagaMessage>;
  };
}>;

/** Restore only declared metadata dates; business state remains unchanged. */
export function decodeKvSagaEnvelope<TState extends SagaState>(
  envelope: KvSagaEnvelope<TState>,
): SagaStateEnvelope<TState> {
  const { completedAt, ...metadata } = envelope.metadata;
  return {
    ...envelope,
    metadata: {
      ...metadata,
      createdAt: decodeDate(metadata.createdAt),
      updatedAt: decodeDate(metadata.updatedAt),
      ...(Object.hasOwn(envelope.metadata, 'completedAt')
        ? { completedAt: completedAt === undefined ? undefined : decodeDate(completedAt) }
        : {}),
    },
  };
}

/** Restore declared history dates without interpreting the message payload or state. */
export function decodeKvSagaRecord<TState extends SagaState>(
  record: KvSagaRecord<TState>,
): SagaTransitionRecord<TState> {
  const { transition } = record;
  const { occurredAt, ...message } = transition.message;
  return {
    ...record,
    transition: {
      ...transition,
      occurredAt: decodeDate(transition.occurredAt),
      message: {
        ...message,
        ...(Object.hasOwn(transition.message, 'occurredAt')
          ? { occurredAt: occurredAt === undefined ? undefined : decodeDate(occurredAt) }
          : {}),
      },
    },
  };
}

function decodeDate(value: Date | string): Date {
  if (!(value instanceof Date) && typeof value !== 'string') {
    throw new TypeError('Invalid persisted saga date.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid persisted saga date.');
  return date;
}
