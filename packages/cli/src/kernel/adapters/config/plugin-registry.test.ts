import { dirname, resolve, toFileUrl } from '@std/path';
import { defineConfig, loadConfig } from '@netscript/config';
import { artifactText, collectInstallArtifacts } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '@netscript/plugin-ai/adapter';
import { loadRegisteredPluginMetadata, loadRegisteredPlugins } from './plugin-registry.ts';

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

Deno.test('loadRegisteredPlugins resolves the generated AI configured module', async () => {
  const projectRoot = await Deno.makeTempDir();
  const artifacts = collectInstallArtifacts(aiAdapterPlugin);
  for (const artifact of artifacts) {
    const artifactPath = resolve(projectRoot, artifact.path);
    await Deno.mkdir(dirname(artifactPath), { recursive: true });
    await Deno.writeTextFile(artifactPath, artifactText(artifact));
  }
  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: ['./ai/plugin.ts'],
};
`,
  );

  const module = await import(toFileUrl(resolve(projectRoot, 'ai/plugin.ts')).href);
  const manifests = Object.values(module).filter((value: unknown) =>
    value !== null && typeof value === 'object' &&
    typeof Reflect.get(value, 'name') === 'string' &&
    typeof Reflect.get(value, 'version') === 'string' &&
    typeof Reflect.get(value, 'contributions') === 'object'
  );
  if (manifests.length !== 1) {
    throw new Error(
      `Expected exactly one manifest-shaped export from generated AI module, got ${manifests.length}`,
    );
  }

  const config = await loadConfig({ cwd: projectRoot });
  const plugins = await loadRegisteredPlugins(projectRoot, config);
  if (plugins.ai?.name !== '@netscript/plugin-ai') {
    throw new Error('Expected generated AI configured module to resolve through the plugin loader');
  }
});

Deno.test('loadRegisteredPluginMetadata reads scaffold manifests without importing plugin modules', async () => {
  const projectRoot = await Deno.makeTempDir();
  const pluginRoot = resolve(projectRoot, 'plugins/workers');
  await Deno.mkdir(pluginRoot, { recursive: true });
  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: ['./plugins/workers/mod.ts'],
};
`,
  );
  await Deno.writeTextFile(
    resolve(pluginRoot, 'mod.ts'),
    `throw new Error('plugin module should not be imported by metadata loader');`,
  );
  await Deno.writeTextFile(
    resolve(pluginRoot, 'scaffold.plugin.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        provider: {
          displayName: 'Background Worker',
          defaultPermissions: ['--allow-read'],
          defaultEntrypoint: 'bin/combined.ts',
          defaultServiceEntrypoint: 'services/src/main.ts',
          pluginType: 'background-processor',
          infrastructureRequires: ['kv'],
          infrastructureOptionalDeps: ['db'],
          concurrencyEnvVar: 'WORKER_CONCURRENCY',
          defaultConcurrency: 2,
        },
        officialSource: {
          canonicalName: 'workers',
          pluginDir: 'workers',
          serviceEntrypoint: 'services/src/main.ts',
          servicePort: 8091,
          permissions: ['--allow-read'],
          doctorEntrypoint: './src/adapter/plugin.ts',
        },
      },
      null,
      2,
    ),
  );

  const config = await loadConfig({ cwd: projectRoot });
  const plugins = await loadRegisteredPluginMetadata(projectRoot, config);

  if (plugins.workers?.displayName !== 'Background Worker') {
    throw new Error('Expected scaffold manifest metadata to drive plugin display metadata');
  }

  if (plugins.workers.infrastructure?.requires.join(',') !== 'kv') {
    throw new Error('Expected scaffold manifest infrastructure metadata to be normalized');
  }
  if (plugins.workers.doctor !== './src/adapter/plugin.ts') {
    throw new Error('Expected static scaffold metadata to carry the doctor adapter path');
  }
});

