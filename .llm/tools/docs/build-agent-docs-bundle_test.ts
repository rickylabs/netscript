import { agentDocsFullCorpus } from '../../../packages/cli/src/kernel/assets/agent-docs-transport.ts';
import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import {
  buildAgentDocsProse,
  buildAgentDocsProseFromSite,
  checkAgentDocsProseFromSite,
} from './build-agent-docs-bundle.ts';
import { readAgentDocsPages } from './agent-docs-page-carrier.ts';

async function bundle(root: string, router = '## Task router\n'): Promise<void> {
  await Deno.mkdir(join(root, 'pages/reference'), { recursive: true });
  await Deno.writeTextFile(join(root, 'llms.txt'), router);
  await Deno.writeTextFile(join(root, 'llms-full.txt'), '# Original aggregate\n');
  await Deno.writeTextFile(join(root, 'pages/reference/index.md'), '# Reference\n');
  await Deno.writeTextFile(
    join(root, 'MANIFEST.md'),
    '| Framework version | `0.0.7` |\n| Extracted from commit | `fixture` |\n| Extraction timestamp | fixture |\n',
  );
}

Deno.test('docs prose builder requires task router and changes only its output root', async () => {
  const root = await Deno.makeTempDir();
  const output = await Deno.makeTempDir();
  try {
    await bundle(root, '# Missing router\n');
    await assertRejects(() => buildAgentDocsProse(root, output), Error, '#1068 task router');
    assertEquals(await Array.fromAsync(Deno.readDir(output)), []);
    await bundle(root);
    await buildAgentDocsProse(root, output);
    assertEquals((await Array.fromAsync(Deno.readDir(output))).map((entry) => entry.name).sort(), [
      'agent-docs-prose.generated.ts',
      'provenance.json',
    ]);
    const files = await readAgentDocsPages(join(output, 'agent-docs-prose.generated.ts'), '0.0.7');
    assertEquals(files['pages/reference/index.md'], '# Reference\n');
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(output, { recursive: true });
  }
});

Deno.test('site rebuild preserves external entries and freshness rejects input or transport drift without mutation', async () => {
  const root = await Deno.makeTempDir();
  try {
    const original = join(root, 'bundle');
    const site = join(root, 'site');
    const output = join(root, 'output');
    await bundle(original);
    await Deno.mkdir(join(original, 'context'));
    await Deno.writeTextFile(join(original, 'context/framing.mdx'), '# Framing\n');
    await buildAgentDocsProse(original, output);
    await Deno.mkdir(site);
    await Deno.writeTextFile(join(site, 'llms.txt'), '## Task router\n');
    await Deno.writeTextFile(
      join(site, 'llms-full.txt'),
      agentDocsFullCorpus({ 'pages/index.md': '# Home\n' }, '0.0.7'),
    );
    await Deno.writeTextFile(join(site, 'index.md'), '# Home\n');
    const path = join(output, 'agent-docs-prose.generated.ts');
    const metadata = { version: '0.0.7', preservedCorpusPath: path };
    await buildAgentDocsProseFromSite(site, metadata, output);
    const files = await readAgentDocsPages(path, metadata.version);
    assertEquals(files['context/framing.mdx'], '# Framing\n');
    assertEquals(files['pages/reference/index.md'], undefined);
    assertEquals((await checkAgentDocsProseFromSite(site, metadata, output)).fresh, true);
    const before = await Deno.readTextFile(path);
    await Deno.writeTextFile(join(site, 'index.md'), '# Changed\n');
    await Deno.writeTextFile(
      join(site, 'llms-full.txt'),
      agentDocsFullCorpus({ 'pages/index.md': '# Changed\n' }, '0.0.7'),
    );
    const stale = await checkAgentDocsProseFromSite(site, metadata, output);
    assertEquals(stale.fresh, false);
    assertEquals(stale.stalePaths, ['agent-docs-prose.generated.ts']);
    assertEquals(await Deno.readTextFile(path), before);
    await Deno.writeTextFile(path, before.replace(/"[a-f0-9]{64}"/, '"' + '0'.repeat(64) + '"'));
    await assertRejects(
      () => checkAgentDocsProseFromSite(site, metadata, output),
      Error,
      'integrity failed',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('page check and write preserve a different valid gzip encoding of unchanged decoded text', async () => {
  const root = await Deno.makeTempDir();
  try {
    const site = join(root, 'site');
    const output = join(root, 'output');
    const original = join(root, 'bundle');
    await bundle(original);
    await buildAgentDocsProse(original, output);
    await Deno.mkdir(site);
    const home = '# Home\n';
    await Deno.writeTextFile(join(site, 'llms.txt'), '## Task router\n');
    await Deno.writeTextFile(join(site, 'index.md'), home);
    await Deno.writeTextFile(
      join(site, 'llms-full.txt'),
      agentDocsFullCorpus({ 'pages/index.md': home }, '0.0.7'),
    );
    const path = join(output, 'agent-docs-prose.generated.ts');
    const metadata = { version: '0.0.7', preservedCorpusPath: path };
    await buildAgentDocsProseFromSite(site, metadata, output);
    const source = await Deno.readTextFile(path);
    const changed = source.split('\n').map((line) => {
      if (!line.startsWith('  [')) return line;
      const row: [string, string, string, number] = JSON.parse(line.trim().replace(/,$/, ''));
      const gzip = Uint8Array.fromBase64(row[1]);
      gzip[4] ^= 1; // A different valid gzip modification-time header; decoded bytes and CRC are unchanged.
      row[1] = gzip.toBase64();
      return `  ${JSON.stringify(row)},`;
    }).join('\n');
    assertEquals(source === changed, false);
    await Deno.writeTextFile(path, changed);
    assertEquals((await checkAgentDocsProseFromSite(site, metadata, output)).fresh, true);
    await buildAgentDocsProseFromSite(site, metadata, output);
    assertEquals(await Deno.readTextFile(path), changed);
    await Deno.writeTextFile(join(site, 'index.md'), '# Changed\n');
    await Deno.writeTextFile(
      join(site, 'llms-full.txt'),
      agentDocsFullCorpus({ 'pages/index.md': '# Changed\n' }, '0.0.7'),
    );
    assertEquals((await checkAgentDocsProseFromSite(site, metadata, output)).fresh, false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
