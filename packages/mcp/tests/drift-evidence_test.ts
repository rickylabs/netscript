import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { DIAGNOSTIC_RECEIPT_TTL_MS, recordDrift } from '../mod.ts';
import type { DiagnosticEvidencePort, DiagnosticEvidenceReceipt } from '../mod.ts';
import type { CommandExecutorPort } from '../mod.ts';
import type { ServiceEndpointDirectoryPort } from '../mod.ts';
import { FilesystemDiagnosticEvidence } from '../mod.ts';
import { createMcpCliServer } from '../cli.ts';
import { createMcpServer } from '../mod.ts';
import { withFlowReceipt } from '../src/application/runner/receipt-lifecycle.ts';

class MemoryEvidence implements DiagnosticEvidencePort {
  receipt?: DiagnosticEvidenceReceipt;
  entries: string[] = [];
  read(): Promise<DiagnosticEvidenceReceipt | undefined> {
    return Promise.resolve(this.receipt);
  }
  write(receipt: DiagnosticEvidenceReceipt): Promise<void> {
    this.receipt = receipt;
    return Promise.resolve();
  }
  appendDrift(entry: string): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }
}

const now = new Date('2026-08-03T12:00:00.000Z');
const input = { resource: 'api', summary: 'request hangs' };

Deno.test('record drift refuses without a diagnostic receipt', async () => {
  const result = await recordDrift(input, new MemoryEvidence(), now);
  assert(!result.ok);
  assertEquals(result.error.code, 'diagnostic_evidence_required');
  assertStringIncludes(result.error.message, 'netscript plugin doctor --resource api');
  assertStringIncludes(result.error.message, 'MCP "doctor" or telemetry tools');
  assertStringIncludes(result.error.message, 'API introspection tools');
});

Deno.test('record drift refuses a stale diagnostic receipt', async () => {
  const evidence = new MemoryEvidence();
  evidence.receipt = {
    resource: 'api',
    command: 'mcp doctor',
    timestamp: new Date(now.getTime() - DIAGNOSTIC_RECEIPT_TTL_MS - 1).toISOString(),
    exitStatus: 0,
  };
  const result = await recordDrift(input, evidence, now);
  assert(!result.ok);
  assertEquals(evidence.entries, []);
});

Deno.test('record drift refuses a fresh diagnostic receipt with non-zero exit status', async () => {
  const evidence = new MemoryEvidence();
  evidence.receipt = {
    resource: 'api',
    command: 'mcp doctor',
    timestamp: now.toISOString(),
    exitStatus: 1,
  };
  const result = await recordDrift(input, evidence, now);
  assert(!result.ok);
  assertEquals(evidence.entries, []);
});

Deno.test('record drift accepts fresh successful evidence and appends its receipt', async () => {
  const evidence = new MemoryEvidence();
  evidence.receipt = {
    resource: 'api',
    command: 'mcp get_recent_errors',
    timestamp: now.toISOString(),
    exitStatus: 0,
  };
  const result = await recordDrift(input, evidence, now);
  assert(result.ok);
  assertEquals(evidence.entries.length, 1);
  assertStringIncludes(evidence.entries[0]!, 'mcp get_recent_errors');
});

