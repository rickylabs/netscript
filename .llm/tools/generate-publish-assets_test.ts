import { assertEquals } from '@std/assert';
import { toFileUrl } from '@std/path';
import { findVersionResidue } from './deps/bump-version.ts';
import { refreshAgentDocsProvenance } from './generate-publish-assets.ts';

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
