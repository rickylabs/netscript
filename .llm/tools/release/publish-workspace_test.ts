import { assertEquals, assertStringIncludes } from '@std/assert';

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

async function writeFixture(root: string): Promise<void> {
  await Deno.mkdir(`${root}/packages/service`, { recursive: true });
  await Deno.mkdir(`${root}/packages/mcp`, { recursive: true });
  await Deno.mkdir(`${root}/plugins`, { recursive: true });
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
