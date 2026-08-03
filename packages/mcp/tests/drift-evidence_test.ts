import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { DIAGNOSTIC_RECEIPT_TTL_MS, recordDrift } from '../mod.ts';
import type { DiagnosticEvidencePort, DiagnosticEvidenceReceipt } from '../mod.ts';
import { FilesystemDiagnosticEvidence } from '../mod.ts';
import { createMcpCliServer } from '../cli.ts';

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
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
