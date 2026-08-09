import { assert, assertEquals } from '@std/assert';
import { toFileUrl } from '@std/path';
import { findVersionResidue } from './deps/bump-version.ts';
import {
  buildMcpEmbeddedDocs,
  MCP_EMBEDDED_DOC_PATHS,
  MCP_EMBEDDED_DOCS_MAX_BYTES,
  refreshAgentDocsProvenance,
} from './generate-publish-assets.ts';

Deno.test('MCP fallback is generated from the locked release prose within 256 KiB', async () => {
  const generated = await buildMcpEmbeddedDocs();
  assertEquals(generated.provenance.paths, MCP_EMBEDDED_DOC_PATHS);
  assertEquals(generated.provenance.documentCount, 12);
  assertEquals(generated.provenance.documentCount, MCP_EMBEDDED_DOC_PATHS.length);
  assertEquals(generated.documents.map((document) => document.path), [...MCP_EMBEDDED_DOC_PATHS]);
  assertEquals(generated.documents[0]?.path, 'llms.txt');
  assertEquals(generated.documents[0]?.slug, 'llms');
  assert(generated.documents.every((document) => document.source.length > 0));
  assert(generated.provenance.sourceBytes <= MCP_EMBEDDED_DOCS_MAX_BYTES);
  assertEquals(generated.provenance.sha256.length, 64);
});

Deno.test('release asset regeneration removes prior-version provenance residue', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/packages/cli`, { recursive: true });
    await Deno.mkdir(`${root}/.llm/assets/agent-docs`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/packages/cli/deno.json`,
      JSON.stringify({ version: '0.0.4-canary.1' }),
    );
    await Deno.writeTextFile(
      `${root}/.llm/assets/agent-docs/provenance.json`,
      `${
        JSON.stringify(
          {
            schemaVersion: 1,
            version: '0.0.3',
            sourceCommit: 'd6265fa52',
            extractionTimestamp: '2026-08-03T10:09:58Z',
            files: [],
            uncompressedBytes: 1,
            compressedBytes: 1,
            sha256: 'fixture',
          },
          null,
          2,
        )
      }\n`,
    );
    assertEquals(await findVersionResidue(root, '0.0.3'), [
      `${root}/.llm/assets/agent-docs/provenance.json`,
    ]);
    await refreshAgentDocsProvenance(toFileUrl(`${root}/`), false);
    assertEquals(await findVersionResidue(root, '0.0.3'), []);
    const regenerated = JSON.parse(
      await Deno.readTextFile(`${root}/.llm/assets/agent-docs/provenance.json`),
    );
    assertEquals(regenerated.version, '0.0.4-canary.1');
    assertEquals(regenerated.sourceCommit, 'd6265fa52');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
