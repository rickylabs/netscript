import { assertEquals } from 'jsr:@std/assert@^1';

import cliMeta from '../../../../deno.json' with { type: 'json' };
import { createPublicCommandTree } from './public-command-tree.ts';

Deno.test('public root command reports the package version', () => {
  const command = createPublicCommandTree({
    cwd: () => Deno.cwd(),
    resolvePath: (path) => path ?? Deno.cwd(),
  });

  assertEquals(command.getVersion(), cliMeta.version);
  assertEquals(command.getVersion() === '1.0.0', false);
});

Deno.test('public init --dry-run leaves the target directory absent', async () => {
  const parent = await Deno.makeTempDir({ prefix: 'netscript-dry-run-' });
  const projectName = 'dry-run-zero';
  const targetPath = `${parent}/${projectName}`;

  try {
    const command = createPublicCommandTree({
      cwd: () => parent,
      resolvePath: (path) => path === undefined ? parent : `${parent}/${path}`,
    });

    await command.parse([
      'init',
      projectName,
      '--path',
      parent,
      '--dry-run',
      '--ci',
      '--yes',
      '--no-aspire',
      '--no-git',
      '--db',
      'none',
    ]);

    await assertPathAbsent(targetPath);
    assertEquals(await readEntryNames(parent), []);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

async function assertPathAbsent(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
  throw new Error(`Expected path to be absent: ${path}`);
}

async function readEntryNames(path: string): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    names.push(entry.name);
  }
  return names.sort();
}