Deno.test('MCP record_drift refuses and accepts through the shared gate', async () => {
  const root = await Deno.makeTempDir();
  try {
    const server = createMcpCliServer({ projectRoot: root });
    const call = () =>
      server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'record_drift', arguments: input },
      });
    const refused = await call();
    assertEquals(refused?.result?.isError, true);
    assertEquals(
      (refused?.result?.structuredContent as { code?: string }).code,
      'diagnostic_evidence_required',
    );
    const evidence = new FilesystemDiagnosticEvidence(root);
    for (
      const receipt of [
        {
          resource: 'api',
          command: 'mcp doctor',
          timestamp: new Date(Date.now() - DIAGNOSTIC_RECEIPT_TTL_MS - 1).toISOString(),
          exitStatus: 0,
        },
        {
          resource: 'api',
          command: 'mcp doctor',
          timestamp: new Date().toISOString(),
          exitStatus: 1,
        },
      ]
    ) {
      await evidence.write(receipt);
      assertEquals((await call())?.result?.isError, true);
    }
    await evidence.write({
      resource: 'api',
      command: 'mcp get_recent_errors',
      timestamp: new Date().toISOString(),
      exitStatus: 0,
    });
    const accepted = await call();
    assertEquals(accepted?.result?.isError, false);
    assertEquals((accepted?.result?.structuredContent as { recorded?: boolean }).recorded, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a public introspection receipt satisfies the shared drift gate', async () => {
  const evidence = new MemoryEvidence();
  const serviceEndpointDirectory: ServiceEndpointDirectoryPort = {
    list: () => Promise.resolve({ entries: [], sources: [] }),
  };
  const server = createMcpCliServer({
    projectRoot: '/fixture',
    diagnosticEvidence: evidence,
    serviceEndpointDirectory,
  });

  const introspection = await server.handle({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'list_api_services', arguments: {} },
  });
  assertEquals(introspection?.result?.isError, false);
  assertEquals(evidence.receipt?.command, 'mcp list_api_services');
  assertEquals(evidence.receipt?.resource, 'project');
  assertEquals(evidence.receipt?.exitStatus, 0);

  const accepted = await server.handle({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'record_drift',
      arguments: { resource: 'project', summary: 'service contract drift' },
    },
  });
  assertEquals(accepted?.result?.isError, false);
  assertEquals((accepted?.result?.structuredContent as { recorded?: boolean }).recorded, true);
  assertStringIncludes(evidence.entries[0]!, 'mcp list_api_services');
});

Deno.test('a successful execute_command receipt satisfies the shared drift gate', async () => {
  const evidence = new MemoryEvidence();
  const executor: CommandExecutorPort = {
    execute: () =>
      Promise.resolve({
        exitCode: 0,
        durationMs: 1,
        outputTail: 'generated project files',
        truncated: false,
        timedOut: false,
      }),
  };
  const server = createMcpCliServer({
    projectRoot: '/fixture',
    diagnosticEvidence: evidence,
    commandExecutor: executor,
  });

  const executed = await server.handle({
    jsonrpc: '2.0',
    id: 20,
    method: 'tools/call',
    params: {
      name: 'execute_command',
      arguments: { command: 'generate', args: ['plugins'] },
    },
  });
  assertEquals(executed?.result?.isError, false);
  assertEquals(evidence.receipt?.command, 'mcp execute_command');
  assertEquals(evidence.receipt?.resource, 'project');
  assertEquals(evidence.receipt?.exitStatus, 0);

  const accepted = await server.handle({
    jsonrpc: '2.0',
    id: 21,
    method: 'tools/call',
    params: {
      name: 'record_drift',
      arguments: { resource: 'project', summary: 'generated registry drift' },
    },
  });
  assertEquals(accepted?.result?.isError, false);
});

