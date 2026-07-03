/**
 * `@netscript/fresh/ai/sandbox` — MCP `ui://` sandbox helpers.
 *
 * This subpath keeps the MCP sandbox surface cohesive and keeps the main
 * `@netscript/fresh/ai` chat-session surface within the F-5 export cap. It
 * includes the route handler for serving themed `ui://` resources plus the
 * older chat-activity MCP sandbox skeleton kept for downstream FA slices.
 *
 * @module
 */

import { createMcpAppBridge } from '@tanstack/ai-preact';
import { mergeAgentTools } from '@tanstack/ai';

export { createMcpSandboxHandler, type McpSandboxHandlerOptions } from './mcp-sandbox-handler.ts';

/** Human-readable marker every FA0 skeleton stub throws with. */
const FA0_SKELETON = 'not implemented (FA0 skeleton)';

/**
 * Throw the shared FA0 skeleton error, recording which upstream value the real
 * body will wrap. Returns `never`, so callers can `return` it and still satisfy
 * their declared return type.
 */
function notImplemented(symbol: string, wrapTarget: unknown): never {
  void wrapTarget;
  throw new Error(`${symbol}: ${FA0_SKELETON}`);
}

/** A NetScript-owned reference to an MCP tool source exposed to a chat activity. */
export interface NetScriptMcpToolSource {
  /** Stable identifier for the MCP source. */
  readonly id: string;
  /** Endpoint URL the MCP source is served from. */
  readonly url: string;
  /** Whether the connection is held open between turns. */
  readonly keepAlive?: boolean;
}

/** Options for wiring an MCP tool sandbox into a NetScript chat activity. */
export interface NetScriptMcpSandboxOptions {
  /** MCP tool sources exposed to the chat activity. */
  readonly sources: ReadonlyArray<NetScriptMcpToolSource>;
}

/**
 * A resolved MCP sandbox: the tool surface plus the runtime handle downstream
 * slices connect the island `useChat` bridge to.
 */
export interface NetScriptMcpSandbox {
  /** MCP tool sources active in this sandbox. */
  readonly sources: ReadonlyArray<NetScriptMcpToolSource>;
}

/**
 * FA3 — construct the MCP tool sandbox for a NetScript chat activity. Wraps
 * `mergeAgentTools` (server) and `createMcpAppBridge` (island). FA0 stub.
 *
 * @param options MCP tool sources exposed to the chat activity.
 * @returns A resolved MCP sandbox handle once FA3 chat-activity wiring lands.
 *
 * @example
 * ```ts
 * import { createNetScriptMcpSandbox } from '@netscript/fresh/ai/sandbox';
 *
 * const sandbox = createNetScriptMcpSandbox({
 *   sources: [{ id: 'tools', url: 'https://mcp.example.test' }],
 * });
 * ```
 */
export function createNetScriptMcpSandbox(
  options: NetScriptMcpSandboxOptions,
): NetScriptMcpSandbox {
  void options;
  void createMcpAppBridge;
  return notImplemented('createNetScriptMcpSandbox', mergeAgentTools);
}
