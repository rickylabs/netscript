import { defineConfig } from '@netscript/config';
import { assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

import { createPluginListCommand } from './list-plugins-command.ts';

Deno.test('plugin list succeeds for config-registered plugin without userland scaffold manifest', async () => {
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${projectRoot}/workers`, { recursive: true });
    await Deno.writeTextFile(`${projectRoot}/workers/mod.ts`, 'export const jobs = [];\n');

    await createPluginListCommand({
      loadConfig: () =>
        Promise.resolve(defineConfig({
          name: 'fixture-app',
          databases: { config: [] },
          plugins: ['./workers/mod.ts'],
        })),
    }).parse(['--project-root', projectRoot]);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('plugin list reports configured-module identity across first-party topology shapes', async () => {
  const projectRoot = await Deno.makeTempDir();
  const pluginNames = ['ai', 'auth', 'streams', 'workers'];
  try {
    for (const pluginName of pluginNames) {
      const pluginRoot = join(projectRoot, pluginName);
      await Deno.mkdir(pluginRoot, { recursive: true });
      await Deno.writeTextFile(join(pluginRoot, 'mod.ts'), 'export {};\n');
      await Deno.copyFile(
        fromFileUrl(
          new URL(`../../../../../../../plugins/${pluginName}/scaffold.plugin.json`, import.meta.url),
        ),
        join(pluginRoot, 'scaffold.plugin.json'),
      );
    }

    const output: string[] = [];
    await createPluginListCommand({
      loadConfig: () =>
        Promise.resolve(defineConfig({
          name: 'fixture-app',
          databases: { config: [] },
          plugins: pluginNames.map((pluginName) => `./${pluginName}/mod.ts`),
        })),
      print: (line) => output.push(line),
    }).parse(['--project-root', projectRoot]);

    assertEquals(output.slice(1), [
      'ai\tAI Chat\tutility\ttrue\tai\t-\t-\t-\t0',
      'auth\tAuth\tutility\ttrue\tauth\tservices/src/main.ts\t8094\t-\t0',
      'streams\tDurable Streams\tutility\ttrue\tstreams\tservices/src/main.ts\t4437\t-\t0',
      'workers\tBackground Worker\tbackground-processor\ttrue\tworkers\tservices/src/main.ts\t8091\tjobs\t0',
    ]);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('plugin list renders package-backed source truth deliberately', async () => {
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      join(projectRoot, 'plugin.ts'),
      `export default { name: '@example/plugin-chat', version: '1.0.0', contributions: {} };\n`,
    );
    await Deno.writeTextFile(
      join(projectRoot, 'deno.json'),
      JSON.stringify({ imports: { '@example/plugin-chat': './plugin.ts' } }),
    );
    const output: string[] = [];
    await createPluginListCommand({
      loadConfig: () =>
        Promise.resolve(defineConfig({
          name: 'fixture-app',
          databases: { config: [] },
          plugins: ['@example/plugin-chat'],
        })),
      print: (line) => output.push(line),
    }).parse(['--project-root', projectRoot]);

    assertEquals(output[1]?.split('\t')[4], 'package:@example/plugin-chat');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
