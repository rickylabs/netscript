/**
 * `createToolRegistry` — the default in-memory {@link AiToolRegistry}.
 *
 * Holds tool definitions and plain descriptor/handler registrations in a single
 * name-keyed map, satisfies E1's {@link ToolRegistryPort}, and dispatches
 * definitions with Standard-Schema-validated input. A definition's port-facing
 * {@link ToolHandler} is bridged from its validated `execute`, so the agent loop
 * can drive E4 tools through the existing port with no special-casing.
 *
 * @module
 */

import type { ToolCall, ToolDescriptor, ToolResult } from '../../contracts/tool.ts';
import { ToolNotFoundError } from '../../contracts/errors.ts';
import type { ToolHandler } from '../../ports/tool-registry.ts';
import type {
  AiToolDefinition,
  AiToolExecutionResult,
  AiToolInvocationContext,
} from '../domain/definition.ts';
import type { AiToolRegistry } from '../application/registry.ts';

interface RegistryEntry {
  readonly descriptor: ToolDescriptor;
  readonly definition?: AiToolDefinition;
  readonly handler?: ToolHandler;
}

/** Turn a validated execution result into the port's {@link ToolResult} shape. */
function toToolResult(toolCallId: string, result: AiToolExecutionResult): ToolResult {
  const payload = result.deferred ? result.input : result.output ?? result.input;
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return { toolCallId, content, state: 'complete' };
}

/** Bridge a rich definition to a port {@link ToolHandler}. */
function bridgeHandler(definition: AiToolDefinition): ToolHandler {
  return async (call: ToolCall): Promise<ToolResult> => {
    const rawInput: unknown = call.arguments ? JSON.parse(call.arguments) : {};
    const result = await definition.execute(rawInput, { toolCallId: call.id });
    return toToolResult(call.id, result);
  };
}

/**
 * Create an in-memory {@link AiToolRegistry}, optionally seeded with `definitions`
 * (e.g. `[renderUiTool]`).
 *
 * @example
 * ```ts
 * import { createToolRegistry, renderUiTool } from "@netscript/ai/tools";
 *
 * const registry = createToolRegistry([renderUiTool]);
 * const result = await registry.dispatch("render_ui", { component: "Chart" });
 * // result.deferred === true — validated input round-trips to the renderer.
 * ```
 */
export function createToolRegistry(
  definitions: readonly AiToolDefinition[] = [],
): AiToolRegistry {
  const entries = new Map<string, RegistryEntry>();

  for (const definition of definitions) {
    entries.set(definition.descriptor.name, { descriptor: definition.descriptor, definition });
  }

  return {
    register(tool: ToolDescriptor, handler?: ToolHandler): void {
      entries.set(tool.name, { descriptor: tool, ...(handler ? { handler } : {}) });
    },
    define(definition: AiToolDefinition): void {
      entries.set(definition.descriptor.name, {
        descriptor: definition.descriptor,
        definition,
      });
    },
    has(name: string): boolean {
      return entries.has(name);
    },
    get(name: string): ToolDescriptor | undefined {
      return entries.get(name)?.descriptor;
    },
    getDefinition(name: string): AiToolDefinition | undefined {
      return entries.get(name)?.definition;
    },
    list(): readonly ToolDescriptor[] {
      return [...entries.values()].map((entry) => entry.descriptor);
    },
    listDefinitions(): readonly AiToolDefinition[] {
      return [...entries.values()]
        .map((entry) => entry.definition)
        .filter((definition): definition is AiToolDefinition => definition !== undefined);
    },
    resolveHandler(name: string): ToolHandler | undefined {
      const entry = entries.get(name);
      if (entry === undefined) {
        return undefined;
      }
      if (entry.handler !== undefined) {
        return entry.handler;
      }
      return entry.definition ? bridgeHandler(entry.definition) : undefined;
    },
    dispatch(
      name: string,
      input: unknown,
      context?: AiToolInvocationContext,
    ): Promise<AiToolExecutionResult> {
      const definition = entries.get(name)?.definition;
      if (definition === undefined) {
        return Promise.reject(new ToolNotFoundError(name));
      }
      return definition.execute(input, context);
    },
  };
}
