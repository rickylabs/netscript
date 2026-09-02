import { assert, assertEquals, assertMatch } from '@std/assert';
import {
  colorInvariantChildEnv,
  createGeneratedAsset,
  EXPORT_SURFACE_CORPUS_OUTPUT,
  type GeneratedExportSurfaceCorpus,
  normalizeDenoDocNode,
} from './generate-export-surface-corpus.ts';

const fixtureUrl = new URL(
  './fixtures/export-surfaces/fresh-interactive.deno-doc.json',
  import.meta.url,
);

Deno.test('normalizer consumes the checked-in Deno 2.9 JSON fixture', async () => {
  const document = JSON.parse(await Deno.readTextFile(fixtureUrl)) as {
    version: number;
    nodes: Record<string, unknown>;
  };
  assertEquals(document.version, 2);
  const node = Object.values(document.nodes)[0];
  const entries = normalizeDenoDocNode(node, '@netscript/fresh', './interactive');
  assertEquals(entries, [
    {
      packageName: '@netscript/fresh',
      subpath: './interactive',
      symbol: 'resolvedPromise',
      kind: 'function',
      signature: 'function resolvedPromise<T>(value: T): Promise<T>',
      jsDoc: 'Create a promise already primed as fulfilled for `usePromise()`.',
    },
    {
      packageName: '@netscript/fresh',
      subpath: './interactive',
      symbol: 'usePromise',
      kind: 'function',
      signature: 'function usePromise<T>(promise: Promise<T>): T',
      jsDoc: 'Read a promise using the Suspense throw-promise protocol.',
    },
  ]);
});

Deno.test('generated payload is deterministic and carries pinned count and hash metadata', async () => {
  const corpus: GeneratedExportSurfaceCorpus = {
    schemaVersion: 1,
    frameworkVersion: '0.0.4',
    surfaces: [{ packageName: '@netscript/fresh', subpath: './interactive' }],
    entries: [{
      packageName: '@netscript/fresh',
      subpath: './interactive',
      symbol: 'usePromise',
      kind: 'function',
      signature: 'function usePromise<T>(promise: Promise<T>): T',
      jsDoc: 'Read a promise using the Suspense throw-promise protocol.',
    }],
  };
  const first = await createGeneratedAsset(corpus);
  const second = await createGeneratedAsset(corpus);
  assertEquals(first, second);
  assertEquals(first.provenance, {
    schemaVersion: 1,
    frameworkVersion: '0.0.4',
    sha256: first.provenance.sha256,
    uncompressedBytes: 362,
    compressedBytes: first.provenance.compressedBytes,
    packageCount: 1,
    subpathCount: 1,
    symbolCount: 1,
  });
  assertMatch(first.provenance.sha256, /^[a-f0-9]{64}$/);
});

Deno.test('renderer covers real first-party interface, variable, alias, and class JSON shapes', async () => {
  const paths = await realEntries(
    'packages/config/src/paths/mod.ts',
    '@netscript/config',
    './paths',
  );
  assertMatch(
    paths.find((entry) => entry.symbol === 'ScaffoldDirs')?.signature ?? '',
    /^interface ScaffoldDirs \{/,
  );
  assertEquals(
    paths.find((entry) => entry.symbol === 'PERMISSIONS')?.signature,
    'const PERMISSIONS: PermissionGroups',
  );

  const builders = await realEntries(
    'packages/fresh/src/application/builders/mod.ts',
    '@netscript/fresh',
    './builders',
  );
  assertMatch(
    builders.find((entry) => entry.symbol === 'InferDefinePageLayerLoaderProps')?.signature ?? '',
    /^type InferDefinePageLayerLoaderProps</,
  );

  const errors = await realEntries(
    'packages/ai/src/contracts/errors.ts',
    '@netscript/ai',
    './errors-fixture',
  );
  const aiError = errors.find((entry) => entry.symbol === 'AiError');
  assert(aiError);
  assertMatch(aiError.signature, /^class AiError/);
});

async function realEntries(path: string, packageName: string, subpath: string) {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', path],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  const document = JSON.parse(new TextDecoder().decode(output.stdout)) as {
    nodes: Record<string, unknown>;
  };
  return normalizeDenoDocNode(Object.values(document.nodes)[0], packageName, subpath);
}

