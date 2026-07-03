/** Type-checked source stub for the generated AI models starter.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/**
 * Starter provider + model-id constants. App-owned: edit these to pin the
 * providers and models your app uses. Model refs are `provider:model-id` strings
 * resolved by `@netscript/ai`'s `getModel`.
 */
export const modelsStub: StubSource<never> = defineStub({
  source: `/** Provider + model registry for this app's AI features. App-owned — edit freely. */

/** Provider ids self-registered by the \`@netscript/ai\` provider subpaths. */
export const AI_PROVIDERS = {
  anthropic: 'anthropic',
  openaiCompatible: 'openai-compatible',
} as const;

/** Default \`provider:model-id\` refs resolved by \`@netscript/ai\` \`getModel\`. */
export const AI_MODELS = {
  chat: 'anthropic:claude-sonnet-4-5',
  fast: 'anthropic:claude-haiku-4-5',
} as const;

/** The default chat model ref used by the generated chat route. */
export const DEFAULT_CHAT_MODEL: string = AI_MODELS.chat;
`,
  tokens: [],
});
