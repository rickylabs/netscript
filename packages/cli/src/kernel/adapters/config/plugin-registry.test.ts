import { resolve } from '@std/path';
import { loadConfig } from '@netscript/config';
import { loadRegisteredPlugins } from './plugin-registry.ts';

Deno.test('loadRegisteredPlugins returns normalized background processor metadata', async () => {
  const projectRoot = await createPluginRegistryProject();
  const config = await loadConfig({ cwd: projectRoot });
  const plugins = await loadRegisteredPlugins(projectRoot, config);

  const workers = plugins.workers;
  const sagas = plugins.sagas;
  const triggers = plugins.triggers;
  const streams = plugins.streams;

  if (!workers || workers.type !== 'background-processor') {
    throw new Error('Expected workers plugin to be registered as a background processor');
  }

  if (workers.workdir !== 'plugins/workers') {
    throw new Error(
      `Expected workers workdir to normalize to plugins/workers, got ${workers.workdir}`,
    );
  }

  if (!sagas || !triggers || !streams) {
    throw new Error('Expected sagas, triggers, and streams plugins to be registered');
  }

  if (workers.runtimeConfig?.schemas.length !== 0) {
    throw new Error(
      'Expected workers runtime config metadata to preserve schema placeholder shape',
    );
  }
});

Deno.test('loadRegisteredPlugins loads plugin specs from netscript config when omitted', async () => {
  const projectRoot = await createPluginRegistryProject();
  const plugins = await loadRegisteredPlugins(projectRoot);

  if (!plugins.workers || !plugins.sagas || !plugins.triggers || !plugins.streams) {
    throw new Error('Expected background processor plugins to load from netscript.config.ts');
  }

  if (plugins.workers.workdir !== 'plugins/workers') {
    throw new Error('Expected internally loaded config to preserve normalized workdir');
  }
});

Deno.test('loadRegisteredPlugins preserves registry output shape from explicit config specs', async () => {
  const projectRoot = await createPluginRegistryProject();
  const config = await loadConfig({ cwd: projectRoot });
  const plugins = await loadRegisteredPlugins(projectRoot, {
    ...config,
    plugins: ['@netscript/plugin-workers', '@netscript/plugin-streams'],
  });

  const workers = plugins.workers;
  if (!workers) {
    throw new Error('Expected workers plugin to be loaded from explicit config specs');
  }

  if (Object.keys(plugins).join(',') !== 'workers,streams') {
    throw new Error(`Expected only workers plugin, got ${Object.keys(plugins).join(',')}`);
  }

  if (workers.rootDir !== resolve(projectRoot, 'plugins/workers')) {
    throw new Error(`Expected workers rootDir to preserve old shape, got ${workers.rootDir}`);
  }

  if (workers.service?.entrypoint !== './services/src/main.ts') {
    throw new Error('Expected plugin service contribution to preserve entrypoint metadata');
  }
});

async function createPluginRegistryProject(): Promise<string> {
  const projectRoot = await Deno.makeTempDir();
  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: [
    '@netscript/plugin-workers',
    '@netscript/plugin-sagas',
    '@netscript/plugin-triggers',
    '@netscript/plugin-streams',
  ],
};
`,
  );
  return projectRoot;
}
