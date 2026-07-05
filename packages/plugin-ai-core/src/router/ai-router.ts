/**
 * Contract-bound in-process router helpers for the AI plugin.
 *
 * @module
 */

import { aiContractV1 } from '../contracts/v1/mod.ts';

/**
 * Request context accepted by the generated AI router.
 */
export type AiRouterContext = Record<PropertyKey, unknown>;

export type ContextualAiRouter<TContext extends AiRouterContext> = ReturnType<
  typeof aiContractV1.$context<TContext>
>;

export type AiRouteHandler<
  TContext extends AiRouterContext,
  TRoute extends keyof ContextualAiRouter<TContext>,
> = ContextualAiRouter<TContext>[TRoute] extends { handler: (handler: infer THandler) => unknown }
  ? THandler
  : never;

export type BoundAiRoute<
  TContext extends AiRouterContext,
  TRoute extends keyof ContextualAiRouter<TContext>,
> = ContextualAiRouter<TContext>[TRoute] extends { handler: (...args: never[]) => infer TBound }
  ? TBound
  : never;

/**
 * Handler functions that implement every route in {@linkcode aiContractV1}.
 */
export interface AiRouterImplementation<TContext extends AiRouterContext = Record<string, never>> {
  /** Describe the AI plugin capabilities. */
  readonly describe: AiRouteHandler<TContext, 'describe'>;
  /** Stream chat chunks from the in-process agent loop. */
  readonly chat: AiRouteHandler<TContext, 'chat'>;
  /** List the models exposed by this app's AI runtime. */
  readonly models: AiRouteHandler<TContext, 'models'>;
  /** Invoke one registered tool by name. */
  readonly invokeTool: AiRouteHandler<TContext, 'invokeTool'>;
  /** Produce embeddings for one or more input strings. */
  readonly embed: AiRouteHandler<TContext, 'embed'>;
  /** Transcribe an audio source into text. */
  readonly transcribe: AiRouteHandler<TContext, 'transcribe'>;
}

/**
 * Contract-bound route handlers returned by {@linkcode createAiRouter}.
 */
export interface BoundAiRouter<TContext extends AiRouterContext = Record<string, never>> {
  /** Bound `describe` route handler. */
  readonly describe: BoundAiRoute<TContext, 'describe'>;
  /** Bound streaming `chat` route handler. */
  readonly chat: BoundAiRoute<TContext, 'chat'>;
  /** Bound `models` route handler. */
  readonly models: BoundAiRoute<TContext, 'models'>;
  /** Bound `invokeTool` route handler. */
  readonly invokeTool: BoundAiRoute<TContext, 'invokeTool'>;
  /** Bound `embed` route handler. */
  readonly embed: BoundAiRoute<TContext, 'embed'>;
  /** Bound `transcribe` route handler. */
  readonly transcribe: BoundAiRoute<TContext, 'transcribe'>;
}

/**
 * Bind a complete in-process AI implementation to the v1 contract.
 *
 * @param implementation - Per-route functions for the host app's AI runtime.
 * @returns The oRPC handlers produced by `aiContractV1.$context().<route>.handler(...)`.
 *
 * @example
 * ```ts
 * import { createAiRouter } from "@netscript/plugin-ai-core";
 *
 * const router = createAiRouter({
 *   describe: () => ({ pluginName: "@netscript/plugin-ai", contractVersions: ["v1"], routeGroups: ["ai"], capabilities: ["chat"] }),
 *   async *chat() { yield { type: "done" }; },
 *   models: () => ({ models: [] }),
 *   invokeTool: () => ({ content: "No tools registered.", state: "error" }),
 *   embed: () => ({ embeddings: [] }),
 *   transcribe: () => ({ text: "" }),
 * });
 * ```
 */
export function createAiRouter<TContext extends AiRouterContext = Record<string, never>>(
  implementation: AiRouterImplementation<TContext>,
): BoundAiRouter<TContext> {
  const router = aiContractV1.$context<TContext>();
  return {
    describe: router.describe.handler(implementation.describe),
    chat: router.chat.handler(implementation.chat),
    models: router.models.handler(implementation.models),
    invokeTool: router.invokeTool.handler(implementation.invokeTool),
    embed: router.embed.handler(implementation.embed),
    transcribe: router.transcribe.handler(implementation.transcribe),
  };
}
