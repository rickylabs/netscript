import type {
  FetchStreamEventSourceOptionsV1,
  StreamSseReplayStateV1,
} from '../../stream-source/mod.ts';

/** One upstream sync change delivered to collection observers. */
export interface StreamCollectionChangeV1<T extends object> {
  /** Row operation applied by the sync transaction. */
  readonly type: 'insert' | 'update' | 'delete';
  /** Entity primary key. */
  readonly key: string | number;
  /** Entity state; delete changes carry the removed row. */
  readonly value: T;
}

/** Subscription owned by its caller. */
export interface StreamCollectionSubscriptionV1 {
  /** Detach this observer. */
  unsubscribe(): void;
}

/** Stream-specific diagnostics attached through TanStack's adapter utility seam. */
export type StreamCollectionUtilsV1 = {
  /** Read the terminal consumption failure, if any. */
  getError(): Error | undefined;
  /** Observe a terminal failure; returns an unsubscribe function. */
  subscribeError(listener: () => void): () => void;
};

/**
 * Typed SDK read/lifecycle port over a real TanStack DB collection.
 * Narrow with TanStack's isCollection guard before using its query-builder API.
 * Cleanup is terminal; create a fresh binding before subscribing again.
 */
export interface StreamCollectionV1<T extends object> {
  /** Collection identifier. */
  readonly id: string;
  /** Upstream sync status. Fatal failures transition to cleaned-up. */
  readonly status: string;
  /** Stream-specific terminal-error utilities. */
  readonly utils: StreamCollectionUtilsV1;
  /** Number of currently materialized rows. */
  readonly size: number;
  /** Number of active observers, including live queries. */
  readonly subscriberCount: number;
  /** Snapshot all materialized rows. */
  readonly toArray: T[];
  /** Read one row by primary key. */
  get(key: string): T | undefined;
  /** Test for an existing row. */
  has(key: string): boolean;
  /** Wait for initial readiness, rejecting on a fatal stream failure. */
  preload(): Promise<void>;
  /** Subscribe to direct sync changes. */
  subscribeChanges(
    listener: (changes: StreamCollectionChangeV1<T>[]) => void,
  ): StreamCollectionSubscriptionV1;
  /** Release the collection. This single-use binding cannot be restarted. */
  cleanup(): Promise<void>;
}

/** Typed collection configuration over the existing injected stream transport. */
export interface StreamCollectionOptionsV1<T extends object>
  extends FetchStreamEventSourceOptionsV1 {
  /** State Protocol type to materialize; other types are ignored. */
  readonly type: string;
  /** Validate a full entity before any writes in its batch. Throw on invalid data. */
  readonly parse: (value: unknown) => T;
  /** Extract the primary key; it must agree with the wire key. */
  readonly getKey: (value: T) => string;
}

/** Stream connection and its stable reactive collection. */
export interface StreamCollectionBindingV1<T extends object> {
  /** Read-only server state; local mutations have no persistence handler. */
  readonly collection: StreamCollectionV1<T>;
  /** Resolves on cancellation/terminal close, rejects on invalid entities or subscriber failures. */
  readonly done: Promise<void>;
  /** Last control-committed replay state. */
  readonly snapshot: () => StreamSseReplayStateV1;
  /** Cancel the source, detach listeners, and release the collection. Idempotent. */
  readonly dispose: () => Promise<void>;
}
