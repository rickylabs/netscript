import { assertEquals, assertStringIncludes } from '@std/assert';
import { join, toFileUrl } from '@std/path';
import { denoChildConfig } from './deno-child-config.ts';

Deno.test('published child configuration keeps the consumer config', async () => {
  assertEquals(
    (await denoChildConfig('consumer/deno.json', 'https://jsr.io/@netscript/cli/0.0.8/mod.ts'))
      .configArgs,
    ['--config', 'consumer/deno.json'],
  );
  assertEquals(
    (await denoChildConfig(undefined, 'https://jsr.io/@netscript/cli/0.0.8/mod.ts')).configArgs,
    [],
  );
});

Deno.test('standalone file CLI does not adopt an unrelated workspace', async () => {
  assertEquals(
    (await denoChildConfig('consumer/deno.json', toFileUrl('/standalone/cli.ts').href)).configArgs,
    [
      '--config',
      'consumer/deno.json',
    ],
  );
});

Deno.test('source child resolves an unpublished pin locally and preserves consumer aliases offline', async () => {
  const root = await Deno.makeTempDir();
  try {
    const workspace = join(root, 'source');
    const cli = join(workspace, 'packages', 'cli');
    const config = join(workspace, 'packages', 'config');
    const consumer = join(root, 'consumer');
    for (const directory of [cli, config, consumer]) {
      await Deno.mkdir(directory, { recursive: true });
    }
    await Deno.writeTextFile(
      join(workspace, 'deno.json'),
      JSON.stringify({ workspace: ['packages/*'] }),
    );
    const version = '0.0.0-unpublished';
    const unpublished = `jsr:@netscript/config@${version}`;
    await Deno.writeTextFile(
      join(cli, 'deno.json'),
      JSON.stringify({
        name: '@netscript/cli',
        version,
        imports: { '@netscript/config': unpublished },
      }),
    );
    await Deno.writeTextFile(
      join(config, 'deno.json'),
      JSON.stringify({
        name: '@netscript/config',
        version,
        exports: { '.': './mod.ts', './identity': './identity.ts' },
      }),
    );
    await Deno.writeTextFile(join(config, 'mod.ts'), 'export const source = import.meta.url;');
    await Deno.writeTextFile(join(config, 'identity.ts'), 'export const identity = "workspace";');
    const projectConfig = join(consumer, 'deno.json');
    await Deno.writeTextFile(
      projectConfig,
      JSON.stringify({
        imports: { '@netscript/config': unpublished, '@consumer/': './' },
        scopes: { './': { '@value': './value.ts' } },
      }),
    );
    await Deno.writeTextFile(join(consumer, 'value.ts'), 'export const value = "consumer";');
    await Deno.writeTextFile(join(consumer, 'alias.ts'), 'export { value } from "@value";');
    const child = join(cli, 'child.ts');
    await Deno.writeTextFile(
      child,
      `import { source } from '@netscript/config';
import { identity } from '@netscript/config/identity';
import { value } from '@consumer/alias.ts';
console.log(JSON.stringify({ source, identity, value, cwd: Deno.cwd() }));`,
    );
    const run = async (configArgs: readonly string[]) =>
      await new Deno.Command(Deno.execPath(), {
        args: ['run', '--cached-only', '--no-lock', '--allow-read', ...configArgs, child],
        cwd: consumer,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
    const negative = await run(['--config', projectConfig]);
    assertEquals(negative.success, false);
    assertStringIncludes(new TextDecoder().decode(negative.stderr), '@netscript/config');
    const positive = await run(
      (await denoChildConfig(projectConfig, toFileUrl(child).href)).configArgs,
    );
    assertEquals(positive.code, 0, new TextDecoder().decode(positive.stderr));
    const expected = {
      source: toFileUrl(join(config, 'mod.ts')).href,
      identity: 'workspace',
      value: 'consumer',
      cwd: consumer,
    };
    assertEquals(JSON.parse(new TextDecoder().decode(positive.stdout)), expected);
    await Deno.rename(projectConfig, join(consumer, 'imports.json'));
    await Deno.writeTextFile(
      projectConfig,
      '// consumer config with a separate map\n' + JSON.stringify({ importMap: './imports.json' }),
    );
    const externalMap = await run(
      (await denoChildConfig(projectConfig, toFileUrl(child).href)).configArgs,
    );
    assertEquals(externalMap.code, 0, new TextDecoder().decode(externalMap.stderr));
    assertEquals(JSON.parse(new TextDecoder().decode(externalMap.stdout)), expected);
    assertEquals(
      (await denoChildConfig(
        projectConfig,
        toFileUrl(child).href,
        toFileUrl(join(consumer, 'generator.ts')).href,
      )).configArgs,
      ['--config', projectConfig],
    );
    assertEquals(
      (await denoChildConfig(
        projectConfig,
        toFileUrl(child).href,
        'https://example.invalid/generator.ts',
      )).configArgs,
      ['--config', projectConfig],
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