Deno.test('colour-forcing variables are neutralized for nested deno children', () => {
  const previousForce = Deno.env.get('FORCE_COLOR');
  const previousCliColor = Deno.env.get('CLICOLOR_FORCE');
  try {
    Deno.env.set('FORCE_COLOR', '1');
    Deno.env.set('CLICOLOR_FORCE', '1');
    const env = colorInvariantChildEnv();
    assertEquals(env.NO_COLOR, '1');
    assertEquals(env.FORCE_COLOR, undefined);
    assertEquals(env.CLICOLOR_FORCE, undefined);
  } finally {
    if (previousForce === undefined) Deno.env.delete('FORCE_COLOR');
    else Deno.env.set('FORCE_COLOR', previousForce);
    if (previousCliColor === undefined) Deno.env.delete('CLICOLOR_FORCE');
    else Deno.env.set('CLICOLOR_FORCE', previousCliColor);
  }
});

Deno.test('nested deno doc output carries no colour escapes even when the caller forces colour', async () => {
  const entrypoint = new URL('../../../packages/sdk/mod.ts', import.meta.url).pathname;
  const runWith = async (env: Record<string, string>): Promise<string> => {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['doc', '--json', entrypoint],
      env,
      clearEnv: true,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.success, true);
    return new TextDecoder().decode(output.stdout);
  };

  const previousForce = Deno.env.get('FORCE_COLOR');
  try {
    // Simulate a caller whose environment forces colour. The generator's child env must win.
    Deno.env.set('FORCE_COLOR', '1');
    const guarded = await runWith(colorInvariantChildEnv());
    assertEquals(guarded.includes('\\u001b'), false);

    // Control: the same child WITHOUT the guard does emit escapes, so the assertion has teeth.
    const unguarded = await runWith({ ...Deno.env.toObject() });
    assert(unguarded.includes('\\u001b'));

    // And the guarded output is identical whether or not the caller forced colour.
    Deno.env.delete('FORCE_COLOR');
    assertEquals(await runWith(colorInvariantChildEnv()), guarded);
  } finally {
    if (previousForce === undefined) Deno.env.delete('FORCE_COLOR');
    else Deno.env.set('FORCE_COLOR', previousForce);
  }
});

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

const generatorScript = '.llm/tools/docs/generate-export-surface-corpus.ts';

