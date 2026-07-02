/**
 * Model Context Protocol (MCP) transport port.
 *
 * Abstracts *how* the runtime reaches an MCP server (stdio, HTTP/SSE, …) behind
 * a session that lists and calls tools. Default is a throwing "unconfigured"
 * port — real transports arrive with slice E8.
 *
 * @module
 */

import type { ToolDescriptor, ToolResult } from '../contracts/tool.ts';
import { AiNotConfiguredError } from '../contracts/errors.ts';

/** A tool discovered on an MCP server, tagged with its owning server id. */
export interface McpToolDescriptor extends ToolDescriptor {
  /** Id of the MCP server exposing this tool. */
  readonly serverId: string;
}

/** Where and how to reach an MCP server. */
export interface McpConnectTarget {
  /** Stable id assigned to the server connection. */
  readonly serverId: string;
  /** HTTP(S)/SSE endpoint, when the transport is network-based. */
  readonly url?: string;
  /** Executable command, when the transport is stdio-based. */
  readonly command?: string;
}

/** An open session against a connected MCP server. */
export interface McpSession {
  /** List tools advertised by the connected server. */
  listTools(): Promise<readonly McpToolDescriptor[]>;
  /** Invoke a named tool with arguments. */
  callTool(name: string, args: Readonly<Record<string, unknown>>): Promise<ToolResult>;
  /** Close the session and release transport resources. */
  close(): Promise<void>;
}

/**
 * The MCP transport capability seam.
 */
export interface McpTransportPort {
  /** Open a session against the given target. */
  connect(target: McpConnectTarget): Promise<McpSession>;
}

/**
 * Create the default throwing MCP transport. Every connect rejects with
 * {@linkcode AiNotConfiguredError}.
 */
export function createUnconfiguredMcpTransport(): McpTransportPort {
  return {
    connect(): Promise<McpSession> {
      return Promise.reject(
        new AiNotConfiguredError('mcp', 'Inject an McpTransportPort via createAiRuntime.'),
      );
    },
  };
}
