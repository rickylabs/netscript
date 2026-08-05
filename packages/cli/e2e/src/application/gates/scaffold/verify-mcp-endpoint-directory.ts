import {
  createGetOperationSchemaFlow,
  createListApiServicesFlow,
  createListServiceOperationsFlow,
  createMcpServer,
  createServiceEndpointDirectory,
} from '../../../../../../mcp/mod.ts';
import { join } from '@std/path';

const [projectRoot, appHostPath] = Deno.args;
if (!projectRoot || !appHostPath) {
  throw new Error('project root and AppHost path are required');
}

const directory = createServiceEndpointDirectory({ projectRoot, appHostPath });
const server = createMcpServer({
  probe: {
    probe: () => Promise.resolve({ reachable: false, message: 'unused by this gate' }),
  },
  flows: {
    list_api_services: createListApiServicesFlow(directory),
    list_service_operations: createListServiceOperationsFlow(directory),
    get_operation_schema: createGetOperationSchemaFlow(directory),
  },
});

const convention = await Deno.readTextFile(join(projectRoot, 'apps', 'dashboard', 'AGENTS.md'));
const orderedTools = [
  'list_api_services',
  'list_service_operations',
  'get_operation_schema',
] as const;
let priorIndex = -1;
for (const tool of orderedTools) {
  const index = convention.indexOf(tool);
  if (index <= priorIndex) {
    throw new Error(`generated AGENTS.md does not expose the ordered MCP path at ${tool}`);
  }
  priorIndex = index;
}

const services = await callTool('list_api_services', {});
const serviceRows = recordArray(services, 'services');
const users = serviceRows.find((entry) => entry.name === 'users');
if (users?.status !== 'running' || users.source !== 'aspire-cli') {
  throw new Error(`users endpoint did not resolve live through aspire-cli: ${JSON.stringify(users)}`);
}
const serviceName = stringField(users, 'name');
const operations = await callTool('list_service_operations', { service: serviceName });
const operationRows = recordArray(operations, 'operations');
const operation = operationRows.at(0);
if (!operation) throw new Error(`list_service_operations returned no rows for ${serviceName}`);
const operationName = stringField(operation, 'operation');
const schema = await callTool('get_operation_schema', {
  service: serviceName,
  operation: operationName,
});
if (schema.service !== serviceName || schema.operation !== operationName) {
  throw new Error(`get_operation_schema returned the wrong operation: ${JSON.stringify(schema)}`);
}

console.log(
  `documented MCP path resolved ${serviceName} through aspire-cli, enumerated ${operationRows.length} operations, and retrieved ${operationName}`,
);

async function callTool(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await server.handle({
    jsonrpc: '2.0',
    id: name,
    method: 'tools/call',
    params: { name, arguments: args },
  });
  const result = response?.result;
  const structured = result?.structuredContent;
  if (result?.isError !== false || !isRecord(structured)) {
    throw new Error(`${name} failed through MCP: ${JSON.stringify(response)}`);
  }
  return structured;
}

function recordArray(record: Record<string, unknown>, key: string): readonly Record<string, unknown>[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error(`MCP result field ${key} is not an object array`);
  }
  return value;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value) throw new Error(`MCP result field ${key} is not a string`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
