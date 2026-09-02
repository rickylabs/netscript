import { createDoctorFlow } from '../flows/doctor-flow.ts';
import { createToolRegistry } from '../tool-registry.ts';
import type { TelemetryProbePort } from '../../domain/telemetry-probe-port.ts';
import type { AspirePsDashboardPort } from '../../domain/telemetry-endpoint.ts';
import { validateSchema } from '../../domain/schema.ts';
import type {
  ToolDefinition,
  ToolExecutionResult,
  ToolFlow,
  ToolName,
} from '../../domain/tool-types.ts';
import { type JsonRpcResponse, parseJsonRpcRequest } from '../../domain/json-rpc.ts';
import {
  DEFAULT_TRUNCATION_POLICY,
  ResultByteLimitError,
  truncateResult,
  type TruncationPolicy,
} from './truncation.ts';
import { MCP_PACKAGE_VERSION } from '../../publish-assets.generated.ts';
import { settleFlowReceipt } from './receipt-lifecycle.ts';

/** Current stable MCP protocol revision implemented by the runner. */
export const MCP_PROTOCOL_VERSION = '2025-11-25';
/** Instructions injected by MCP hosts into every driving agent context. */
export const MCP_AGENT_INSTRUCTIONS =
  `Before implementing an unfamiliar NetScript API or architecture, call find_guidance with the task. Use search_docs for literal lookup and get_doc for exact retrieval. Use doctor to check NetScript, Aspire, project wiring, and plugins. Use find_export, list_package_exports, get_export, and search_exports to discover first-party package APIs before guessing symbol names or import subpaths. Use get_app_status and get_recent_errors for live telemetry symptoms, and the analyze_* tools for performance or database evidence. When debugging or calling a service HTTP API, follow the MCP path: list_api_services to discover the live service name, list_service_operations to select an operation, then get_operation_schema for its request and response contract before hand-rolling requests with curl. Search help.md with search_docs when something hangs, is Healthy but does not respond, or leaves a dangling AppHost. record_drift is gated: it refuses unless the same resource has a successful diagnostic receipt from the last 15 minutes.`;
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
  /** Injectable running-AppHost telemetry endpoint reader. */
  readonly aspirePs?: AspirePsDashboardPort;
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
    doctor: options.flows?.doctor ?? createDoctorFlow(
      options.probe,
      {
        ...options.environment,
        NETSCRIPT_TELEMETRY_ENDPOINT: options.environment?.NETSCRIPT_TELEMETRY_ENDPOINT ??
          options.environmentEndpoint,
      },
      [],
      '.',
      options.aspirePs,
    ),
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
          serverInfo: { name: '@netscript/mcp', version: MCP_PACKAGE_VERSION },
          instructions: MCP_AGENT_INSTRUCTIONS,
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
      let execution: ToolExecutionResult;
      try {
        execution = await tool.flow(input);
      } catch {
        await settleFlowReceipt(tool.flow, input, false);
        return rpcError(request.id, -32603, 'Tool execution failed', {
          code: 'tool_execution_failed',
          message: 'The tool flow did not complete.',
        });
      }
      if (!execution.ok) {
        await settleFlowReceipt(tool.flow, input, false);
        return rpcResult(request.id, {
          content: [{ type: 'text', text: execution.error.message }],
          structuredContent: execution.error,
          isError: true,
        });
      }
      let bounded: unknown;
      try {
        validateSchema(tool.outputSchema, execution.value);
        bounded = truncateResult(execution.value, policy);
        validateSchema(tool.outputSchema, bounded);
      } catch (error) {
        await settleFlowReceipt(tool.flow, input, false);
        if (error instanceof ResultByteLimitError) {
          return rpcError(request.id, -32603, 'Tool result exceeds the transport limit', {
            code: 'tool_result_too_large',
            message: error.message,
          });
        }
        return rpcError(request.id, -32603, 'Tool returned an invalid structured result', {
          code: 'invalid_tool_result',
          message: error instanceof Error ? error.message : 'Output contract validation failed',
        });
      }
      await settleFlowReceipt(tool.flow, input, resultSucceeded(execution.value));
      return rpcResult(request.id, {
        content: [{ type: 'text', text: JSON.stringify(bounded) }],
        structuredContent: bounded as Record<string, unknown>,
        isError: false,
      });
    },
  };
}

function resultSucceeded(value: unknown): boolean {
  return !(value !== null && typeof value === 'object' && Reflect.get(value, 'status') === 'fail');
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
