import type { StoredCommandOutbox } from '@netscript/database/commands';
import type { SagaInstanceId, SagaStateEnvelope, SagaTransitionRecord } from '../domain/mod.ts';
import type { SagaCorrelationIndexEntry, SagaStorePort } from './saga-store-port.ts';

/** One optimistic condition covers every local row, including inbound replay participation. */
export type SagaTransitionCommitRequest = Readonly<{
  expectedVersion: number;
  envelope: SagaStateEnvelope;
  correlation: SagaCorrelationIndexEntry;
  record: SagaTransitionRecord;
  commands: readonly StoredCommandOutbox[];
  appliedKeyHash?: string;
}>;

/** False means an already-committed inbound key; no new row is written. */
export type SagaTransitionCommitResult = Readonly<{ committed: boolean }>;

/** Atomic state, correlation, history and replay; command intents require same-commit outbox support. */
export interface SagaTransitionCommitPort {
  /** Adapter guarantees; absence refuses stored runtime composition. */
  readonly transitionCommitCapabilities: Readonly<{
    transitionOutbox: 'same_commit' | 'unsupported';
    optimisticVersion: true;
    replay: 'same_commit';
  }>;
  /** Optional read-only replay fast path; commitTransition still arbitrates concurrent writers. */
  hasAppliedTransition?(instanceId: SagaInstanceId, keyHash: string): Promise<boolean>;
  /** Commit all request rows or none; version zero requires absent state; reject unsupported commands. */
  commitTransition(
    request: SagaTransitionCommitRequest,
    signal?: AbortSignal,
  ): Promise<SagaTransitionCommitResult>;
}

/** Canonical store with the explicit atomic transition capability. */
export type SagaTransitionStore = SagaStorePort & SagaTransitionCommitPort;

/** Test atomic state and replay support independently of worker-command outbox support. */
export function isSagaAtomicStore(store: SagaStorePort | undefined): store is SagaTransitionStore {
  const candidate = store as Partial<SagaTransitionStore> | undefined;
  return (candidate?.transitionCommitCapabilities?.transitionOutbox === 'same_commit' ||
    candidate?.transitionCommitCapabilities?.transitionOutbox === 'unsupported') &&
    candidate.transitionCommitCapabilities.optimisticVersion === true &&
    candidate.transitionCommitCapabilities.replay === 'same_commit' &&
    typeof candidate.commitTransition === 'function';
}

/** Refuse a granular store before a handler can run or reserve a replay identity. */
export function requireSagaAtomicStore(store: SagaStorePort): SagaTransitionStore {
  if (!isSagaAtomicStore(store)) {
    throw new TypeError(`Saga store ${store.id} lacks atomic state and replay capability.`);
  }
  return store;
}

/** Test the complete atomic capability without accessing storage. */
export function isSagaTransitionStore(
  store: SagaStorePort | undefined,
): store is SagaTransitionStore {
  const candidate = store as Partial<SagaTransitionStore> | undefined;
  return candidate?.transitionCommitCapabilities?.transitionOutbox === 'same_commit' &&
    candidate.transitionCommitCapabilities.optimisticVersion === true &&
    candidate.transitionCommitCapabilities.replay === 'same_commit' &&
    typeof candidate.commitTransition === 'function';
}

/** Refuse unsupported composition before handler execution or store access. */
export function requireSagaTransitionStore(store: SagaStorePort | undefined): SagaTransitionStore {
  if (!isSagaTransitionStore(store)) {
    throw new TypeError(
      `Saga store ${
        store?.id ?? '(missing)'
      } lacks atomic transition/outbox and replay capability.`,
    );
  }
  return store;
}

export type { StoredCommandOutbox } from '@netscript/database/commands';
