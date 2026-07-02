/**
 * Tool / function-calling contract types.
 *
 * The core describes tools structurally with raw JSON Schema so it stays free
 * of any validator dependency (Zod, Standard Schema, etc.). Provider adapters
 * (E2) and the plugin surface (P1/P2) are free to compile richer schema objects
 * down to {@linkcode ToolDescriptor} at their edge.
 *
 * @module
 */

import type { MessageContent } from './content.ts';

/**
 * A raw JSON Schema object. Kept open (`unknown`-valued) so callers can supply
 * any JSON-Schema-shaped description without a schema-library dependency.
 */
export interface JsonSchema {
  /** Arbitrary JSON Schema keywords. */
  readonly [key: string]: unknown;
}

/**
 * The `object`-typed JSON Schema describing a tool's input arguments.
 */
export interface ToolParameters {
  /** Always `object` — tool arguments are a keyed record. */
  readonly type: 'object';
  /** Schema for each named argument. */
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  /** Names of required arguments. */
  readonly required?: readonly string[];
  /** Additional JSON Schema keywords (e.g. `additionalProperties`). */
  readonly [key: string]: unknown;
}

/**
 * Provider-agnostic description of a callable tool. Behavior (execution) is
 * supplied out of band via a `ToolRegistryPort` handler.
 */
export interface ToolDescriptor {
  /** Unique tool name the model uses to call it. */
  readonly name: string;
  /** Human-/model-readable description of what the tool does. */
  readonly description?: string;
  /** JSON-Schema input contract for the tool arguments. */
  readonly parameters: ToolParameters;
}

/**
 * Lifecycle state of a tool call as it streams through the agent loop.
 */
export type ToolCallState =
  | 'input-streaming'
  | 'input-complete'
  | 'approval-requested'
  | 'complete'
  | 'error';

/**
 * A model-emitted request to invoke a tool. `arguments` is the raw JSON string
 * as produced by the provider (aligns with `@tanstack/ai`'s tool-call part) so
 * partial/streamed argument buffers round-trip without loss.
 */
export interface ToolCall {
  /** Provider-assigned call id, correlated with its result. */
  readonly id: string;
  /** Name of the tool to invoke. */
  readonly name: string;
  /** Raw JSON-encoded arguments string. */
  readonly arguments: string;
  /** Streaming lifecycle state, when tracked. */
  readonly state?: ToolCallState;
}

/**
 * Terminal state of a tool result.
 */
export type ToolResultState = 'complete' | 'error';

/**
 * The outcome of executing a {@linkcode ToolCall}, fed back into the loop as a
 * `tool`-role message.
 */
export interface ToolResult {
  /** Id of the {@linkcode ToolCall} this result answers. */
  readonly toolCallId: string;
  /** The result payload — text or multimodal parts. */
  readonly content: MessageContent;
  /** Terminal state, when tracked. */
  readonly state?: ToolResultState;
  /** Error message when the tool failed. */
  readonly error?: string;
}
