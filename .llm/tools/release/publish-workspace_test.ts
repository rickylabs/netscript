import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';

import { publishMemberDryRun, publishWorkspace } from './publish-workspace.ts';

Deno.test('publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace', async () => {
  const sourceRoot = await Deno.makeTempDir({ prefix: 'netscript-publish-source-' });
  try {
    await writeFixture(sourceRoot);
    const servicePath = `${sourceRoot}/packages/service/deno.json`;
    const mcpPath = `${sourceRoot}/packages/mcp/deno.json`;
    const lockPath = `${sourceRoot}/deno.lock`;
    const before = await readFiles([servicePath, mcpPath, lockPath]);

    await publishWorkspace({
      mode: 'dry-run',
      root: sourceRoot,
      commandRunner: async ({ args, cwd }) => {
        assertEquals(args, ['publish', '--allow-dirty', '--dry-run']);

        const materializedService = await Deno.readTextFile(
          `${cwd}/packages/service/deno.json`,
        );
        assertStringIncludes(materializedService, '"zod": "npm:zod@^4.4.3"');

        const mcpConfig = JSON.parse(
          await Deno.readTextFile(`${cwd}/packages/mcp/deno.json`),
        ) as Record<string, unknown>;
        mcpConfig.publish = ['deno.json', 'mod.ts', 'expanded-by-deno.ts'];
        await Deno.writeTextFile(
          `${cwd}/packages/mcp/deno.json`,
          `${JSON.stringify(mcpConfig, null, 2)}\n`,
        );
        await Deno.writeTextFile(`${cwd}/deno.lock`, 'mutated by dry-run');
        assertEquals(cwd.startsWith(sourceRoot), false);

        return { code: 0, stdout: new Uint8Array(), stderr: new Uint8Array() };
      },
    });

    assertEquals(await readFiles([servicePath, mcpPath, lockPath]), before);
  } finally {
    await Deno.remove(sourceRoot, { recursive: true });
  }
});

Deno.test('package dry-run isolates MCP publish array rewrites', async () => {
  const sourceRoot = await Deno.makeTempDir({ prefix: 'netscript-publish-member-source-' });
  try {
    await writeFixture(sourceRoot);
    const mcpPath = `${sourceRoot}/packages/mcp/deno.json`;
    const lockPath = `${sourceRoot}/deno.lock`;
    const before = await readFiles([mcpPath, lockPath]);

    await publishMemberDryRun(sourceRoot, 'packages/mcp', async ({ args, cwd }) => {
      assertEquals(args, ['publish', '--allow-dirty', '--dry-run']);
      const mcpConfig = JSON.parse(await Deno.readTextFile(`${cwd}/deno.json`)) as Record<
        string,
        unknown
      >;
      mcpConfig.publish = ['deno.json', 'mod.ts', 'expanded-by-deno.ts'];
      await Deno.writeTextFile(`${cwd}/deno.json`, `${JSON.stringify(mcpConfig, null, 2)}\n`);
      await Deno.writeTextFile(`${cwd}/../../deno.lock`, 'mutated by package dry-run');
      assertEquals(cwd.startsWith(sourceRoot), false);
      return { code: 0, stdout: new Uint8Array(), stderr: new Uint8Array() };
    });

    assertEquals(await readFiles([mcpPath, lockPath]), before);
  } finally {
    await Deno.remove(sourceRoot, { recursive: true });
  }
});

