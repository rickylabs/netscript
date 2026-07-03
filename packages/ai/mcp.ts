/**
 * @module @netscript/ai/mcp
 *
 * MCP transport adapters for `@netscript/ai`: stdio, reconnectable
 * Streamable-HTTP, injected auth modes, lifecycle state, and tool-registry
 * registration.
 *
 * @example Create a Streamable-HTTP MCP transport
 * ```ts
 * import { createMcpTransport, registerMcpTools } from "@netscript/ai/mcp";
 * import { createToolRegistry } from "@netscript/ai/tools";
 *
 * const transport = createMcpTransport({
 *   kind: "streamable-http",
 *   serverId: "search",
 *   url: "https://mcp.example.com",
 *   auth: { mode: "api-token", token: "injected-at-runtime", scheme: "Bearer" },
 * });
 *
 * const registry = createToolRegistry();
 * await registerMcpTools(registry, transport);
 * ```
 */

export { createMcpTransport, type McpTransportConfig } from './src/mcp/application/factory.ts';
export {
  type McpToolRegistration,
  registerMcpTools,
} from './src/mcp/application/register-tools.ts';
export {
  StdioMcpTransport,
  type StdioMcpTransportConfig,
} from './src/mcp/adapters/stdio-transport.ts';
export {
  StreamableHttpMcpTransport,
  type StreamableHttpMcpTransportConfig,
} from './src/mcp/adapters/streamable-http-transport.ts';
export {
  type McpAuthConfig,
  type McpAuthMode,
  type McpBackoffConfig,
  type McpClientConnection,
  type McpConnectionState,
  type McpConnectOptions,
  type McpConnectorConfig,
  type McpToolDescriptor,
  type McpToolParameters,
  type McpToolRegistry,
  type McpToolResult,
  type McpTransportPort,
} from './src/ports/mcp-transport.ts';
