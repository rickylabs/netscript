import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { buildAgentDocsProse, buildAgentDocsProseFromSite } from './build-agent-docs-bundle.ts';

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

Deno.test('site rebuild replaces rendered pages and preserves externally owned corpus entries', async () => {
  const bundle = await Deno.makeTempDir();
  const site = await Deno.makeTempDir();
  const initialOutput = await Deno.makeTempDir();
  const rebuiltOutput = await Deno.makeTempDir();
  try {
    await writeExternalBundle(bundle, '# NetScript\n\n## Task router\n');
    await Deno.mkdir(join(bundle, 'context'), { recursive: true });
    await Deno.writeTextFile(join(bundle, 'context', 'framing.mdx'), '# Framing\n');
    await buildAgentDocsProse(bundle, initialOutput);

    await Deno.mkdir(join(site, 'reference'), { recursive: true });
    await Deno.writeTextFile(site + '/llms.txt', '# Current\n\n## Task router\n');
    await Deno.writeTextFile(site + '/llms-full.txt', '# Current full corpus\n');
    await Deno.writeTextFile(join(site, 'index.md'), '# Home current\n');
    await Deno.writeTextFile(join(site, 'reference', 'index.md'), '# Reference current\n');

    const result = await buildAgentDocsProseFromSite(site, {
      version: '0.0.6',
      sourceCommit: '0551ff592',
      extractionTimestamp: '2026-08-12T00:00:00Z',
      preservedCorpusPath: join(initialOutput, 'prose.json.gz'),
    }, rebuiltOutput);

    assertEquals(result.version, '0.0.6');
    assertEquals(result.sourceCommit, '0551ff592');
    assertEquals(result.files, [
      'context/framing.mdx',
      'llms-full.txt',
      'llms.txt',
      'pages/index.md',
      'pages/reference/index.md',
    ]);
  } finally {
    await Promise.all(
      [bundle, site, initialOutput, rebuiltOutput].map((path) =>
        Deno.remove(path, { recursive: true })
      ),
    );
  }
});