for (const mode of ['publish', 'preflight'] as const) {
  Deno.test(`interrupted ${mode} cannot materialize catalog imports in the source tree`, async () => {
    const sourceRoot = await Deno.makeTempDir({ prefix: `netscript-${mode}-interrupt-source-` });
    const handshakeRoot = await Deno.makeTempDir({
      prefix: `netscript-${mode}-interrupt-handshake-`,
    });
    const handshakePath = `${handshakeRoot}/ready.json`;
    let publishRoot: string | undefined;

    try {
      await writeFixture(sourceRoot);
      await initializeGitFixture(sourceRoot);

      const servicePath = `${sourceRoot}/packages/service/deno.json`;
      const lockPath = `${sourceRoot}/deno.lock`;
      const lockBefore = await Deno.readTextFile(lockPath);
      const helper = new URL('./tests/fixtures/publish-interrupt-helper.ts', import.meta.url);
      const child = new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-read',
          '--allow-write',
          '--allow-run',
          helper.pathname,
          mode,
          sourceRoot,
          handshakePath,
        ],
        stdout: 'inherit',
        stderr: 'inherit',
      }).spawn();

      const handshake = await waitForHandshake(handshakePath, child);
      publishRoot = handshake.cwd;
      child.kill('SIGKILL');
      const status = await child.status;

      assertEquals(status.success, false, 'the helper must be terminated by SIGKILL');
      assertEquals(
        await gitOutput(sourceRoot, ['status', '--porcelain']),
        '',
        `${mode} left tracked source files dirty after SIGKILL`,
      );
      assertStringIncludes(await Deno.readTextFile(servicePath), '"zod": "catalog:"');
      assertEquals(await Deno.readTextFile(lockPath), lockBefore);
      assertStringIncludes(handshake.serviceManifest, '"zod": "npm:zod@^4.4.3"');
      assertEquals(isPathInside(sourceRoot, handshake.cwd), false);
      assertEquals(handshake.args, expectedPublishArgs(mode));
    } finally {
      if (publishRoot && !isPathInside(sourceRoot, publishRoot)) {
        await removeFixtureWorktree(sourceRoot, publishRoot);
      }
      await Deno.remove(sourceRoot, { recursive: true });
      await Deno.remove(handshakeRoot, { recursive: true });
    }
  });
}

Deno.test('real publish rejects a symlinked member manifest before materialization', async () => {
  const sourceRoot = await Deno.makeTempDir({ prefix: 'netscript-publish-symlink-source-' });
  const targetRoot = await Deno.makeTempDir({ prefix: 'netscript-publish-symlink-target-' });
  const targetPath = `${targetRoot}/service-deno.json`;
  const targetSource = `${
    JSON.stringify(
      {
        name: '@netscript/service',
        imports: { zod: 'catalog:' },
        exports: './mod.ts',
      },
      null,
      2,
    )
  }\n`;

  try {
    await Deno.mkdir(`${sourceRoot}/packages/service`, { recursive: true });
    await Deno.mkdir(`${sourceRoot}/plugins`, { recursive: true });
    await Deno.writeTextFile(
      `${sourceRoot}/deno.json`,
      `${JSON.stringify({ catalog: { zod: '^4.4.3' } }, null, 2)}\n`,
    );
    await Deno.writeTextFile(`${sourceRoot}/deno.lock`, '{\n  "version": "5"\n}\n');
    await Deno.writeTextFile(
      `${sourceRoot}/packages/service/mod.ts`,
      'export const service = true;\n',
    );
    await Deno.writeTextFile(`${sourceRoot}/plugins/.gitkeep`, '');
    await Deno.writeTextFile(targetPath, targetSource);
    await Deno.symlink(targetPath, `${sourceRoot}/packages/service/deno.json`);
    await initializeGitRepository(sourceRoot, [
      'deno.json',
      'deno.lock',
      'packages/service/deno.json',
      'packages/service/mod.ts',
      'plugins/.gitkeep',
    ]);

    await assertRejects(
      () =>
        publishWorkspace({
          mode: 'publish',
          root: sourceRoot,
          commandRunner: async () => {
            throw new Error('publisher must not run for a symlinked manifest');
          },
        }),
      Error,
      'Publish manifest must be a regular file',
    );
    assertEquals(await Deno.readTextFile(targetPath), targetSource);
    assertEquals(await gitOutput(sourceRoot, ['status', '--porcelain']), '');
  } finally {
    await Deno.remove(sourceRoot, { recursive: true });
    await Deno.remove(targetRoot, { recursive: true });
  }
});

