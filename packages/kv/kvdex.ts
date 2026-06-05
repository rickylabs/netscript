/**
 * kvdex integration subpath for `@netscript/kv`.
 *
 * Import as `@netscript/kv/kvdex` to access the kvdex bridge factory and
 * re-exported kvdex core APIs (`kvdex`, `collection`, `model`).
 *
 * @module
 */

export {
  createNetscriptDb,
  type CreateNetscriptDbOptions,
  type KvdexSchema,
  type KvProvider,
} from './bridges/kvdex.ts';

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
} from './bridges/denokv-bridge.ts';

export { collection, kvdex, model } from '@olli/kvdex';
export type { KvObject } from '@olli/kvdex';
