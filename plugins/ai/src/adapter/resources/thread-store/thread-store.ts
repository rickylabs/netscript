/** Opt-in AI thread-store scaffolder (`--persist-threads`).
 *
 * @module
 */

import {
  type ItemScaffolder,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { type AiResourceInput, parseResourceInput } from '../input.ts';
import { threadStoreStub } from './thread-store.stub.ts';

/** Default input for the opt-in thread-store resource. */
export const DEFAULT_THREAD_STORE_INPUT: AiResourceInput = { id: 'thread-store' };

/**
 * Emits the app-owned `ai/thread-store.ts` persistence port + starter Deno.Kv
 * store. Opt-in via `--persist-threads`; NOT part of the default install set, so
 * apps that do not want durable threads never receive a bundled store.
 */
export const threadStoreScaffolder: ItemScaffolder<AiResourceInput> = {
  name: 'thread-store',
  emit(_input: AiResourceInput): readonly ScaffoldArtifact[] {
    return [textArtifact('ai/thread-store.ts', substituteTokens(threadStoreStub, {}))];
  },
};

/** AI thread-store plugin resource descriptor (opt-in, add-only). */
export const threadStoreResource: PluginResource<AiResourceInput> = {
  name: 'thread-store',
  scaffolder: threadStoreScaffolder,
  defaultInput: DEFAULT_THREAD_STORE_INPUT,
  parseInput: parseResourceInput,
};
