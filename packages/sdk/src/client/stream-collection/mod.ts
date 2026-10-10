/**
 * DOM-independent TanStack DB materialization for injected durable-stream fetches.
 * @module
 */
export { createStreamCollectionV1 } from './application/create-stream-collection.ts';
export type {
  StreamCollectionBindingV1,
  StreamCollectionChangeV1,
  StreamCollectionOptionsV1,
  StreamCollectionSubscriptionV1,
  StreamCollectionUtilsV1,
  StreamCollectionV1,
} from './ports/stream-collection.ts';
// Consumer type closure for transport options and replay state.
export type * from '../stream-source/mod.ts';
