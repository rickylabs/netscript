/**
 * @module @netscript/ai
 *
 * Zero-dependency AI engine core for NetScript.
 *
 * The root entrypoint is the **composition root**: {@linkcode createAiRuntime}
 * (factory injection of the capability ports, Axiom A10) and
 * {@linkcode getAiRuntime} (a `getKv()`-shaped process singleton), plus the
 * **model registry** — {@linkcode registerModelProvider} /
 * {@linkcode getModelProvider} / {@linkcode getModel} — the self-registration
 * seam that provider packages (E2) opt into by import.
 *
 * The domain vocabulary lives on `@netscript/ai/contracts`, the capability seams
 * and their defaults on `@netscript/ai/ports`, and fakes for downstream unit
 * tests on `@netscript/ai/testing`. This core takes **no** `@netscript/*` runtime
 * dependency.
 *
 * @example Compose a runtime and read a no-op default
 * ```ts
 * import { createAiRuntime } from "@netscript/ai";
 *
 * const ai = createAiRuntime();
 * // Telemetry defaults to a no-op port — safe to call with nothing wired.
 * ai.telemetry.recordEvent("agent.start");
 * ```
 *
 * @example Register a provider and resolve a model
 * ```ts
 * import { getModel, registerModelProvider } from "@netscript/ai";
 *
 * registerModelProvider("demo", () => ({
 *   id: "demo",
 *   listModels: () => Promise.resolve([]),
 *   getModel: (id) =>
 *     Promise.resolve({ providerId: "demo", descriptor: { id, provider: "demo" } }),
 *   supports: () => true,
 * }));
 *
 * const handle = await getModel("demo:some-model");
 * ```
 */

export {
  createAiRuntime,
  getAiRuntime,
  isAiRuntimeInitialized,
  resetAiRuntime,
} from './src/runtime/mod.ts';
export type { AiRuntime, AiRuntimeConfig } from './src/runtime/mod.ts';

export {
  getModel,
  getModelProvider,
  listModelProviders,
  registerModelProvider,
  resetModelRegistry,
} from './src/ports/model-provider.ts';
export type { ModelProviderConfig, ModelProviderPort } from './src/ports/model-provider.ts';
export {
  getEmbeddingProvider,
  getVisionProvider,
  listEmbeddingProviders,
  listVisionProviders,
  registerEmbeddingProvider,
  registerVisionProvider,
  resetEmbeddingRegistry,
  resetVisionRegistry,
} from './src/ports/mod.ts';
export type {
  EmbeddingProviderConfig,
  EmbeddingProviderPort,
  VisionProviderConfig,
  VisionProviderPort,
} from './src/ports/mod.ts';

export type { ModelHandle, ModelRef } from './src/contracts/model.ts';
export {
  composeSystemPrompt,
  DuplicatePromptSectionError,
  PromptAssembler,
  SYSTEM_PROMPT_SECTION_SEPARATOR,
} from './src/contracts/prompt.ts';
export type { PromptSection } from './src/contracts/prompt.ts';
export {
  AiError,
  AiNotConfiguredError,
  ModelProviderNotFoundError,
} from './src/contracts/errors.ts';
