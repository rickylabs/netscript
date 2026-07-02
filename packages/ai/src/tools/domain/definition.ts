/**
 * Tool-definition domain vocabulary for the `@netscript/ai/tools` slice.
 *
 * A {@linkcode AiToolDefinition} bundles the provider-facing
 * {@linkcode ToolDescriptor} (name + JSON-Schema parameters the model sees), the
 * {@linkcode StandardSchemaV1} used to validate raw arguments before execution,
 * and a validated {@linkcode AiToolDefinition.execute} entry point. Definitions
 * are produced by the `defineAiTool` builder; this module declares only their
 * pure type surface (no IO, no builder logic).
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ToolDescriptor } from '../../contracts/tool.ts';

/**
 * Where a tool's behavior runs:
 * - `server` — a handler executes on the server (`defineAiTool(...).server(fn)`).
 * - `client` — no server handler; the validated input is deferred to a
 *   downstream executor such as the fresh-ui generative-UI renderer
 *   (`defineAiTool(...).client()`, e.g. `render_ui`).
 */
export type AiToolExecutionKind = 'server' | 'client';

/**
 * Ambient context handed to a server tool handler at execution time. Every field
 * is optional so the 80% call path (`execute(input)`) needs nothing.
 */
export interface AiToolInvocationContext {
  /** Id of the originating {@link ToolCall}, when dispatched from the agent loop. */
  readonly toolCallId?: string;
  /** Cancellation signal propagated from the caller. */
  readonly signal?: AbortSignal;
  /** Free-form invocation metadata (tracing, tenant, auth subject, …). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * A server tool handler. Receives the already-validated input (the Standard
 * Schema output type) plus an {@linkcode AiToolInvocationContext}, and returns
 * the tool's typed output.
 */
export type AiToolServerHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: AiToolInvocationContext,
) => TOutput | Promise<TOutput>;

/**
 * Outcome of executing a tool definition through validated dispatch.
 *
 * `input` is always the Standard-Schema-validated argument value. For
 * `server`-kind tools `output` carries the handler result and `deferred` is
 * `false`; for `client`-kind tools (e.g. `render_ui`) `output` is absent and
 * `deferred` is `true` — the validated input round-trips to a downstream
 * renderer/executor.
 */
export interface AiToolExecutionResult<TOutput = unknown> {
  /** Name of the executed tool. */
  readonly toolName: string;
  /** Execution kind of the tool that produced this result. */
  readonly kind: AiToolExecutionKind;
  /** The Standard-Schema-validated input value. */
  readonly input: unknown;
  /** Handler output for `server` tools; absent when `deferred`. */
  readonly output?: TOutput;
  /** `true` when no server handler ran and execution is deferred downstream. */
  readonly deferred: boolean;
}

/**
 * A server-executable (or client-deferred) tool definition. Produced by the
 * `defineAiTool` builder; consumed by a {@link AiToolRegistry}. `execute`
 * validates raw input against {@linkcode AiToolDefinition.schema} **before** any
 * handler runs, throwing `ToolInputValidationError` on failure.
 */
export interface AiToolDefinition<TInput = unknown, TOutput = unknown> {
  /** Provider-facing descriptor (name + JSON-Schema parameters). */
  readonly descriptor: ToolDescriptor;
  /** Standard Schema validating raw arguments into the `TInput` value. */
  readonly schema: StandardSchemaV1<unknown, TInput>;
  /** Whether this tool runs a server handler or defers to a client executor. */
  readonly kind: AiToolExecutionKind;
  /**
   * Validate `rawInput` against {@linkcode AiToolDefinition.schema} and, for
   * `server` tools, run the handler. Rejects with `ToolInputValidationError`
   * before the handler is invoked when validation fails.
   */
  execute(
    rawInput: unknown,
    context?: AiToolInvocationContext,
  ): Promise<AiToolExecutionResult<TOutput>>;
}
