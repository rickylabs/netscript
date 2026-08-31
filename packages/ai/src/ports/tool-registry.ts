/**
 * Tool registry port.
 *
 * The registry maps tool names to their descriptor and (optionally) an
 * execution handler. The core default is a null-object no-op: it accepts no
 * registrations and resolves nothing — real registries are supplied by the tool
 * slice (E5) or the host application.
 *
 * @module
 */

import type { RequestContext } from '../contracts/context.ts';
import type { ToolCall, ToolDescriptor, ToolResult } from '../contracts/tool.ts';

/**
 * Ambient values the caller (normally the agent loop) supplies for **one**
 * dispatch, alongside the model-emitted {@linkcode ToolCall}. Nothing here comes
 * from the model, and nothing here is sent to one.
 */
export interface ToolInvocationOptions {
  /**
   * Cancellation signal for this dispatch. The agent loop passes the run's
   * combined signal, so a long-running handler can abandon work when the run is
   * stopped.
   */
  readonly signal?: AbortSignal;
  /**
   * The run's {@linkcode RequestContext} — request-local application state the
   * model never saw. The definition-backed registry lands this on
   * `AiToolInvocationContext.metadata`, where a server handler reads it.
   */
  readonly context?: RequestContext;
}

/**
 * Executes a resolved {@linkcode ToolCall} and returns its result. Supplied by
 * whoever registers the tool.
 *
 * `options` is an optional second parameter, so a handler that only cares about
 * the call — `(call) => result` — remains assignable unchanged.
 */
export type ToolHandler = (
  call: ToolCall,
  options?: ToolInvocationOptions,
) => Promise<ToolResult> | ToolResult;

/**
 * The tool registry capability seam.
 */
export interface ToolRegistryPort {
  /** Register a tool descriptor and optional handler. */
  register(tool: ToolDescriptor, handler?: ToolHandler): void;
  /** Remove a registered tool by name, if present. */
  unregister(name: string): void;
  /** Whether a tool with this name is registered. */
  has(name: string): boolean;
  /** Resolve a tool descriptor by name, if present. */
  get(name: string): ToolDescriptor | undefined;
  /** All registered tool descriptors. */
  list(): readonly ToolDescriptor[];
  /** Resolve a tool's execution handler by name, if present. */
  resolveHandler(name: string): ToolHandler | undefined;
}

/**
 * Create the default no-op tool registry: registrations are dropped and every
 * lookup resolves empty. A real in-memory registry lives in the testing surface
 * and the E5 tool slice.
 */
export function createNoopToolRegistry(): ToolRegistryPort {
  return {
    register(): void {},
    unregister(): void {},
    has(): boolean {
      return false;
    },
    get(): ToolDescriptor | undefined {
      return undefined;
    },
    list(): readonly ToolDescriptor[] {
      return [];
    },
    resolveHandler(): ToolHandler | undefined {
      return undefined;
    },
  };
}
