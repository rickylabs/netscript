/**
 * `@netscript/fresh/ai/sandbox` — MCP `ui://` sandbox helpers.
 *
 * This subpath keeps the MCP sandbox surface cohesive and keeps the main
 * `@netscript/fresh/ai` chat-session surface within the F-5 export cap. It
 * includes the route handler for serving themed `ui://` resources.
 *
 * @module
 */

export {
  createMcpAppCallHandler,
  type McpAppCallAttributes,
  type McpAppCallAttributeValue,
  type McpAppCallClientPool,
  type McpAppCallHandlerOptions,
  type McpAppCallServerClient,
  type McpAppCallSpan,
  type McpAppCallSpanKind,
  type McpAppCallSpanOptions,
  type McpAppCallToolDescriptor,
  type McpAppCallToolResult,
  type McpAppCallTraceContext,
  type McpAppCallTracer,
} from './mcp-app-call-handler.ts';
export { createMcpSandboxHandler, type McpSandboxHandlerOptions } from './mcp-sandbox-handler.ts';