async function writeFixture(root: string): Promise<void> {
  await Deno.mkdir(`${root}/packages/service`, { recursive: true });
  await Deno.mkdir(`${root}/packages/mcp`, { recursive: true });
  await Deno.mkdir(`${root}/plugins`, { recursive: true });
  await Deno.writeTextFile(`${root}/plugins/.gitkeep`, '');
  await Deno.writeTextFile(
    `${root}/deno.json`,
    `${JSON.stringify({ catalog: { zod: '^4.4.3' } }, null, 2)}\n`,
  );
  await Deno.writeTextFile(`${root}/deno.lock`, '{\n  "version": "5"\n}\n');
  await Deno.writeTextFile(
    `${root}/packages/service/deno.json`,
    `${
      JSON.stringify(
        {
          name: '@netscript/service',
          imports: { zod: 'catalog:' },
          exports: './mod.ts',
        },
        null,
        2,
      )
    }\n`,
  );
  await Deno.writeTextFile(`${root}/packages/service/mod.ts`, 'export const service = true;\n');
  await Deno.writeTextFile(
    `${root}/packages/mcp/deno.json`,
    `${
      JSON.stringify(
        {
          name: '@netscript/mcp',
          publish: ['deno.json', 'mod.ts'],
          exports: './mod.ts',
        },
        null,
        2,
      )
    }\n`,
  );
  await Deno.writeTextFile(`${root}/packages/mcp/mod.ts`, 'export const mcp = true;\n');
}

async function readFiles(paths: readonly string[]): Promise<readonly string[]> {
  return await Promise.all(paths.map((path) => Deno.readTextFile(path)));
}

interface InterruptHandshake {
  readonly args: readonly string[];
  readonly cwd: string;
  readonly serviceManifest: string;
}

async function initializeGitFixture(root: string): Promise<void> {
  await initializeGitRepository(root, [
    'deno.json',
    'deno.lock',
    'packages/service/deno.json',
    'packages/service/mod.ts',
    'packages/mcp/deno.json',
    'packages/mcp/mod.ts',
    'plugins/.gitkeep',
  ]);
}

async function initializeGitRepository(root: string, paths: readonly string[]): Promise<void> {
  await runGit(root, ['init', '--quiet']);
  await runGit(root, ['config', 'user.name', 'NetScript test']);
  await runGit(root, ['config', 'user.email', 'netscript-test@example.invalid']);
  await runGit(root, ['add', ...paths]);
  await runGit(root, ['commit', '--quiet', '-m', 'test fixture']);
}

async function waitForHandshake(
  path: string,
  child: Deno.ChildProcess,
): Promise<InterruptHandshake> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      return parseInterruptHandshake(await Deno.readTextFile(path));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        child.kill('SIGKILL');
        await child.status;
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  child.kill('SIGKILL');
  await child.status;
  throw new Error(`Timed out waiting for interrupt handshake at ${path}`);
}

function parseInterruptHandshake(source: string): InterruptHandshake {
  const value: unknown = JSON.parse(source);
  if (
    typeof value !== 'object' || value === null ||
    !('args' in value) || !Array.isArray(value.args) ||
    !value.args.every((arg) => typeof arg === 'string') ||
    !('cwd' in value) || typeof value.cwd !== 'string' ||
    !('serviceManifest' in value) || typeof value.serviceManifest !== 'string'
  ) {
    throw new Error('Interrupt helper wrote an invalid handshake.');
  }
  return {
    args: value.args,
    cwd: value.cwd,
    serviceManifest: value.serviceManifest,
  };
}

function expectedPublishArgs(mode: 'publish' | 'preflight'): readonly string[] {
  return mode === 'publish' ? ['publish', '--allow-dirty'] : [
    'publish',
    '--allow-dirty',
    '--no-provenance',
    '--token',
    'jsr-preflight-no-upload-invalid-token',
  ];
}

function isPathInside(parent: string, candidate: string): boolean {
  return candidate === parent || candidate.startsWith(`${parent}/`);
}

async function removeFixtureWorktree(root: string, worktree: string): Promise<void> {
  await runGit(root, ['worktree', 'remove', '--force', worktree]);
  await runGit(root, ['worktree', 'prune']);
}

async function gitOutput(root: string, args: readonly string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args: ['-C', root, ...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(new TextDecoder().decode(result.stderr));
  }
  return new TextDecoder().decode(result.stdout);
}

async function runGit(root: string, args: readonly string[]): Promise<void> {
  await gitOutput(root, args);
}
