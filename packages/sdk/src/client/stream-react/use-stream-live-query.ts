import { useLiveQuery } from '@tanstack/react-db';
import { isCollection, isSingleResultCollection } from '@tanstack/db';
import type { Collection } from '@tanstack/db';
import { useSyncExternalStore } from 'react';
import type { StreamCollectionV1 } from '../stream-collection/mod.ts';

/** Reactive rows and readiness returned by the React Native stream hook. */
export interface StreamLiveQueryResultV1<TData extends object> {
  /** Current rows, updated directly by stream sync writes. */
  readonly data: TData[];
  /** Upstream collection status, or error after a terminal stream failure. */
  readonly status: string;
  /** True until the initial stream control marks the collection ready. */
  readonly isLoading: boolean;
  /** Terminal source or entity-validation failure; observe done for the original rejection. */
  readonly error: Error | undefined;
}

/**
 * Subscribe a React or React Native component to a NetScript stream collection.
 *
 * Uses TanStack's collection live-query overload, shared with the web query engine.
 * Call inside a React component with a collection returned by createStreamCollectionV1.
 * The hook detaches its subscription on unmount; the binding's owner disposes the stream.
 * A terminal failure disables the upstream query and returns the stored error with
 * `status: 'error'` and `isLoading: false`, including on a later remount.
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
  const errorUtils = collection.utils;
  if (!isCollection(collection) || isSingleResultCollection(collection)) {
    throw new TypeError('Expected a NetScript stream collection');
  }
  const queryCollection: Collection<TData, string> = collection;
  const error = useSyncExternalStore(errorUtils.subscribeError, errorUtils.getError);
  // A failed collection has been cleaned up. Disable its upstream query rather
  // than letting a remount restart the single-use cancelled source.
  const result = useLiveQuery(() => error ? undefined : queryCollection, [collection, error]);
  return {
    data: result.data ?? [],
    status: error ? 'error' : result.status,
    isLoading: error ? false : result.isLoading,
    error,
  };
}
