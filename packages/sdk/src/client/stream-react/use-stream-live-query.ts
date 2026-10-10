import { useLiveQuery } from '@tanstack/react-db';
import { isCollection, isSingleResultCollection } from '@tanstack/db';
import type { Collection, NonSingleResult } from '@tanstack/db';
import type { StreamCollectionV1 } from '../stream-collection/mod.ts';

/** Reactive rows and readiness returned by the React Native stream hook. */
export interface StreamLiveQueryResultV1<TData extends object> {
  /** Current rows, updated directly by stream sync writes. */
  readonly data: TData[];
  /** Upstream collection status. */
  readonly status: string;
  /** True until the initial stream control marks the collection ready. */
  readonly isLoading: boolean;
}

/**
 * Subscribe a React or React Native component to a NetScript stream collection.
 *
 * Uses TanStack's collection live-query overload, shared with the web query engine.
 * Call inside a React component with a collection returned by createStreamCollectionV1.
 * The hook detaches its subscription on unmount; the binding's owner disposes the stream.
 *
 * @example
 * ```ts
 * import { useStreamLiveQueryV1 } from '@netscript/sdk/streams/react';
 * import type { StreamCollectionV1 } from '@netscript/sdk/streams/collections';
 * declare const collection: StreamCollectionV1<{ id: string }>;
 * function Tasks() {
 *   const result = useStreamLiveQueryV1(collection);
 *   return String(result.data.length);
 * }
 * ```
 */
export function useStreamLiveQueryV1<TData extends object>(
  collection: StreamCollectionV1<TData>,
): StreamLiveQueryResultV1<TData> {
  // The factory returns a concrete Collection. Match the existing SDK collection
  // boundary: callers see the owned structural port, this adapter uses upstream types.
  if (!isCollection(collection) || isSingleResultCollection(collection)) {
    throw new TypeError('Expected a NetScript stream collection');
  }
  const result = useLiveQuery(collection as Collection<TData, string> & NonSingleResult);
  return { data: result.data, status: result.status, isLoading: result.isLoading };
}
