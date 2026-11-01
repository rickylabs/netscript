import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { runLibraryCommand } from '../cli.ts';
import { writePublication } from '../src/publication.ts';
import { fixtureCollections, fixtureInput } from './fixture.ts';
import { generateLibrary } from '../src/generate.ts';
import { importLibrary } from '../src/native/import-library.ts';
import { MockFigma } from './mock-figma.ts';

Deno.test('generation, verification and rejected controls use the public command without partial output', async () => {
  const root = await Deno.makeTempDir();
  try {
    const source = fixtureInput();
    const output = `${root}/valid`;
    assertEquals((await runLibraryCommand(['generate', '--output', output], source)).ok, true);
    assertEquals(
      (await runLibraryCommand(['verify', '--library', `${output}/library.json`], source)).ok,
      true,
    );
    const invalid = `${root}/invalid`;
    await assertRejects(
      () =>
        runLibraryCommand(['generate', '--output', invalid], {
          ...source,
          collections: fixtureCollections().slice(0, 1),
        }),
      Error,
      'Missing token binding',
    );
    await assertRejects(() => Deno.stat(invalid), Deno.errors.NotFound);
    await assertRejects(
      () => runLibraryCommand(['generate', '--dry-run', '--output', invalid], source),
      Error,
      'does not accept --dry-run',
    );
    await assertRejects(
      () => runLibraryCommand(['generate', '--unknown', '--output', invalid], source),
      Error,
      'Unknown option',
    );
    await assertRejects(
      () => runLibraryCommand(['generate', '--output', output], source),
      Deno.errors.AlreadyExists,
    );
    assertEquals(
      (await runLibraryCommand(['verify', '--library', `${output}/library.json`], source)).ok,
      true,
    );
    const inventory = await runLibraryCommand(['inventory'], source);
    assertEquals(inventory.ok, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('the executable generates and verifies actual selected registry items and reports the full source blocker', async () => {
  const root = await Deno.makeTempDir();
  try {
    const cli = new URL('../cli.ts', import.meta.url);
    const run = (args: string[]): Promise<Deno.CommandOutput> =>
      new Deno.Command(Deno.execPath(), {
        args: ['run', '--frozen', '--allow-read', '--allow-write', cli.href, ...args],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
    const selected = await run(['generate', '--items', 'button', '--output', `${root}/selected`]);
    assertEquals(selected.code, 0, new TextDecoder().decode(selected.stderr));
    const summary = JSON.parse(new TextDecoder().decode(selected.stdout));
    assertEquals(summary.coverage.complete, false);
    assertEquals(summary.coverage.selected, ['button']);
    assertEquals((await run(['verify', '--library', `${root}/selected/library.json`])).code, 0);
    const full = await run(['generate', '--output', `${root}/full`]);
    if (full.code !== 0) {
      assert(new TextDecoder().decode(full.stderr).includes('prose/h4/tracking'));
      await assertRejects(() => Deno.stat(`${root}/full`), Deno.errors.NotFound);
    } else {
      const result = JSON.parse(new TextDecoder().decode(full.stdout));
      assertEquals(result.coverage.complete, true);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publication refuses unsafe files before mkdir and rolls back a later failure without overwrites', async () => {
  const root = await Deno.makeTempDir();
  try {
    const output = `${root}/output`;
    const signal = new AbortController().signal;
    await assertRejects(
      () => writePublication(output, { '../escape.json': '{}' }, signal),
      Error,
      'Invalid publication filenames',
    );
    await assertRejects(() => Deno.stat(output), Deno.errors.NotFound);
    const failure = {
      'a.json': '{}',
      get 'b.json'(): string {
        throw new Error('Injected output failure');
      },
    };
    await assertRejects(
      () => writePublication(output, failure, signal),
      Error,
      'Injected output failure',
    );
    await assertRejects(() => Deno.stat(output), Deno.errors.NotFound);
    await writePublication(output, { 'a.json': 'original' }, signal);
    await assertRejects(
      () => writePublication(output, { 'a.json': 'replacement' }, signal),
      Deno.errors.AlreadyExists,
    );
    assertEquals(await Deno.readTextFile(`${output}/a.json`), 'original');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('connect command rejects fixture and mismatched receipts before output, and previews cannot be published by its discovery glob', async () => {
  const root = await Deno.makeTempDir();
  try {
    const sources = fixtureInput();
    const bundle = generateLibrary(sources);
    const api = new MockFigma(sources.collections);
    const receipt = await importLibrary(api, bundle, sources, {
      provenance: 'fixture',
      fileKey: api.fileKey,
      signal: new AbortController().signal,
    });
    await runLibraryCommand(['generate', '--output', `${root}/library`], sources);
    await Deno.writeTextFile(`${root}/receipt.json`, JSON.stringify(receipt));
    const args = [
      'connect',
      '--library',
      `${root}/library/library.json`,
      '--receipt',
      `${root}/receipt.json`,
      '--output',
      `${root}/output`,
    ];
    await assertRejects(() => runLibraryCommand(args, sources), Error, 'Fixture receipt');
    await assertRejects(() => Deno.stat(`${root}/output`), Deno.errors.NotFound);
    const preview = await runLibraryCommand([...args, '--dry-run'], sources);
    assertEquals(preview.dryRun, true);
    const files = Array.from(Deno.readDirSync(`${root}/output`), (entry) => entry.name);
    assert(files.includes('example-button.figma.preview.ts'));
    assert(!files.some((name) => name.endsWith('.figma.ts')));
    await Deno.remove(`${root}/output`, { recursive: true });
    const bad = {
      ...receipt,
      provenance: 'figma-editor',
      components: [{ ...receipt.components[0], registryItem: 'unknown' }],
    };
    await Deno.writeTextFile(`${root}/receipt.json`, JSON.stringify(bad));
    await assertRejects(() => runLibraryCommand(args, sources), Error, 'mismatched receipt item');
    await assertRejects(() => Deno.stat(`${root}/output`), Deno.errors.NotFound);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