async function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<CommandResult> {
  const output = await new Deno.Command(command, {
    args: [...args],
    cwd,
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

async function runGenerator(
  worktree: string,
  args: readonly string[] = [],
  env?: Record<string, string>,
): Promise<CommandResult> {
  return await runCommand(
    Deno.execPath(),
    [
      'run',
      '--no-lock',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-run=deno,git',
      generatorScript,
      ...args,
    ],
    worktree,
    env,
  );
}

async function withCommittedWorktree(
  run: (worktree: string) => Promise<void>,
): Promise<void> {
  const source = await runCommand('git', ['rev-parse', '--show-toplevel'], Deno.cwd());
  assertEquals(source.code, 0, source.stderr);
  const sourceRoot = source.stdout.trim();
  const worktree = await Deno.makeTempDir({ prefix: 'netscript-mcp-corpus-test-' });
  await Deno.remove(worktree);
  const added = await runCommand(
    'git',
    ['worktree', 'add', '--detach', worktree, 'HEAD'],
    sourceRoot,
  );
  assertEquals(added.code, 0, added.stderr);
  try {
    await run(worktree);
  } finally {
    const removed = await runCommand(
      'git',
      ['worktree', 'remove', '--force', worktree],
      sourceRoot,
    );
    assertEquals(removed.code, 0, removed.stderr);
  }
}

function corpusPath(worktree: string): string {
  return `${worktree}/${EXPORT_SURFACE_CORPUS_OUTPUT}`;
}

async function markArtifactOld(worktree: string): Promise<number> {
  const oldTime = new Date('2000-01-01T00:00:00.000Z');
  await Deno.utime(corpusPath(worktree), oldTime, oldTime);
  return oldTime.getTime();
}

async function assertArtifactWasWritten(worktree: string, oldTime: number): Promise<void> {
  const modified = (await Deno.stat(corpusPath(worktree))).mtime?.getTime() ?? 0;
  assert(modified > oldTime, `expected corpus mtime newer than ${oldTime}, received ${modified}`);
}

Deno.test('write mode generates the artifact from a clean committed tree', async () => {
  await withCommittedWorktree(async (worktree) => {
    const before = await Deno.readFile(corpusPath(worktree));
    const oldTime = await markArtifactOld(worktree);
    const status = await runCommand(
      'git',
      ['status', '--porcelain', '--', 'packages', 'plugins'],
      worktree,
    );
    assertEquals(status.code, 0, status.stderr);
    assertEquals(status.stdout, '');

    const generated = await runGenerator(worktree);
    assertEquals(generated.code, 0, generated.stderr);
    assertEquals(await Deno.readFile(corpusPath(worktree)), before);
    await assertArtifactWasWritten(worktree, oldTime);
  });
});

for (
  const [label, dirtyPath] of [
    ['package', 'packages/sdk/mod.ts'],
    ['plugin', 'plugins/ai/mod.ts'],
  ] as const
) {
  Deno.test(`write mode refuses a dirty ${label} before modifying the artifact`, async () => {
    await withCommittedWorktree(async (worktree) => {
      await Deno.writeTextFile(
        `${worktree}/${dirtyPath}`,
        '\n/** Dirty-tree integration probe. */\nexport const mcpCorpusDirtyProbe: boolean = true;\n',
        { append: true },
      );
      const before = await Deno.readFile(corpusPath(worktree));

      const generated = await runGenerator(worktree);
      assert(generated.code !== 0, 'dirty generation unexpectedly succeeded');
      assertMatch(generated.stderr, /refus/i);
      assert(generated.stderr.includes(dirtyPath), generated.stderr);
      assertEquals(await Deno.readFile(corpusPath(worktree)), before);
    });
  });
}

Deno.test('write mode ignores a dirty path outside the generator read set', async () => {
  await withCommittedWorktree(async (worktree) => {
    await Deno.writeTextFile(`${worktree}/AGENTS.md`, '\n<!-- outside-read-set probe -->\n', {
      append: true,
    });
    const oldTime = await markArtifactOld(worktree);

    const generated = await runGenerator(worktree);
    assertEquals(generated.code, 0, generated.stderr);
    await assertArtifactWasWritten(worktree, oldTime);
  });
});

Deno.test('--check remains freshness-only when the generator read set is dirty', async () => {
  await withCommittedWorktree(async (worktree) => {
    const dirtyPath = 'packages/sdk/README.md';
    await Deno.writeTextFile(`${worktree}/${dirtyPath}`, '\n<!-- check-mode probe -->\n', {
      append: true,
    });

    const checked = await runGenerator(worktree, ['--check']);
    assertEquals(checked.code, 0, checked.stderr);
    assertEquals(checked.stderr.includes(dirtyPath), false);
  });
});

Deno.test('--allow-dirty writes and records the offending path on stderr', async () => {
  await withCommittedWorktree(async (worktree) => {
    const dirtyPath = 'packages/sdk/README.md';
    await Deno.writeTextFile(`${worktree}/${dirtyPath}`, '\n<!-- allow-dirty probe -->\n', {
      append: true,
    });
    const oldTime = await markArtifactOld(worktree);

    const generated = await runGenerator(worktree, ['--allow-dirty']);
    assertEquals(generated.code, 0, generated.stderr);
    assert(generated.stderr.includes('--allow-dirty'), generated.stderr);
    assert(generated.stderr.includes(dirtyPath), generated.stderr);
    await assertArtifactWasWritten(worktree, oldTime);
  });
});

Deno.test('write mode warns and continues when git is unavailable', async () => {
  await withCommittedWorktree(async (worktree) => {
    const oldTime = await markArtifactOld(worktree);
    const denoBin = Deno.execPath().slice(0, Deno.execPath().lastIndexOf('/'));
    const env = { ...Deno.env.toObject(), PATH: denoBin };

    const generated = await runGenerator(worktree, [], env);
    assertEquals(generated.code, 0, generated.stderr);
    assertMatch(generated.stderr, /warning.*git.*unavailable/is);
    await assertArtifactWasWritten(worktree, oldTime);
  });
});
