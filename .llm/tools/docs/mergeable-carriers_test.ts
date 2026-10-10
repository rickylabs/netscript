import { assert, assertEquals } from '@std/assert';
import { join, toFileUrl } from '@std/path';
import {
  createGeneratedAsset,
  type GeneratedExportSurfaceCorpus,
} from './generate-export-surface-corpus.ts';
import { buildAgentDocsProse } from './build-agent-docs-bundle.ts';

const baseline = Deno.env.get('CARRIER_BASELINE_ROOT');
const docsGenerator: typeof buildAgentDocsProse = baseline
  ? (await import(toFileUrl(join(baseline, '.llm/tools/docs/build-agent-docs-bundle.ts')).href))
    .buildAgentDocsProse
  : buildAgentDocsProse;
const exportGenerator: typeof createGeneratedAsset = baseline
  ? (await import(
    toFileUrl(join(baseline, '.llm/tools/docs/generate-export-surface-corpus.ts')).href
  )).createGeneratedAsset
  : createGeneratedAsset;

async function git(root: string, ...args: string[]): Promise<void> {
  const output = await new Deno.Command('git', {
    args: [
      '-c',
      'user.name=Carrier test',
      '-c',
      'user.email=carrier@example.invalid',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
}

async function mergeBranches(
  generate: (root: string) => Promise<void>,
  source: (index: number) => string,
  outputPaths: string[],
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'carrier-merge-' });
  try {
    await git(root, 'init', '-b', 'main');
    for (let i = 0; i < 8; i++) await Deno.writeTextFile(join(root, `page-${i}.txt`), source(i));
    await generate(root);
    await git(root, 'add', '.');
    await git(root, 'commit', '-m', 'base');
    await git(root, 'checkout', '-b', 'left');
    await Deno.writeTextFile(join(root, 'page-2.txt'), source(2) + '\nLeft edit\n');
    await generate(root);
    await git(root, 'add', '.');
    await git(root, 'commit', '-m', 'left');
    await git(root, 'checkout', '-b', 'right', 'main');
    await Deno.writeTextFile(join(root, 'page-5.txt'), source(5) + '\nRight edit\n');
    await generate(root);
    await git(root, 'add', '.');
    await git(root, 'commit', '-m', 'right');
    await git(root, 'merge', '--no-edit', 'left');
    const merged = await Promise.all(outputPaths.map((path) => Deno.readFile(join(root, path))));
    await generate(root);
    for (const [i, path] of outputPaths.entries()) {
      assertEquals(
        await Deno.readFile(join(root, path)),
        merged[i],
        `${path}: merged carrier must equal regeneration`,
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('docs carriers merge independent page edits with real Git and equal regeneration', async () => {
  await mergeBranches(
    async (root) => {
      const bundle = join(root, 'bundle');
      await Deno.mkdir(join(bundle, 'pages'), { recursive: true });
      await Deno.writeTextFile(
        join(bundle, 'MANIFEST.md'),
        '| Framework version | `0.0.7` |\n| Extracted from commit | `fixture` |\n| Extraction timestamp | 2026-10-10T00:00:00Z |\n',
      );
      await Deno.writeTextFile(join(bundle, 'llms.txt'), '## Task router\n');
      const pages: string[] = [];
      for (let i = 0; i < 8; i++) {
        const source = await Deno.readTextFile(join(root, `page-${i}.txt`));
        await Deno.writeTextFile(join(bundle, 'pages', `page-${i}.md`), source);
        pages.push(source);
      }
      await Deno.writeTextFile(join(bundle, 'llms-full.txt'), pages.join('\n'));
      await docsGenerator(bundle, join(root, 'carrier'));
      // Inputs include only individual source pages; the rendered aggregate is not a tracked source.
      await Deno.remove(bundle, { recursive: true });
    },
    (i) => `# Page ${i}\n`,
    baseline
      ? ['carrier/prose.json.gz', 'carrier/provenance.json']
      : ['carrier/agent-docs-prose.generated.ts', 'carrier/provenance.json'],
  );
});

Deno.test('export carriers merge independent entrypoint edits with real Git and equal regeneration', async () => {
  await mergeBranches(
    async (root) => {
      const corpus: GeneratedExportSurfaceCorpus = {
        schemaVersion: 1,
        frameworkVersion: '0.0.7',
        surfaces: [],
        entries: [],
      };
      const surfaces: { packageName: string; subpath: string }[] = [];
      const entries = [];
      for (let i = 0; i < 8; i++) {
        const surface = { packageName: '@netscript/fixture', subpath: `./page-${i}` };
        surfaces.push(surface);
        entries.push({
          ...surface,
          symbol: `page${i}`,
          kind: 'variable',
          signature: `const page${i}: string`,
          jsDoc: await Deno.readTextFile(join(root, `page-${i}.txt`)),
        });
      }
      await Deno.writeTextFile(
        join(root, 'exports.generated.ts'),
        (await exportGenerator({ ...corpus, surfaces, entries })).source,
      );
    },
    (i) => `Public declaration ${i}`,
    ['exports.generated.ts'],
  );
});

Deno.test('docs provenance has no wall clock or commit identity and generation is byte deterministic', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'pages'));
    await Deno.writeTextFile(join(root, 'llms.txt'), '## Task router\n');
    await Deno.writeTextFile(join(root, 'llms-full.txt'), '# Page\n');
    await Deno.writeTextFile(join(root, 'pages/index.md'), '# Page\n');
    const manifest = (identity: string) =>
      `| Framework version | \`0.0.7\` |\n| Extracted from commit | \`${identity}\` |\n| Extraction timestamp | ${identity} |\n`;
    await Deno.writeTextFile(join(root, 'MANIFEST.md'), manifest('first'));
    const output = join(root, 'carrier');
    await docsGenerator(root, output);
    const before = await Deno.readTextFile(join(output, 'provenance.json'));
    assert(!before.includes('sourceCommit') && !before.includes('extractionTimestamp'));
    await Deno.writeTextFile(join(root, 'MANIFEST.md'), manifest('second'));
    await docsGenerator(root, output);
    assertEquals(await Deno.readTextFile(join(output, 'provenance.json')), before);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
