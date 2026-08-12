import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import {
  buildAgentDocsProse,
  buildAgentDocsProseFromSite,
  checkAgentDocsProseFromSite,
} from './build-agent-docs-bundle.ts';

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', copy.buffer))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

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
    assertEquals(
      result.sha256,
      await sha256(await gunzip(await Deno.readFile(join(output, 'prose.json.gz')))),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(output, { recursive: true });
  }
});

Deno.test('unchanged canonical corpus preserves byte-different gzip transport', async () => {
  const root = await Deno.makeTempDir();
  const output = await Deno.makeTempDir();
  try {
    await writeExternalBundle(root, '# NetScript\n\n## Task router\n');
    await buildAgentDocsProse(root, output);

    const prosePath = join(output, 'prose.json.gz');
    const alternateTransport = await Deno.readFile(prosePath);
    alternateTransport[4] = alternateTransport[4] === 0 ? 1 : 0;
    await Deno.writeFile(prosePath, alternateTransport);
    const provenancePath = join(output, 'provenance.json');
    const beforeProvenance = await Deno.readTextFile(provenancePath);
    await Deno.writeTextFile(
      join(root, 'MANIFEST.md'),
      '| Framework version | `0.0.3` |\n| Extracted from commit | `different` |\n| Extraction timestamp | 2026-08-12T23:59:59Z |\n',
    );

    await buildAgentDocsProse(root, output);
    assertEquals(
      await Deno.readFile(prosePath),
      alternateTransport,
      'content-identical alternate gzip bytes must survive unchanged regeneration',
    );
    assertEquals(await Deno.readTextFile(provenancePath), beforeProvenance);
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(output, { recursive: true });
  }
});

Deno.test('semantic freshness tolerates gzip variance, is non-mutating, and detects real input drift', async () => {
  const bundle = await Deno.makeTempDir();
  const site = await Deno.makeTempDir();
  const output = await Deno.makeTempDir();
  const metadata = {
    version: '0.0.6',
    sourceCommit: '0551ff592',
    extractionTimestamp: '2026-08-12T00:00:00Z',
  };
  try {
    await writeExternalBundle(bundle, '# NetScript\n\n## Task router\n');
    await buildAgentDocsProse(bundle, output);
    await Deno.writeTextFile(join(site, 'llms.txt'), '# Current\n\n## Task router\n');
    await Deno.writeTextFile(join(site, 'llms-full.txt'), '# Current full corpus\n');
    await Deno.writeTextFile(join(site, 'index.md'), '# Home current\n');
    await buildAgentDocsProseFromSite(site, {
      ...metadata,
      preservedCorpusPath: join(output, 'prose.json.gz'),
    }, output);

    const prosePath = join(output, 'prose.json.gz');
    const provenancePath = join(output, 'provenance.json');
    const alternateTransport = await Deno.readFile(prosePath);
    alternateTransport[4] = alternateTransport[4] === 0 ? 1 : 0;
    await Deno.writeFile(prosePath, alternateTransport);
    const beforeProvenance = await Deno.readTextFile(provenancePath);

    const fresh = await checkAgentDocsProseFromSite(site, {
      ...metadata,
      preservedCorpusPath: prosePath,
    }, output);
    assertEquals(fresh.fresh, true, 'content-identical alternate gzip must be fresh');
    assertEquals(await Deno.readFile(prosePath), alternateTransport, 'check must not rewrite gzip');
    assertEquals(
      await Deno.readTextFile(provenancePath),
      beforeProvenance,
      'check must not rewrite provenance',
    );

    await Deno.writeTextFile(join(site, 'index.md'), '# Real content drift\n');
    const stale = await checkAgentDocsProseFromSite(site, {
      ...metadata,
      preservedCorpusPath: prosePath,
    }, output);
    assertEquals(stale.fresh, false, 'changing one rendered input must fail freshness');
    assertEquals(stale.stalePaths, ['prose.json.gz', 'provenance.json']);
    assertEquals(
      await Deno.readFile(prosePath),
      alternateTransport,
      'stale check must not rewrite gzip',
    );
    assertEquals(
      await Deno.readTextFile(provenancePath),
      beforeProvenance,
      'stale check must not rewrite provenance',
    );
  } finally {
    await Promise.all([bundle, site, output].map((path) => Deno.remove(path, { recursive: true })));
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
