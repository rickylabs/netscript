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
import { createToolRegistry } from '@netscript/ai/tools';
// Side-effect import: registers the 'anthropic' provider on the model registry.
import '@netscript/ai/anthropic';
import { DEFAULT_CHAT_MODEL } from './models.ts';
import { echoTool } from './tools/echo.ts';

let runtime: AiRuntime | undefined;

/** Provider id parsed from the app-owned default chat model ref. */
export const DEFAULT_CHAT_PROVIDER: string = DEFAULT_CHAT_MODEL.split(':')[0] ?? 'anthropic';

/** App-owned AI tool registry consumed by the agent loop and /v1/ai/tools/:name. */
export const aiTools = createToolRegistry([echoTool]);

/** Get (or lazily create) the app-wide AI runtime. */
export function ai(): AiRuntime {
  if (!isAiRuntimeInitialized()) {
    runtime = createAiRuntime({
      defaultModelProvider: DEFAULT_CHAT_PROVIDER,
      tools: aiTools,
    });
  }
  return runtime ??
    createAiRuntime({ defaultModelProvider: DEFAULT_CHAT_PROVIDER, tools: aiTools });
}

/** Resolve a configured model handle by \`provider:model-id\` ref. */
export async function chatModel(ref: string = DEFAULT_CHAT_MODEL): Promise<ModelHandle> {
  return await getModel(ref);
}

/** Resolve the chat model id portion from a \`provider:model-id\` ref. */
export function chatModelId(ref: string = DEFAULT_CHAT_MODEL): string {
  return ref.includes(':') ? ref.slice(ref.indexOf(':') + 1) : ref;
}

export { DEFAULT_CHAT_MODEL } from './models.ts';
export { AI_MODELS, AI_PROVIDERS } from './models.ts';
`,
  tokens: [],
});
