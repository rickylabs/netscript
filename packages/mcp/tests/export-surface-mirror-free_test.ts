import { assertEquals } from '@std/assert';
import { createMcpCliServer } from '../cli.ts';
import type { DiagnosticEvidencePort, DiagnosticEvidenceReceipt } from '../mod.ts';

Deno.test('mirror-free MCP resolves definePage without a docs directory and settles a receipt', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-mcp-export-mirror-free-' });
  try {
    assertEquals([...Deno.readDirSync(projectRoot)].length, 0);
    let receipt: DiagnosticEvidenceReceipt | undefined;
    const evidence: DiagnosticEvidencePort = {
      read: () => Promise.resolve(undefined),
      write: (value) => {
        receipt = value;
        return Promise.resolve();
      },
      appendDrift: () => Promise.resolve(),
    };
    const server = createMcpCliServer({ projectRoot, diagnosticEvidence: evidence });
    assertEquals(
      server.tools.slice(11, 15).map((tool) => tool.name),
      ['find_export', 'list_package_exports', 'get_export', 'search_exports'],
    );
    const response = await server.handle({
      jsonrpc: '2.0',
      id: 1201,
      method: 'tools/call',
      params: { name: 'find_export', arguments: { symbol: 'definePage' } },
    });
    assertEquals(response?.result?.isError, false);
    assertEquals(response?.result?.structuredContent, {
      symbol: 'definePage',
      total: 1,
      matches: [{ package: '@netscript/fresh', subpath: './builders', kind: 'function' }],
      truncated: false,
    });
    assertEquals(receipt?.command, 'mcp find_export');
    assertEquals(receipt?.resource, 'project');
    assertEquals(receipt?.exitStatus, 0);
    assertEquals([...Deno.readDirSync(projectRoot)].length, 0);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
