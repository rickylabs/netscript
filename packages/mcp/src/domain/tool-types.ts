import type { ToolSchema } from './schema.ts';

/** Stable v1 MCP tool names. */
export const TOOL_NAMES = [
  'get_app_status',
  'list_runs',
  'get_run',
  'get_recent_errors',
  'get_last_job_result',
  'analyze_service_performance',
  'analyze_db_bottlenecks',
  'doctor',
  'search_docs',
  'list_docs',
  'get_doc',
  'list_commands',
  'execute_command',
] as const;

/** Name of a registered v1 tool. */
export type ToolName = (typeof TOOL_NAMES)[number];

/** Safety classification for a tool. */
export type ToolKind = 'read' | 'mutate' | 'meta';

/** Successful flow result. */
export interface ToolSuccess {
  /** Success discriminator. */
  readonly ok: true;
  /** Structured successful value. */
  readonly value: unknown;
}

/** Structured error details returned by a tool flow. */
export interface ToolError {
  /** Stable machine-readable error code. */ readonly code: string;
  /** Bounded human-readable message. */ readonly message: string;
  /** Optional lifecycle state such as planned. */ readonly status?: string;
}

/** Structured flow error. */
export interface ToolFailure {
  /** Failure discriminator. */
  readonly ok: false;
  /** Structured failure details. */
  readonly error: ToolError;
}

/** Result produced by every tool flow. */
export type ToolExecutionResult = ToolSuccess | ToolFailure;

/** Executable application flow referenced by registry data. */
export type ToolFlow = (input: unknown) => Promise<ToolExecutionResult>;

/** Enumerable definition for one MCP tool. */
export interface ToolDefinition {
  /** Stable tool name. */
  readonly name: ToolName;
  /** Token-disciplined tool description. */
  readonly description: string;
  /** Safety classification. */
  readonly kind: ToolKind;
  /** Runtime input contract. */
  readonly inputSchema: ToolSchema<unknown>;
  /** Runtime output contract. */
  readonly outputSchema: ToolSchema<unknown>;
  /** Application flow reference. */
  readonly flow: ToolFlow;
}
