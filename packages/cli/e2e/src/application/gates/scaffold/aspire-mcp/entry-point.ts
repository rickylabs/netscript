import { join } from '@std/path';
import type { AspireMcpEntryPoint } from './contract.ts';

/** Read and validate the generated Aspire stdio MCP entry point. */
export async function readAspireMcpEntryPoint(projectRoot: string): Promise<AspireMcpEntryPoint> {
  const value: unknown = JSON.parse(await Deno.readTextFile(join(projectRoot, '.mcp.json')));
  const config = object(value, '.mcp.json');
  const servers = object(Reflect.get(config, 'mcpServers'), '.mcp.json mcpServers');
  const aspire = object(Reflect.get(servers, 'aspire'), '.mcp.json mcpServers.aspire');
  const command = stringField(aspire, 'command');
  const args = Reflect.get(aspire, 'args');
  if (!Array.isArray(args) || !args.every((item) => typeof item === 'string')) {
    throw new Error('.mcp.json mcpServers.aspire.args must be strings');
  }
  if (command !== 'aspire' || args.length !== 2 || args[0] !== 'agent' || args[1] !== 'mcp') {
    throw new Error('.mcp.json mcpServers.aspire must equal aspire agent mcp');
  }
  return { source: '.mcp.json', command, args: [...args], cwd: projectRoot };
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

function stringField(source: Record<string, unknown>, key: string): string {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string') throw new Error(`Expected string ${key}`);
  return value;
}