Deno.test('loadRegisteredPluginMetadata omits service metadata for a service-less manifest', async () => {
  const projectRoot = await Deno.makeTempDir();
  const pluginRoot = resolve(projectRoot, 'service-less');
  await Deno.mkdir(pluginRoot, { recursive: true });
  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: ['./service-less/mod.ts'],
};
`,
  );
  await Deno.writeTextFile(resolve(pluginRoot, 'mod.ts'), 'export {};\n');
  await Deno.writeTextFile(
    resolve(pluginRoot, 'scaffold.plugin.json'),
    JSON.stringify({
      provider: {
        displayName: 'Service-less plugin',
        defaultEntrypoint: 'mod.ts',
        pluginType: 'utility',
      },
      officialSource: {
        canonicalName: 'service-less',
        backgroundPort: 8124,
      },
    }),
  );

  const config = await loadConfig({ cwd: projectRoot });
  const plugins = await loadRegisteredPluginMetadata(projectRoot, config);
  if (plugins['service-less']?.service !== undefined) {
    throw new Error('Service-less scaffold metadata unexpectedly contributed a service');
  }
});

Deno.test('loadRegisteredPluginMetadata derives identity from the configured module directory', async () => {
  const projectRoot = await Deno.makeTempDir();
  const pluginRoot = resolve(projectRoot, 'extensions/chat');
  await Deno.mkdir(pluginRoot, { recursive: true });
  await Deno.writeTextFile(resolve(pluginRoot, 'mod.ts'), 'export {};\n');
  await Deno.writeTextFile(
    resolve(pluginRoot, 'scaffold.plugin.json'),
    JSON.stringify({
      provider: {
        displayName: 'Service-less plugin',
        defaultEntrypoint: 'mod.ts',
        pluginType: 'utility',
      },
      officialSource: { canonicalName: 'service-less' },
    }),
  );

  const plugins = await loadRegisteredPluginMetadata(
    projectRoot,
    defineConfig({
      name: 'fixture-app',
      databases: { config: [] },
      plugins: ['./extensions/chat/mod.ts'],
    }),
  );
  if (plugins['service-less']?.workdir !== 'extensions/chat') {
    throw new Error('Configured module directory did not determine the service-less workdir');
  }
  if (plugins['service-less']?.rootDir !== pluginRoot) {
    throw new Error('Configured module directory did not determine the service-less rootDir');
  }
});

Deno.test('loadRegisteredPluginMetadata isolates malformed scaffold metadata per plugin', async () => {
  const projectRoot = await Deno.makeTempDir();
  for (const name of ['broken', 'healthy']) {
    const pluginRoot = resolve(projectRoot, `plugins/${name}`);
    await Deno.mkdir(pluginRoot, { recursive: true });
    await Deno.writeTextFile(resolve(pluginRoot, 'mod.ts'), 'export default {};\n');
  }
  await Deno.writeTextFile(
    resolve(projectRoot, 'plugins/broken/scaffold.plugin.json'),
    '{ invalid json',
  );
  await Deno.writeTextFile(
    resolve(projectRoot, 'plugins/healthy/scaffold.plugin.json'),
    JSON.stringify({
      provider: { displayName: 'Healthy' },
      officialSource: { canonicalName: 'healthy' },
    }),
  );
  const config = {
    plugins: ['./plugins/broken/mod.ts', './plugins/healthy/mod.ts'],
  } as never;

  const plugins = await loadRegisteredPluginMetadata(projectRoot, config);

  if (!plugins.broken?.manifestError) {
    throw new Error('Expected malformed plugin metadata to be retained as a plugin-local error');
  }
  if (plugins.healthy?.manifestError || plugins.healthy?.displayName !== 'Healthy') {
    throw new Error('Expected healthy plugin metadata to load after a sibling failure');
  }
});

Deno.test('loadRegisteredPluginMetadata falls back when userland scaffold manifest is absent', async () => {
  const projectRoot = await Deno.makeTempDir();
  const pluginRoot = resolve(projectRoot, 'workers');
  await Deno.mkdir(pluginRoot, { recursive: true });
  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: ['./workers/mod.ts'],
};
`,
  );
  await Deno.writeTextFile(resolve(pluginRoot, 'mod.ts'), `export const jobs = [];\n`);

  const config = await loadConfig({ cwd: projectRoot });
  const plugins = await loadRegisteredPluginMetadata(projectRoot, config);

  if (plugins.workers?.name !== 'workers') {
    throw new Error('Expected workers metadata fallback to be derived from the registered spec');
  }

  if (plugins.workers.workdir !== 'workers') {
    throw new Error(
      `Expected workers fallback workdir to be workers, got ${plugins.workers.workdir}`,
    );
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
