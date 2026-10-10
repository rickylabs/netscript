import { assertEquals } from '@std/assert';
import {
  agentDocsFullCorpus,
  decodeAgentDocsPages,
} from '../../../packages/cli/src/kernel/assets/agent-docs-transport.ts';
import { EMBEDDED_AGENT_DOCS_PAGES } from '../../../packages/cli/src/kernel/assets/agent-docs-prose.generated.ts';
import { EmbeddedExportSurfaceCorpus } from '../../../packages/mcp/src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts';
import {
  MCP_EMBEDDED_DOCS,
  MCP_PACKAGE_VERSION,
} from '../../../packages/mcp/src/publish-assets.generated.ts';
import { renderAgentDocsPages } from './agent-docs-page-carrier.ts';

async function original(path: string): Promise<string> {
  const ref = Deno.env.get('CARRIER_PARITY_REF') ?? 'origin/main';
  const result = await new Deno.Command('git', {
    args: ['show', `${ref}:${path}`],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout);
}

Deno.test('page transport preserves every original offline docs byte including the derived aggregate', async () => {
  // Compare exactly the same source files using the original serialized payload, not a second renderer.
  const source = await original('packages/cli/src/kernel/assets/agent-docs.generated.ts');
  const base64 = source.match(/EMBEDDED_AGENT_DOCS_GZIP_BASE64: string =\s*['"]([^'"]+)/)?.[1];
  if (!base64) return; // After migration main has page rows; rendered-site parity below remains active.
  const bytes = Uint8Array.fromBase64(base64);
  const old = JSON.parse(
    await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))
      .text(),
  ) as { files: Record<string, string> };
  const rendered = await renderAgentDocsPages(old.files);
  const rows = rendered.split('\n').filter((line) => line.startsWith('  [')).map((line) =>
    JSON.parse(line.trim().replace(/,$/, ''))
  );
  const next = await decodeAgentDocsPages(rows);
  next['llms-full.txt'] = agentDocsFullCorpus(next, MCP_PACKAGE_VERSION);
  assertEquals(next, old.files);
});

Deno.test('committed pages and runtime aggregate equal every rendered site twin', async () => {
  const files = await decodeAgentDocsPages(EMBEDDED_AGENT_DOCS_PAGES);
  for (const path of Object.keys(files).filter((path) => path.startsWith('pages/'))) {
    assertEquals(
      files[path],
      await Deno.readTextFile(
        new URL(`../../../docs/site/_site/${path.slice(6)}`, import.meta.url),
      ),
    );
  }
  assertEquals(
    agentDocsFullCorpus(files, MCP_PACKAGE_VERSION),
    await Deno.readTextFile(new URL('../../../docs/site/_site/llms-full.txt', import.meta.url)),
  );
});

Deno.test('offline MCP prose and export answers preserve the original normalized data', async () => {
  const oldSource = await original(
    'packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts',
  );
  const base64 = oldSource.match(/EXPORT_SURFACE_CORPUS_GZIP_BASE64: string =\s*['"]([^'"]+)/)?.[1];
  if (base64) {
    const old = JSON.parse(
      await new Response(
        new Blob([Uint8Array.fromBase64(base64)]).stream().pipeThrough(
          new DecompressionStream('gzip'),
        ),
      ).text(),
    );
    assertEquals(await new EmbeddedExportSurfaceCorpus().load(), old);
  }
  const pages = await decodeAgentDocsPages(EMBEDDED_AGENT_DOCS_PAGES);
  for (const document of MCP_EMBEDDED_DOCS) assertEquals(document.source, pages[document.path]);
});
