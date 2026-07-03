/** Type-checked source stub for the generated AI runtime barrel.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/**
 * The app's AI composition root. Imports the installed `@netscript/ai` engine
 * and a provider adapter (self-registering via side effect), constructs the
 * runtime once, and re-exports the configured client + model resolver. This is
 * the single wiring seam every other generated AI file imports from.
 */
export const barrelStub: StubSource<never> = defineStub({
  source: `/** App AI composition root. Wires @netscript/ai once and re-exports the client. */

import {
  createAiRuntime,
  getModel,
  isAiRuntimeInitialized,
  type AiRuntime,
  type ModelHandle,
} from '@netscript/ai';
// Side-effect import: registers the 'anthropic' provider on the model registry.
import '@netscript/ai/anthropic';
import { DEFAULT_CHAT_MODEL } from './models.ts';

let runtime: AiRuntime | undefined;

/** Get (or lazily create) the app-wide AI runtime. */
export function ai(): AiRuntime {
  if (!isAiRuntimeInitialized()) {
    runtime = createAiRuntime({ defaultModel: DEFAULT_CHAT_MODEL });
  }
  return runtime ?? createAiRuntime({ defaultModel: DEFAULT_CHAT_MODEL });
}

/** Resolve a configured model handle by \`provider:model-id\` ref. */
export function chatModel(ref: string = DEFAULT_CHAT_MODEL): ModelHandle {
  return getModel(ref);
}

export { DEFAULT_CHAT_MODEL } from './models.ts';
export { AI_MODELS, AI_PROVIDERS } from './models.ts';
`,
  tokens: [],
});
