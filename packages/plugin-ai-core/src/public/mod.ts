/**
 * Curated root exports for `@netscript/plugin-ai-core`.
 *
 * The root surface is the contract handles plus the route IO and capability
 * types — the symbols a typical consumer imports. The complete IO surface (the
 * Zod `*Schema` validators a connector wires and the engine-derived vocabulary
 * re-exports) lives on the `@netscript/plugin-ai-core/contracts/v1` subpath, so
 * the root stays within the ≤20-export budget.
 *
 * @module
 */

export { aiContract, aiContractV1 } from '../contracts/v1/mod.ts';
export { createAiRouter } from '../router/ai-router.ts';
export type {
  AiRouteHandler,
  AiRouterContext,
  AiRouterImplementation,
  BoundAiRoute,
  BoundAiRouter,
  ContextualAiRouter,
} from '../router/ai-router.ts';
export type {
  AiCapabilities,
  AiContract,
  AiContractDefinition,
  AiContractV1,
  AiRouter,
  ChatChunk,
  ChatInput,
  EmbedInput,
  EmbedResponse,
  ModelsResponse,
  ToolInvokeInput,
  ToolInvokeResponse,
  TranscribeInput,
  TranscribeResponse,
} from '../contracts/v1/mod.ts';
