import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { buildAgentDocsProse } from './build-agent-docs-bundle.ts';

async function writeExternalBundle(root: string, llms: string): Promise<void> {
  await Deno.mkdir(join(root, 'pages', 'reference'), { recursive: true });
  await Deno.writeTextFile(join(root, 'llms.txt'), llms);
  await Deno.writeTextFile(join(root, 'llms-full.txt'), `${llms}\nfull corpus\n`);
  await Deno.writeTextFile(join(root, 'pages', 'reference', 'index.md'), '# Reference\n');
  await Deno.writeTextFile(
    join(root, 'MANIFEST.md'),
    '| Framework version | `0.0.3` |\n| Extracted from commit | `abc123` |\n| Extraction timestamp | 2026-08-03T10:00:00Z |\n',
  );
}

Deno.test('docs prose builder requires the #1068 task router and writes only its output root', async () => {
  const root = await Deno.makeTempDir();
  const output = await Deno.makeTempDir();
  try {
    await writeExternalBundle(root, '# NetScript\n');
    await assertRejects(
      () => buildAgentDocsProse(root, output),
      Error,
      '#1068 task router',
    );
    assertEquals([...(await Array.fromAsync(Deno.readDir(output)))], []);

    await writeExternalBundle(root, '# NetScript\n\n## Task router\n');
    const result = await buildAgentDocsProse(root, output);
    assertEquals(result.version, '0.0.3');
    assertEquals(result.sourceCommit, 'abc123');
    assertEquals(result.files, ['llms-full.txt', 'llms.txt', 'pages/reference/index.md']);
    assertEquals(
      [...(await Array.fromAsync(Deno.readDir(output)))].map((entry) => entry.name).sort(),
      ['prose.json.gz', 'provenance.json'],
    );
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(output, { recursive: true });
  }
});
