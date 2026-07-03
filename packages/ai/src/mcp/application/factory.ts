import type { McpTransportPort } from '../../ports/mcp-transport.ts';
import { StdioMcpTransport, type StdioMcpTransportConfig } from '../adapters/stdio-transport.ts';
import {
  StreamableHttpMcpTransport,
  type StreamableHttpMcpTransportConfig,
} from '../adapters/streamable-http-transport.ts';

/** Configuration accepted by {@linkcode createMcpTransport}. */
export type McpTransportConfig =
  | ({ readonly kind: 'stdio' } & StdioMcpTransportConfig)
  | ({ readonly kind: 'streamable-http' } & StreamableHttpMcpTransportConfig);

/**
 * Create an MCP transport from a discriminated config object.
 */
export function createMcpTransport(config: McpTransportConfig): McpTransportPort {
  if (config.kind === 'stdio') {
    return new StdioMcpTransport(config);
  }
  return new StreamableHttpMcpTransport(config);
}
