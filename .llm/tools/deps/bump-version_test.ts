import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

async function run(command: string, args: string[], cwd: string) {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

Deno.test('bump-version wrapper preserves native dry-run output', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'netscript-bump-version-' });
  try {
    await Deno.writeTextFile(`${temp}/deno.json`, '{"version":"1.2.3","publish":false}\n');
    const native = await run('deno', ['bump-version', 'patch', '--dry-run'], temp);
    const wrapped = await run(
      'deno',
      [
        'run',
        '--allow-read',
        '--allow-run',
        '--allow-env',
        `${Deno.cwd()}/.llm/tools/deps/bump-version.ts`,
        '--cwd',
        temp,
        '--json',
        'patch',
        '--dry-run',
      ],
      Deno.cwd(),
    );
    const result = JSON.parse(wrapped.stdout) as {
      exitCode: number;
      stdout: string;
      stderr: string;
    };
    assertEquals(wrapped.code, native.code);
    assertEquals(result.exitCode, native.code);
    assertEquals(result.stdout, native.stdout);
    assertEquals(result.stderr, native.stderr);
    assertStringIncludes(result.stdout, '1.2.3 -> 1.2.4');
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('bump-version wrapper coordinates an exact version with zero residue', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'netscript-bump-version-exact-' });
  try {
    await Deno.mkdir(`${temp}/packages/example`, { recursive: true });
    await Deno.writeTextFile(
      `${temp}/deno.json`,
      JSON.stringify({ version: '1.2.3', workspace: ['packages/*'], publish: false }, null, 2) +
        '\n',
    );
    await Deno.writeTextFile(
      `${temp}/packages/example/deno.json`,
      JSON.stringify({ name: '@netscript/example', version: '1.2.3' }, null, 2) + '\n',
    );
    await Deno.writeTextFile(
      `${temp}/deno.lock`,
      JSON.stringify(
        {
          workspace: {
            members: { 'packages/example': { dependencies: ['jsr:@netscript/example@1.2.3'] } },
          },
        },
        null,
        2,
      ) + '\n',
    );
    await Deno.writeTextFile(
      `${temp}/packages/example/deno.lock`,
      JSON.stringify(
        {
          workspace: {
            members: { '.': { dependencies: ['jsr:@netscript/example@1.2.3'] } },
          },
        },
        null,
        2,
      ) + '\n',
    );
    await run('git', ['init'], temp);
    await run('git', ['add', 'deno.lock', 'packages/example/deno.lock'], temp);
    const wrapped = await run(
      'deno',
      [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        '--allow-env',
        `${Deno.cwd()}/.llm/tools/deps/bump-version.ts`,
        '--cwd',
        temp,
        '--json',
        '1.3.0',
      ],
      Deno.cwd(),
    );
    const result = JSON.parse(wrapped.stdout) as { ok: boolean; files: string[] };
    assertEquals(wrapped.code, 0);
    assertEquals(result.ok, true);
    assertEquals(result.files.length, 4);
    for (
      const path of [
        `${temp}/deno.json`,
        `${temp}/packages/example/deno.json`,
        `${temp}/deno.lock`,
        `${temp}/packages/example/deno.lock`,
      ]
    ) {
      assertStringIncludes(await Deno.readTextFile(path), '1.3.0');
      assertEquals((await Deno.readTextFile(path)).includes('1.2.3'), false);
    }
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('discoverVersionFiles includes tracked locks and excludes untracked adjacent locks', async () => {
  const { discoverVersionFiles } = await import('./bump-version.ts');
  const root = await Deno.makeTempDir({ prefix: 'ns-tracked-lock-discovery-' });
  try {
    await Deno.mkdir(`${root}/packages/tracked`, { recursive: true });
    await Deno.mkdir(`${root}/packages/untracked`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ version: '1.2.3', workspace: ['packages/*'] }),
    );
    for (const member of ['tracked', 'untracked']) {
      await Deno.writeTextFile(
        `${root}/packages/${member}/deno.json`,
        JSON.stringify({ name: `@netscript/${member}`, version: '1.2.3' }),
      );
      await Deno.writeTextFile(`${root}/packages/${member}/deno.lock`, '{"version":"4"}\n');
    }
    await Deno.writeTextFile(`${root}/deno.lock`, '{"version":"4"}\n');
    assertEquals((await run('git', ['init'], root)).code, 0);
    assertEquals(
      (await run('git', ['add', 'deno.lock', 'packages/tracked/deno.lock'], root)).code,
      0,
    );

    const files = await discoverVersionFiles(root);
    assertEquals(files.includes(`${root}/deno.lock`), true);
    assertEquals(files.includes(`${root}/packages/tracked/deno.lock`), true);
    assertEquals(files.includes(`${root}/packages/untracked/deno.lock`), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('discoverVersionFiles falls back to existing locks outside a Git worktree', async () => {
  const { discoverVersionFiles } = await import('./bump-version.ts');
  const root = await Deno.makeTempDir({ prefix: 'ns-non-git-lock-discovery-' });
  try {
    await Deno.mkdir(`${root}/packages/example`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ version: '1.2.3', workspace: ['packages/*'] }),
    );
    await Deno.writeTextFile(
      `${root}/packages/example/deno.json`,
      JSON.stringify({ name: '@netscript/example', version: '1.2.3' }),
    );
    await Deno.writeTextFile(`${root}/deno.lock`, '{"version":"4"}\n');
    await Deno.writeTextFile(`${root}/packages/example/deno.lock`, '{"version":"4"}\n');

    const files = await discoverVersionFiles(root);
    assertEquals(files.includes(`${root}/deno.lock`), true);
    assertEquals(files.includes(`${root}/packages/example/deno.lock`), true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('findVersionResidue reports a prior release retained in a nested member lock', async () => {
  const { findVersionResidue } = await import('./bump-version.ts');
  const root = await Deno.makeTempDir({ prefix: 'ns-nested-lock-residue-' });
  try {
    await Deno.mkdir(`${root}/packages/example`, { recursive: true });
    await Deno.writeTextFile(`${root}/deno.json`, '{"version":"0.0.2"}\n');
    await Deno.writeTextFile(
      `${root}/packages/example/deno.lock`,
      '{"workspace":{"dependencies":["jsr:@netscript/sdk@0.0.1-beta.12"]}}\n',
    );
    assertEquals(await findVersionResidue(root, '0.0.1-beta.12'), [
      `${root}/packages/example/deno.lock`,
    ]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('findVersionResidue excludes captured public-surface baseline snapshots', async () => {
  const { findVersionResidue } = await import('./bump-version.ts');
  const root = await Deno.makeTempDir({ prefix: 'ns-residue-' });
  try {
    // A live manifest correctly bumped to the new version → not residue.
    await Deno.writeTextFile(`${root}/deno.json`, JSON.stringify({ version: '0.0.1-beta.9' }));
    // A captured surface snapshot legitimately embedding the previous version →
    // must NOT be flagged as residue (it is the baseline the next release diffs
    // against, not a live version manifest).
    await Deno.mkdir(`${root}/.llm/tools/release/baselines`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/.llm/tools/release/baselines/public-surfaces.json`,
      JSON.stringify({ rootVersion: '0.0.1-beta.8', packages: {} }),
    );
    const residue = await findVersionResidue(root, '0.0.1-beta.8');
    assertEquals(residue, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
