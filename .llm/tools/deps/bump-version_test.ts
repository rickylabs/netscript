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

for (
  const [name, newVersion] of [
    ['stable', '1.3.0'],
    ['canary', '1.2.3-canary.1'],
  ] as const
) {
  Deno.test(`coordinated ${name} bump preserves third-party versions`, async () => {
    const temp = await Deno.makeTempDir({ prefix: `netscript-${name}-identity-bump-` });
    try {
      await Deno.mkdir(`${temp}/packages/example`, { recursive: true });
      await Deno.writeTextFile(
        `${temp}/deno.json`,
        JSON.stringify(
          {
            version: '1.2.3',
            workspace: ['packages/*'],
            imports: {
              stream: 'npm:stream@1.2.3',
              streamRange: 'npm:stream@^1.2.3',
            },
            publish: false,
          },
          null,
          2,
        ) + '\n',
      );
      await Deno.writeTextFile(
        `${temp}/packages/example/deno.json`,
        JSON.stringify(
          {
            name: '@netscript/example',
            version: '1.2.3',
            imports: {
              desktop: 'jsr:@netscript/sdk@1.2.3/desktop',
              ranged: 'jsr:@netscript/example@^1.2.3',
              npmMirror: 'npm:@netscript/example@1.2.3',
            },
          },
          null,
          2,
        ) + '\n',
      );
      await Deno.writeTextFile(
        `${temp}/packages/example/scaffold.plugin.json`,
        JSON.stringify(
          {
            version: '1.2.3',
            dependencies: {
              '@netscript/plugin': '1.2.3',
              '@netscript/sdk': '>=1.2.3',
            },
          },
          null,
          2,
        ) + '\n',
      );
      await Deno.writeTextFile(
        `${temp}/deno.lock`,
        JSON.stringify(
          {
            version: '5',
            specifiers: { 'npm:stream@1.2.3': '1.2.3' },
            npm: { 'stream@1.2.3': { integrity: 'sha512-genuine-third-party-pin' } },
            workspace: {
              members: {
                'packages/example': {
                  dependencies: ['jsr:@netscript/example@1.2.3'],
                },
              },
            },
          },
          null,
          2,
        ) + '\n',
      );
      assertEquals((await run('git', ['init'], temp)).code, 0);
      assertEquals((await run('git', ['add', 'deno.lock'], temp)).code, 0);

      const { coordinateVersionBump, findVersionResidue } = await import('./bump-version.ts');
      await coordinateVersionBump(temp, newVersion, name);

      const rootManifest = await Deno.readTextFile(`${temp}/deno.json`);
      const memberManifest = await Deno.readTextFile(`${temp}/packages/example/deno.json`);
      const scaffold = await Deno.readTextFile(
        `${temp}/packages/example/scaffold.plugin.json`,
      );
      const lock = await Deno.readTextFile(`${temp}/deno.lock`);

      assertStringIncludes(rootManifest, `"version": "${newVersion}"`);
      assertStringIncludes(rootManifest, `"stream": "npm:stream@1.2.3"`);
      assertStringIncludes(rootManifest, `"streamRange": "npm:stream@^1.2.3"`);
      assertStringIncludes(memberManifest, `"version": "${newVersion}"`);
      assertStringIncludes(memberManifest, `jsr:@netscript/sdk@${newVersion}/desktop`);
      assertStringIncludes(memberManifest, `jsr:@netscript/example@^${newVersion}`);
      assertStringIncludes(memberManifest, `npm:@netscript/example@${newVersion}`);
      assertStringIncludes(scaffold, `"version": "${newVersion}"`);
      assertStringIncludes(scaffold, `"@netscript/plugin": "${newVersion}"`);
      assertStringIncludes(scaffold, `"@netscript/sdk": ">=${newVersion}"`);
      assertStringIncludes(lock, `"npm:stream@1.2.3": "1.2.3"`);
      assertStringIncludes(lock, `"stream@1.2.3"`);
      assertStringIncludes(lock, `jsr:@netscript/example@${newVersion}`);
      assertEquals(await findVersionResidue(temp, '1.2.3'), []);
    } finally {
      await Deno.remove(temp, { recursive: true });
    }
  });
}

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

Deno.test('findVersionResidue ignores a same-core canary and reports an exact stable residue', async () => {
  const { findVersionResidue } = await import('./bump-version.ts');
  const root = await Deno.makeTempDir({ prefix: 'ns-same-core-canary-residue-' });
  try {
    await Deno.writeTextFile(`${root}/deno.json`, '{"version":"0.0.2-canary.1"}\n');
    await Deno.writeTextFile(
      `${root}/deno.lock`,
      '{"specifier":"jsr:@netscript/sdk@0.0.2-canary.1"}\n',
    );
    assertEquals(await findVersionResidue(root, '0.0.2'), []);

    await Deno.writeTextFile(`${root}/stale.json`, '{"specifier":"jsr:@netscript/sdk@^0.0.2"}\n');
    assertEquals(await findVersionResidue(root, '0.0.2'), [`${root}/stale.json`]);
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

Deno.test('findVersionResidue excludes test fixtures that pin prior published releases', async () => {
  const { findVersionResidue } = await import('./bump-version.ts');
  const root = await Deno.makeTempDir({ prefix: 'ns-fixture-residue-' });
  try {
    await Deno.mkdir(`${root}/packages/cli/src/agent/init/fixtures`, { recursive: true });
    await Deno.mkdir(`${root}/packages/fresh/tests/type-fixtures`, { recursive: true });
    await Deno.writeTextFile(`${root}/deno.json`, '{"version":"0.0.5"}\n');
    await Deno.writeTextFile(
      `${root}/packages/cli/src/agent/init/fixtures/prior-release.mcp.json`,
      '{"specifier":"jsr:@netscript/cli@0.0.4"}\n',
    );
    await Deno.writeTextFile(
      `${root}/packages/fresh/tests/type-fixtures/streamdb-consumer-deno.json`,
      '{"imports":{"@netscript/fresh":"jsr:@netscript/fresh@0.0.4"}}\n',
    );
    assertEquals(await findVersionResidue(root, '0.0.4'), []);

    // The same pin OUTSIDE a fixtures directory is still residue.
    await Deno.writeTextFile(`${root}/stale.json`, '{"specifier":"jsr:@netscript/cli@0.0.4"}\n');
    assertEquals(await findVersionResidue(root, '0.0.4'), [`${root}/stale.json`]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
