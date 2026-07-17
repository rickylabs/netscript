import { createDoctorFlow } from '../flows/doctor-flow.ts';
import { createToolRegistry } from '../tool-registry.ts';
import type { TelemetryProbePort } from '../../domain/telemetry-probe-port.ts';
import { validateSchema } from '../../domain/schema.ts';
import type { ToolDefinition, ToolFlow, ToolName } from '../../domain/tool-types.ts';
import { type JsonRpcResponse, parseJsonRpcRequest } from '../../domain/json-rpc.ts';
import { DEFAULT_TRUNCATION_POLICY, truncateResult, type TruncationPolicy } from './truncation.ts';

/** Current stable MCP protocol revision implemented by the runner. */
export const MCP_PROTOCOL_VERSION = '2025-11-25';
/** Server dependencies and policy. */
export interface McpServerOptions {
  /** Telemetry reachability adapter. */
  readonly probe: TelemetryProbePort;
  /** Endpoint read from the environment edge. */
  readonly environment?: Readonly<{
    NETSCRIPT_TELEMETRY_ENDPOINT?: string;
    ASPIRE_DASHBOARD_PORT?: string;
  }>;
  /** Backward-compatible S1 endpoint injection. */
  readonly environmentEndpoint?: string;
  /** Optional server-side output bounds. */
  readonly truncation?: TruncationPolicy;
  /** Optional flow overrides for composition and contract testing. */
  readonly flows?: Partial<Record<ToolName, ToolFlow>>;
}
/** Callable MCP server subset. */
export interface McpServer {
  /** Handle one decoded JSON-RPC message. */
  handle(message: unknown): Promise<JsonRpcResponse | undefined>;
  /** Enumerable registered tool definitions. */
  readonly tools: readonly ToolDefinition[];
}

/** Create the S1 MCP server with initialize/list/call support. */
export function createMcpServer(options: McpServerOptions): McpServer {
  const tools = createToolRegistry({
    ...options.flows,
    doctor: options.flows?.doctor ?? createDoctorFlow(options.probe, {
      ...options.environment,
      NETSCRIPT_TELEMETRY_ENDPOINT: options.environment?.NETSCRIPT_TELEMETRY_ENDPOINT ??
        options.environmentEndpoint,
    }),
  });
  const policy = options.truncation ?? DEFAULT_TRUNCATION_POLICY;
  return {
    tools,
    async handle(message: unknown): Promise<JsonRpcResponse | undefined> {
      let request;
      try {
        request = parseJsonRpcRequest(message);
      } catch (error) {
        return rpcError(null, -32600, error instanceof Error ? error.message : 'Invalid request');
      }
      if (request.id === undefined) return undefined;
      if (request.method === 'initialize') {
        return rpcResult(request.id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: '@netscript/mcp', version: '0.0.1-beta.9' },
        });
      }
      if (request.method === 'tools/list') {
        return rpcResult(request.id, {
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema.jsonSchema,
            outputSchema: tool.outputSchema.jsonSchema,
          })),
        });
      }
      if (request.method !== 'tools/call') {
        return rpcError(request.id, -32601, `Method not found: ${request.method}`);
      }
      const name = request.params?.name;
      const tool = tools.find((candidate) => candidate.name === name);
      if (!tool) {
        return rpcError(request.id, -32602, 'Unregistered tool', { code: 'tool_not_found', name });
      }
      let input: unknown;
      try {
        input = validateSchema(tool.inputSchema, request.params?.arguments ?? {});
      } catch (error) {
        return rpcError(
          request.id,
          -32602,
          error instanceof Error ? error.message : 'Invalid tool arguments',
        );
      }
      const execution = await tool.flow(input);
      if (!execution.ok) {
        return rpcResult(request.id, {
          content: [{ type: 'text', text: execution.error.message }],
          structuredContent: execution.error,
          isError: true,
        });
      }
      try {
        validateSchema(tool.outputSchema, execution.value);
      } catch (error) {
        return rpcError(request.id, -32603, 'Tool returned an invalid structured result', {
          code: 'invalid_tool_result',
          message: error instanceof Error ? error.message : 'Output contract validation failed',
        });
      }
      const bounded = truncateResult(execution.value, policy);
      return rpcResult(request.id, {
        content: [{ type: 'text', text: JSON.stringify(bounded) }],
        structuredContent: bounded as Record<string, unknown>,
        isError: false,
      });
    },
  };
}

function rpcResult(id: string | number, result: Record<string, unknown>): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}
function rpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}
