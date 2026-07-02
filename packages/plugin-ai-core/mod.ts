/**
 * @module @netscript/plugin-ai-core
 *
 * Contract-only core for the NetScript AI plugin: the oRPC `/v1/ai` route
 * surface (`chat`, `models`, `tools/:name`, `embed`, `transcribe`) plus the
 * mandatory `describe` capabilities route, with zero service implementation.
 *
 * The `chat` route is SSE-framed: its output is an event-iterator of streamed
 * chat chunks (aligned with the `@netscript/ai` engine's `AgentChunk` union), so
 * a connector cannot silently degrade the durable-CHAT stream to a single
 * buffered response. A connector (P2) binds this contract to a host via
 * `aiContractV1.$context<Ctx>()`, and the `@netscript/fresh/ai` client generates
 * a typed caller from `aiContract`.
 *
 * The complete IO surface (Zod `*Schema` validators and the engine-derived
 * vocabulary types) is exposed on the `./contracts/v1` subpath.
 *
 * @example Bind the contract in a connector
 * ```ts
 * import { aiContractV1 } from "@netscript/plugin-ai-core";
 *
 * const router = aiContractV1.$context<{ requestId: string }>();
 * // router.chat.handler(async function* ({ input }) { yield { type: "text", delta: "hi" }; });
 * ```
 *
 * @example Validate a streamed chat chunk with the v1 subpath schemas
 * ```ts
 * import { ChatChunkSchema } from "@netscript/plugin-ai-core/contracts/v1";
 *
 * const chunk = ChatChunkSchema.parse({ type: "text", delta: "hello" });
 * console.log(chunk.type);
 * ```
 */

export * from './src/public/mod.ts';