Deno.test('a public introspection output rejection cannot leave green evidence', async () => {
  const properties = Object.fromEntries(
    Array.from({ length: 4_000 }, (_, index) => [
      `field_${index}`,
      { type: 'string', description: `Field ${index}` },
    ]),
  );
  const serviceEndpointDirectory: ServiceEndpointDirectoryPort = {
    list: () =>
      Promise.resolve({
        sources: [],
        entries: [{
          name: 'catalog',
          status: 'running',
          source: 'aspire-cli',
          conflicts: [],
          baseUrl: 'http://127.0.0.1:4200',
          spec: {
            openapi: '3.1.0',
            paths: {
              '/items': {
                get: {
                  operationId: 'items.list',
                  responses: {
                    200: {
                      description: 'OK',
                      content: {
                        'application/json': {
                          schema: { type: 'object', properties },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }],
      }),
  };
  const evidence = new MemoryEvidence();
  const server = createMcpCliServer({
    projectRoot: '/fixture',
    diagnosticEvidence: evidence,
    serviceEndpointDirectory,
  });

  const green = await server.handle({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'list_service_operations', arguments: { service: 'catalog' } },
  });
  assertEquals(green?.result?.isError, false);
  assertEquals(evidence.receipt?.exitStatus, 0);

  const rejected = await server.handle({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'get_operation_schema',
      arguments: { service: 'catalog', operation: 'items.list', view: 'response' },
    },
  });
  assertEquals(rejected?.error?.code, -32603);
  assertEquals((rejected?.error?.data as { code?: string }).code, 'tool_result_too_large');
  assertEquals(evidence.receipt?.command, 'mcp get_operation_schema');
  assertEquals(evidence.receipt?.resource, 'catalog');
  assertEquals(evidence.receipt?.exitStatus, 1);

  const refused = await server.handle({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'record_drift',
      arguments: { resource: 'catalog', summary: 'service contract drift' },
    },
  });
  assertEquals(refused?.result?.isError, true);
  assertEquals(
    (refused?.result?.structuredContent as { code?: string }).code,
    'diagnostic_evidence_required',
  );
});

Deno.test('an actual MCP doctor call writes a diagnostic receipt', async () => {
  const root = await Deno.makeTempDir();
  try {
    const server = createMcpCliServer({ projectRoot: root, endpoint: 'http://127.0.0.1:1' });
    await server.handle({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'doctor', arguments: { resource: 'api' } },
    });
    const receipt = await new FilesystemDiagnosticEvidence(root).read('api');
    assertEquals(receipt?.command, 'mcp doctor');
    assertEquals(receipt?.resource, 'api');
    assertEquals(receipt?.exitStatus, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('invalid MCP tool output replaces stale green evidence with a failed receipt', async () => {
  const evidence = new MemoryEvidence();
  evidence.receipt = {
    resource: 'api',
    command: 'mcp doctor',
    timestamp: new Date(0).toISOString(),
    exitStatus: 0,
  };
  const invalidDoctor = withFlowReceipt(
    () => Promise.resolve({ ok: true, value: { status: 'unknown' } }),
    (_input, succeeded) =>
      evidence.write({
        resource: 'api',
        command: 'mcp doctor',
        timestamp: new Date().toISOString(),
        exitStatus: succeeded ? 0 : 1,
      }),
  );
  const response = await createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    flows: { doctor: invalidDoctor },
  }).handle({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'doctor', arguments: { resource: 'api' } },
  });

  assertEquals(response?.error?.code, -32603);
  assertEquals((response?.error?.data as Record<string, unknown>).code, 'invalid_tool_result');
  assertEquals(evidence.receipt?.exitStatus, 1);
  assertEquals(evidence.receipt?.resource, 'api');
});

Deno.test('throwing MCP tool flow replaces stale green evidence with a failed receipt', async () => {
  const evidence = new MemoryEvidence();
  evidence.receipt = {
    resource: 'api',
    command: 'mcp doctor',
    timestamp: new Date(0).toISOString(),
    exitStatus: 0,
  };
  const throwingDoctor = withFlowReceipt(
    () => Promise.reject(new Error('fixture failure')),
    (_input, succeeded) =>
      evidence.write({
        resource: 'api',
        command: 'mcp doctor',
        timestamp: new Date().toISOString(),
        exitStatus: succeeded ? 0 : 1,
      }),
  );
  const response = await createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    flows: { doctor: throwingDoctor },
  }).handle({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: { name: 'doctor', arguments: { resource: 'api' } },
  });

  assertEquals((response?.error?.data as Record<string, unknown>).code, 'tool_execution_failed');
  assertEquals(evidence.receipt?.exitStatus, 1);
});

Deno.test('MCP doctor result survives a diagnostic evidence write failure', async () => {
  const warnings: string[] = [];
  const evidence: DiagnosticEvidencePort = {
    read: () => Promise.resolve(undefined),
    write: () => Promise.reject(new Deno.errors.PermissionDenied('read-only checkout')),
    appendDrift: () => Promise.resolve(),
  };
  const server = createMcpCliServer({
    projectRoot: '/read-only',
    endpoint: 'http://127.0.0.1:1',
    diagnosticEvidence: evidence,
    onEvidenceWarning: (message) => warnings.push(message),
  });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'doctor', arguments: { resource: 'api' } },
  });

  assertEquals(response?.result?.isError, false);
  assertStringIncludes(warnings.join('\n'), 'diagnostic evidence was not recorded');
  assertStringIncludes(warnings.join('\n'), 'record_drift will refuse');
  assertStringIncludes(warnings.join('\n'), 'read-only checkout');
});
