import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
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

Deno.test('cut-local imports install once and survive until config and plugin loading', async () => {
  const repositoryRoot = await Deno.makeTempDir();
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(repositoryRoot, 'packages', 'config'), { recursive: true });
    await Deno.mkdir(join(repositoryRoot, 'plugins', 'fixture'), { recursive: true });
    await Deno.writeTextFile(join(repositoryRoot, 'deno.json'), '{}');
    await Deno.writeTextFile(
      join(repositoryRoot, 'packages', 'config', 'deno.json'),
      JSON.stringify({ name: '@netscript/config', exports: './mod.ts' }),
    );
    await Deno.writeTextFile(
      join(repositoryRoot, 'packages', 'config', 'mod.ts'),
      "export const configSource = 'local';\n",
    );
    await Deno.writeTextFile(
      join(repositoryRoot, 'plugins', 'fixture', 'deno.json'),
      JSON.stringify({ name: '@netscript/plugin-fixture', exports: './mod.ts' }),
    );
    await Deno.writeTextFile(
      join(repositoryRoot, 'plugins', 'fixture', 'mod.ts'),
      "export const pluginSource = 'local';\n",
    );
    await Deno.writeTextFile(
      join(projectRoot, 'deno.json'),
      JSON.stringify({
        imports: {
          '@netscript/config': 'jsr:@netscript/config@99.99.99',
          '@netscript/plugin-fixture': 'jsr:@netscript/plugin-fixture@99.99.99',
        },
      }),
    );

    await useLocalWorkspaceImports(projectRoot, repositoryRoot);

    const projectConfig = JSON.parse(await Deno.readTextFile(join(projectRoot, 'deno.json')));
    projectConfig.workspace = ['./app'];
    await Deno.writeTextFile(
      join(projectRoot, 'deno.json'),
      `${JSON.stringify(projectConfig, null, 2)}\n`,
    );

    const load = await new Deno.Command(Deno.execPath(), {
      args: [
        'eval',
        '--config',
        join(projectRoot, 'deno.json'),
        "const config = await import('@netscript/config'); const plugin = await import('@netscript/plugin-fixture'); if (config.configSource !== 'local' || plugin.pluginSource !== 'local') Deno.exit(1);",
      ],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(load.code, 0, new TextDecoder().decode(load.stderr));
    await assertRejects(
      () => useLocalWorkspaceImports(projectRoot, repositoryRoot),
      Error,
      'already installed',
    );
  } finally {
    await Deno.remove(repositoryRoot, { recursive: true });
    await Deno.remove(projectRoot, { recursive: true });
  }
});
