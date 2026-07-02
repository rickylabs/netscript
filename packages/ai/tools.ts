/**
 * @module @netscript/ai/tools
 *
 * The `@netscript/ai` tool system: define server-executable (or client-deferred)
 * tools, validate their input with **Standard Schema**, and register/dispatch
 * them through an in-memory registry that satisfies E1's `ToolRegistryPort`.
 *
 * The core wraps `StandardSchemaV1` for validation — bring any conforming schema
 * (zod, valibot, arktype, or a hand-written one) as a tool's `.input(...)`. It
 * adds no schema DSL and takes no `@netscript/*` runtime dependency.
 *
 * It also ships the built-in {@linkcode renderUiTool} — the `render_ui` **wire
 * contract** (input schema + metadata only, no renderer) that the fresh-ui
 * generative-UI slice consumes.
 *
 * @example Define, register, and dispatch a server tool
 * ```ts
 * import { createToolRegistry, defineAiTool } from "@netscript/ai/tools";
 *
 * const add = defineAiTool("add")
 *   .parameters({
 *     type: "object",
 *     properties: { a: { type: "number" }, b: { type: "number" } },
 *     required: ["a", "b"],
 *   })
 *   .input(myAddSchema) // any StandardSchemaV1<unknown, { a: number; b: number }>
 *   .server(({ a, b }) => ({ sum: a + b }));
 *
 * const registry = createToolRegistry([add]);
 * const { output } = await registry.dispatch("add", { a: 2, b: 3 });
 * ```
 *
 * @example Register the built-in render_ui wire contract
 * ```ts
 * import { createToolRegistry, renderUiTool } from "@netscript/ai/tools";
 *
 * const registry = createToolRegistry([renderUiTool]);
 * const result = await registry.dispatch("render_ui", { component: "Chart", props: { data: [] } });
 * // result.deferred === true — no renderer runs in the core.
 * ```
 */

export {
  type AiToolBuilder,
  type AiToolBuilderWithInput,
  defineAiTool,
} from './src/tools/application/builder.ts';
export type {
  AiToolDefinition,
  AiToolExecutionKind,
  AiToolExecutionResult,
  AiToolInvocationContext,
  AiToolServerHandler,
} from './src/tools/domain/definition.ts';
export { createToolRegistry } from './src/tools/adapters/in-memory-registry.ts';
export type { AiToolRegistry } from './src/tools/application/registry.ts';
export type { ToolHandler, ToolRegistryPort } from './src/ports/tool-registry.ts';
export { renderUiTool } from './src/tools/application/render-ui.ts';
export type { RenderUiToolInput } from './src/tools/domain/render-ui.ts';
export { type ToolInputIssue, ToolInputValidationError } from './src/contracts/errors.ts';
