/**
 * Bridge layer for kvdex integration with `@netscript/kv`.
 *
 * Re-exports the kvdex factory, the `WatchableKvBridge` adapter, and all
 * kvdex-compatible types so that consumers can import everything from a single
 * entrypoint.
 *
 * @module
 */

export {
  type DenoAtomicCheck,
  type DenoAtomicOperation,
  type DenoKvCommitError,
  type DenoKvCommitResult,
  type DenoKvEnqueueOptions,
  type DenoKvEntryMaybe,
  type DenoKvGetOptions,
  type DenoKvKeyPart,
  type DenoKvListIterator,
  type DenoKvListOptions,
  type DenoKvListSelector,
  type DenoKvSetOptions,
  type DenoKvStrictKey,
  type DenoKvWatchOptions,
  WatchableKvBridge,
} from './denokv-bridge.ts';

export {
  createNetscriptDb,
  type CreateNetscriptDbOptions,
  type KvdexSchema,
  type KvProvider,
} from './kvdex.ts';
