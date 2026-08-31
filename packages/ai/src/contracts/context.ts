/**
 * Request-local application context — the **provider-invisible** channel.
 *
 * A {@linkcode RequestContext} carries state that belongs to *one* chat run and
 * must never become part of what the model reads: freshly-ingested document
 * ids, the tenant/auth subject, a correlation id, feature flags. It rides
 * alongside the transcript rather than inside it, so nothing an application
 * needs to hand its own server code can be re-interpreted by a model as
 * instructions.
 *
 * The value is opaque to `@netscript/ai`: the engine never reads a key, never
 * serializes it into `messages`, `system`, `tools`, or `modelOptions`, and never
 * hands it to a provider transport. It is delivered to exactly two consumers:
 *
 * - **TanStack AI's `chat({ context, metadata })`** — surfaced to middleware and
 *   server tools (`context`) and to middleware/devtools (`metadata`). TanStack
 *   documents that adapters never forward `metadata` onto the provider wire
 *   request.
 * - **Tool handlers** — the agent loop passes it to
 *   {@linkcode import('../ports/tool-registry.ts').ToolHandler} as
 *   `ToolInvocationOptions.context`, which the definition registry lands on
 *   `AiToolInvocationContext.metadata`.
 *
 * The contrast is {@linkcode import('./generation.ts').GenerationOptions} — that
 * type *is* a path to the provider (`providerOptions` merges verbatim into the
 * adapter's `modelOptions`). Anything the model must not see belongs here
 * instead.
 *
 * @module
 */

/**
 * Opaque, request-local application state attached to one run.
 *
 * Keys and values are the application's own vocabulary; the engine only moves
 * the bag around. Values must be structured-clone/JSON friendly if the host
 * transports the context across a process boundary — the engine itself imposes
 * no such constraint and performs no serialization.
 *
 * @example Attach app state to a run
 * ```ts
 * import { createAgentLoop } from "@netscript/ai/agent";
 *
 * const loop = createAgentLoop({ modelProvider, tools });
 * for await (
 *   const chunk of loop.run({
 *     model: "anthropic:claude-sonnet-4-5",
 *     messages: [{ role: "user", content: "Summarize what I just uploaded." }],
 *     // Reaches middleware and tool handlers; never the model.
 *     context: { documentIds: ["doc_41", "doc_42"], tenantId: "acme" },
 *   })
 * ) {
 *   if (chunk.type === "done") break;
 * }
 * ```
 */
export type RequestContext = Readonly<Record<string, unknown>>;
