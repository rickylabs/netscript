import { defineConfig } from '@netscript/config';

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
