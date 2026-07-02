/**
 * {@linkcode AiToolRegistry} — the tool-registry capability widened for the E4
 * tool system.
 *
 * It extends E1's {@link ToolRegistryPort} (register / has / get / list /
 * resolveHandler) with definition-aware registration and validated
 * dispatch-by-name, so any registry — the in-memory default here or a future
 * MCP-backed one — substitutes at the same seam without touching call sites.
 *
 * @module
 */

import type { ToolRegistryPort } from '../../ports/tool-registry.ts';
import type {
  AiToolDefinition,
  AiToolExecutionResult,
  AiToolInvocationContext,
} from '../domain/definition.ts';

/**
 * A {@link ToolRegistryPort} that also holds rich {@link AiToolDefinition}s and
 * can dispatch them with Standard-Schema-validated input.
 */
export interface AiToolRegistry extends ToolRegistryPort {
  /** Register a rich tool definition (also exposed via the port's descriptor views). */
  define(definition: AiToolDefinition): void;
  /** Resolve a registered definition by name, if present. */
  getDefinition(name: string): AiToolDefinition | undefined;
  /** All registered tool definitions. */
  listDefinitions(): readonly AiToolDefinition[];
  /**
   * Validate `input` against the named tool's Standard Schema and execute it.
   * Rejects with `ToolNotFoundError` for an unregistered name and
   * `ToolInputValidationError` when validation fails (before any handler runs).
   */
  dispatch(
    name: string,
    input: unknown,
    context?: AiToolInvocationContext,
  ): Promise<AiToolExecutionResult>;
}
