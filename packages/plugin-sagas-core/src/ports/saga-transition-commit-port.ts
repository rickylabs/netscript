import type { StoredCommandOutbox } from '@netscript/database/commands';
import type { SagaStateEnvelope, SagaTransitionRecord } from '../domain/mod.ts';
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

/** Explicit same-commit transition, replay marker and command-outbox capability. */
export interface SagaTransitionCommitPort {
  /** Adapter guarantees; absence refuses durable worker composition. */
  readonly transitionCommitCapabilities: Readonly<{
    transitionOutbox: 'same_commit';
    optimisticVersion: true;
    replay: 'same_commit';
  }>;
  /** Commit all request rows or none; version zero requires an absent initial state. */
  commitTransition(
    request: SagaTransitionCommitRequest,
    signal?: AbortSignal,
  ): Promise<SagaTransitionCommitResult>;
}

/** Read/legacy store with the explicit atomic transition capability. */
export type SagaTransitionStore = SagaStorePort & SagaTransitionCommitPort;

/** Refuse unsupported composition before handler execution or store access. */
export function requireSagaTransitionStore(store: SagaStorePort | undefined): SagaTransitionStore {
  const candidate = store as Partial<SagaTransitionStore> | undefined;
  if (
    candidate?.transitionCommitCapabilities?.transitionOutbox !== 'same_commit' ||
    candidate.transitionCommitCapabilities.optimisticVersion !== true ||
    candidate.transitionCommitCapabilities.replay !== 'same_commit' ||
    typeof candidate.commitTransition !== 'function'
  ) {
    throw new TypeError(
      `Saga store ${
        store?.id ?? '(missing)'
      } lacks atomic transition/outbox and replay capability.`,
    );
  }
  return candidate as SagaTransitionStore;
}

export type { StoredCommandOutbox } from '@netscript/database/commands';
