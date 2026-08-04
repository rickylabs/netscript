import { assert, assertEquals, assertObjectMatch } from '@std/assert';
import {
  API_SERVICE_RESULT_LIMIT,
  createGetOperationSchemaFlow,
  createListApiServicesFlow,
  createListServiceOperationsFlow,
  SERVICE_OPERATION_RESULT_LIMIT,
} from '../mod.ts';
import type { ServiceEndpointDirectoryPort, ServiceEndpointDirectoryResult } from '../mod.ts';
import { createMcpCliServer } from '../cli.ts';
import type { DiagnosticEvidencePort, DiagnosticEvidenceReceipt } from '../mod.ts';

const sources = [
  { source: 'override', outcome: 'used', candidates: [], excludedServices: [] },
  {
    source: 'aspire-cli',
    outcome: 'failed',
    code: 'command_failed',
    reason: 'aspire describe exited 1',
    candidates: [],
    excludedServices: [],
  },
] as const;

function directory(result: ServiceEndpointDirectoryResult): ServiceEndpointDirectoryPort {
  return { list: () => Promise.resolve(result) };
}

function spec(count: number): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    paths: Object.fromEntries(Array.from({ length: count }, (_, index) => [
      `/items/${index}`,
      {
        get: {
          operationId: `items.get${index}`,
          summary: `Get item ${index}`,
          tags: ['items'],
          responses: {
            200: {
              description: 'OK',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            404: {
              description: 'Missing',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
    ])),
  };
}

Deno.test('list_api_services forwards sources verbatim and omits counts without a fetched spec', async () => {
  const flow = createListApiServicesFlow(directory({
    sources,
    entries: [
      {
        name: 'running',
        status: 'running',
        source: 'aspire-cli',
        conflicts: [],
        baseUrl: 'http://127.0.0.1:4100',
        spec: spec(2),
      },
      {
        name: 'stopped',
        status: 'not_running',
        source: 'appsettings',
        conflicts: [],
        reason: 'not listening',
      },
    ],
  }));
  const result = await flow({});
  assert(result.ok);
  const value = result.value as { services: Array<Record<string, unknown>>; sources: unknown };
  assertEquals(value.sources, sources);
  assertEquals(value.sources === sources, true);
  assertEquals((result.value as { truncated: boolean }).truncated, false);
  assertEquals(value.services[0]?.operationCount, 2);
  assertEquals('operationCount' in value.services[1]!, false);
});

Deno.test('list_api_services reports truncation when service rows are dropped', async () => {
  const entries = Array.from({ length: API_SERVICE_RESULT_LIMIT + 1 }, (_, index) => ({
    name: `service-${index}`,
    status: 'not_running' as const,
    source: 'appsettings' as const,
    conflicts: [],
    reason: 'not listening',
  }));
  const result = await createListApiServicesFlow(directory({ sources, entries }))({});
  assert(result.ok);
  assertEquals((result.value as { services: unknown[] }).services.length, API_SERVICE_RESULT_LIMIT);
  assertEquals((result.value as { truncated: boolean }).truncated, true);
});

Deno.test('list_service_operations marks truncation iff at least one matching row was dropped', async () => {
  const flow = createListServiceOperationsFlow(directory({
    sources,
    entries: [{
      name: 'catalog',
      status: 'running',
      source: 'aspire-cli',
      conflicts: [],
      baseUrl: 'http://127.0.0.1:4200',
      spec: spec(SERVICE_OPERATION_RESULT_LIMIT + 1),
    }],
  }));
  const dropped = await flow({ service: 'catalog' });
  assert(dropped.ok);
  assertObjectMatch(dropped.value as Record<string, unknown>, { truncated: true });
  assertEquals(
    (dropped.value as { operations: unknown[] }).operations.length,
    SERVICE_OPERATION_RESULT_LIMIT,
  );

  const retained = await flow({
    service: 'catalog',
    limit: SERVICE_OPERATION_RESULT_LIMIT,
    filter: 'get0',
  });
  assert(retained.ok);
  assertObjectMatch(retained.value as Record<string, unknown>, { truncated: false });
  assertEquals((retained.value as { operations: unknown[] }).operations.length, 1);
});

Deno.test('get_operation_schema composes S4 views and an unauthenticated curl template', async () => {
  const flow = createGetOperationSchemaFlow(directory({
    sources,
    entries: [{
      name: 'catalog',
      status: 'running',
      source: 'aspire-cli',
      conflicts: [],
      baseUrl: 'http://127.0.0.1:4200',
      spec: spec(1),
    }],
  }));
  const result = await flow({ service: 'catalog', operation: 'items.get0', view: 'errors' });
  assert(result.ok);
  assertObjectMatch(result.value as Record<string, unknown>, {
    operation: 'items.get0',
    method: 'GET',
    path: '/items/0',
    view: 'errors',
    curlExample: "curl -X GET 'http://127.0.0.1:4200/items/0'",
  });
  assertEquals(
    (result.value as { schema: Record<string, unknown> }).schema['404'] !== undefined,
    true,
  );
  assert((result.value as { authNote: string }).authNote.includes('Unauthenticated'));
});

Deno.test('CLI settles a successful S6 receipt through the S8 lifecycle', async () => {
  let receipt: DiagnosticEvidenceReceipt | undefined;
  const evidence: DiagnosticEvidencePort = {
    read: () => Promise.resolve(undefined),
    write: (value) => {
      receipt = value;
      return Promise.resolve();
    },
    appendDrift: () => Promise.resolve(),
  };
  const serviceDirectory = directory({
    sources,
    entries: [{
      name: 'catalog',
      status: 'running',
      source: 'aspire-cli',
      conflicts: [],
      baseUrl: 'http://127.0.0.1:4200',
      spec: spec(1),
    }],
  });
  const server = createMcpCliServer({
    projectRoot: '/fixture',
    diagnosticEvidence: evidence,
    serviceEndpointDirectory: serviceDirectory,
  });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'list_api_services', arguments: {} },
  });

  assertEquals(response?.result?.isError, false);
  assertEquals(receipt?.command, 'mcp list_api_services');
  assertEquals(receipt?.resource, 'project');
  assertEquals(receipt?.exitStatus, 0);
});
