import { assertEquals } from '@std/assert';
import {
  agentDocsFullCorpus,
  decodeAgentDocsPages,
} from '../../../packages/cli/src/kernel/assets/agent-docs-transport.ts';
import { EMBEDDED_AGENT_DOCS_PAGES } from '../../../packages/cli/src/kernel/assets/agent-docs-prose.generated.ts';
import { decodeExportSurfaceRows } from '../../../packages/mcp/src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts';
import { EXPORT_SURFACE_ROWS } from '../../../packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts';
import { MCP_EMBEDDED_DOCS } from '../../../packages/mcp/src/publish-assets.generated.ts';
import { parseAgentDocsPages, renderAgentDocsPages } from './agent-docs-page-carrier.ts';
import {
  createGeneratedAsset,
  type GeneratedExportSurfaceCorpus,
} from './generate-export-surface-corpus.ts';

const fixture = new URL('./fixtures/legacy-carrier-parity/', import.meta.url);
const expected: {
  version: string;
  pages: Record<string, string>;
  llmsFullSha256: string;
  normalizedExportCorpusSha256: string;
} = JSON.parse(await Deno.readTextFile(new URL('digests.json', fixture)));

async function legacyJson(name: string): Promise<unknown> {
  const bytes = await Deno.readFile(new URL(name, fixture));
  return JSON.parse(
    await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))
      .text(),
  );
}

async function digest(text: string): Promise<string> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
    .toHex();
}

Deno.test('page transport preserves frozen legacy page and full-corpus digests without a site build', async () => {
  const old = await legacyJson('legacy-docs.json.gz') as { files: Record<string, string> };
  const rows = parseAgentDocsPages(await renderAgentDocsPages(old.files));
  const decoded = await decodeAgentDocsPages(rows);
  assertEquals(Object.keys(decoded).sort(), Object.keys(expected.pages).sort());
  for (const [path, sha256] of Object.entries(expected.pages)) {
    assertEquals(await digest(decoded[path]), sha256, path);
  }
  assertEquals(await digest(old.files['llms-full.txt']), expected.llmsFullSha256);
  assertEquals(
    await digest(agentDocsFullCorpus(decoded, expected.version)),
    expected.llmsFullSha256,
  );
});

Deno.test('entrypoint transport preserves the frozen legacy normalized export-corpus digest', async () => {
  const old = await legacyJson('legacy-exports.json.gz') as GeneratedExportSurfaceCorpus;
  assertEquals(await digest(JSON.stringify(old)), expected.normalizedExportCorpusSha256);
  const generated = await createGeneratedAsset(old);
  const rows: typeof EXPORT_SURFACE_ROWS = generated.source.split('\n')
    .filter((line) => line.startsWith('  ['))
    .map((line) => JSON.parse(line.trim().replace(/,$/, '')));
  const decoded = await decodeExportSurfaceRows(rows, expected.version);
  assertEquals(await digest(JSON.stringify(decoded)), expected.normalizedExportCorpusSha256);
});

Deno.test('committed offline MCP prose matches the corresponding production page rows', async () => {
  const pages = await decodeAgentDocsPages(EMBEDDED_AGENT_DOCS_PAGES);
  for (const document of MCP_EMBEDDED_DOCS) assertEquals(document.source, pages[document.path]);
});
