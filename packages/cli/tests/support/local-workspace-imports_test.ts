import { assertRejects } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { useLocalWorkspaceImports } from './local-workspace-imports.ts';

Deno.test('cut-local imports fail closed when a first-party export target is missing', async () => {
  const repositoryRoot = await Deno.makeTempDir();
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(repositoryRoot, 'packages', 'missing'), { recursive: true });
    await Deno.mkdir(join(repositoryRoot, 'plugins'), { recursive: true });
    await Deno.writeTextFile(join(repositoryRoot, 'deno.json'), '{}');
    await Deno.writeTextFile(
      join(repositoryRoot, 'packages', 'missing', 'deno.json'),
      JSON.stringify({
        name: '@netscript/missing',
        exports: { '.': './mod.ts' },
      }),
    );
    await Deno.writeTextFile(join(projectRoot, 'deno.json'), '{}');

    await assertRejects(
      () => useLocalWorkspaceImports(projectRoot, repositoryRoot),
      Deno.errors.NotFound,
      'mod.ts',
    );
  } finally {
    await Deno.remove(repositoryRoot, { recursive: true });
    await Deno.remove(projectRoot, { recursive: true });
  }
});
