import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import type { PluginManifest } from '@netscript/plugin/config';
import type {
  EmitterPort,
  ExtractedContribution,
  ExtractorPort,
  ManifestResolverPort,
  RegistryEmission,
  WalkedFile,
  WalkerPort,
} from '@netscript/plugin/sdk';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { DirEntry, FileInfo, WalkEntry } from '../../../../kernel/domain/core-types.ts';
import type { ConfigLoaderPort, PluginHostConfig } from './discover-plugins.ts';
import { createHostPluginCommand } from './host-plugin-command.ts';
import { createPluginHostLoader } from './plugin-loader.ts';

describe('plugin host loader', () => {
  it('resolves config plugins, merges contributions, and triggers the walker', async () => {
    const plugins = ['@example/plugin-alpha', '@example/plugin-beta'];
    const configLoader = new FakeConfigLoader(createConfig(plugins));
    const manifestResolver = new FakeManifestResolver([
      createPluginManifest('@example/plugin-alpha', {
        contributions: { services: [{ name: 'alpha-api', entrypoint: './alpha.ts' }] },
      }),
      createPluginManifest('@example/plugin-beta', {
        contributions: {
          backgroundProcessors: [{ name: 'beta-worker', entrypoint: './beta.ts' }],
        },
      }),
    ]);
    const walker = new RecordingWalker();
    const extractor = new FakeExtractor();
    const emitter = new FakeEmitter();
    const loader = createPluginHostLoader({
      projectRoot: '/workspace/app',
      configLoader,
      manifestResolver,
      walker,
      extractor,
      emitter,
      fs: new FakeFileSystem(),
    });

    const state = await loader.resolve();

    assertEquals(manifestResolver.specs, ['@example/plugin-alpha', '@example/plugin-beta']);
    assertEquals(walker.roots, ['/workspace/app']);
    assertEquals(state.plugins.map((plugin) => plugin.name), [
      '@example/plugin-alpha',
      '@example/plugin-beta',
    ]);
    assertEquals(state.contributions.services?.map((service) => service.name), ['alpha-api']);
    assertEquals(extractor.files.map((file) => file.path), ['/workspace/app/plugin.ts']);
    assertEquals(emitter.contributions.map((contribution) => contribution.symbol), [
      'AlphaContribution',
    ]);
    assertEquals(
      state.contributions.backgroundProcessors?.map((processor) => processor.name),
      ['beta-worker'],
    );
    assertEquals(state.emissions, [{ path: '.netscript/generated/plugins.ts', text: '{}' }]);
  });

  it('resolves project root flags before creating the sync loader', async () => {
    const roots: string[] = [];
    const messages: string[] = [];
    const command = createHostPluginCommand({
      resolveProjectRoot: (projectRoot) => Promise.resolve(projectRoot ?? '/workspace/app'),
      createLoader: (projectRoot) => {
        roots.push(projectRoot);
        return {
          resolve: () =>
            Promise.resolve({
              config: createConfig([]),
              plugins: [],
              contributions: {},
              emissions: [],
            }),
        };
      },
      print: (message) => messages.push(message),
    });

    await command.parse(['--project-root', '/workspace/nested']);

    assertEquals(roots, ['/workspace/nested']);
    assertEquals(messages, ['Synchronized 0 plugin(s).']);
  });
});

function createPluginManifest(
  name: string,
  overrides: Partial<PluginManifest> = {},
): PluginManifest {
  return {
    name,
    version: '0.0.1-alpha.0',
    description: `${name} test plugin.`,
    contributions: {},
    ...overrides,
  };
}

function createConfig(plugins: readonly string[]): PluginHostConfig {
  return {
    name: 'test-app',
    version: '1.0.0',
    paths: {
      services: 'services',
      packages: 'packages',
      apps: 'apps',
      workers: 'workers',
      sagas: 'sagas',
      triggers: 'triggers',
      plugins: 'plugins',
      contracts: 'contracts',
      database: 'database',
      tasks: 'tasks',
      deploy: 'deploy',
    },
    logging: {
      level: 'info',
      format: 'text',
      timestamps: true,
    },
    aspire: {
      appHost: 'dotnet/AppHost',
      dashboardPort: 18888,
    },
    databases: { config: [] },
    workers: {
      jobsDir: 'background/workers',
      tasksDir: 'background/tasks',
      queueProvider: 'auto',
      queueName: 'default',
      concurrency: 1,
      jobs: [],
      groups: [],
      enabled: true,
    },
    sagas: {
      sagasDir: 'background/sagas',
      transportProvider: 'auto',
      storeProvider: 'auto',
      concurrency: 1,
      sagas: [],
      groups: [],
      enabled: true,
    },
    triggers: {
      triggersDir: 'background/triggers',
      groups: [],
      enabled: true,
    },
    gateway: {
      enabled: true,
      port: 8000,
    },
    sdk: {},
    deploy: {},
    runtimeConfig: {},
    plugins: [...plugins],
  };
}

class FakeConfigLoader implements ConfigLoaderPort {
  constructor(private readonly config: PluginHostConfig) {}

  load(_projectRoot: string): Promise<PluginHostConfig> {
    return Promise.resolve(this.config);
  }
}

class FakeManifestResolver implements ManifestResolverPort {
  readonly specs: string[] = [];
  private readonly manifests: ReadonlyMap<string, PluginManifest>;

  constructor(manifests: readonly PluginManifest[]) {
    this.manifests = new Map(manifests.map((manifest) => [manifest.name, manifest]));
  }

  resolve(spec: string): Promise<PluginManifest | undefined> {
    this.specs.push(spec);
    return Promise.resolve(this.manifests.get(spec));
  }
}

class RecordingWalker implements WalkerPort {
  readonly roots: string[] = [];

  walk(root: string): Promise<readonly WalkedFile[]> {
    this.roots.push(root);
    return Promise.resolve([{
      path: `${root}/plugin.ts`,
      text: "definePlugin('@example/plugin', '0.0.1-alpha.0').build()",
    }]);
  }
}

class FakeExtractor implements ExtractorPort {
  readonly files: WalkedFile[] = [];

  extract(files: readonly WalkedFile[]): Promise<readonly ExtractedContribution[]> {
    this.files.push(...files);
    return Promise.resolve([{
      file: files[0]?.path ?? '',
      symbol: 'AlphaContribution',
      axis: 'services',
    }]);
  }
}

class FakeEmitter implements EmitterPort {
  readonly contributions: ExtractedContribution[] = [];

  emit(contributions: readonly ExtractedContribution[]): Promise<readonly RegistryEmission[]> {
    this.contributions.push(...contributions);
    return Promise.resolve([{ path: '.netscript/generated/plugins.ts', text: '{}' }]);
  }
}

class FakeFileSystem implements FileSystemPort {
  readFile(_path: string): Promise<string> {
    return Promise.resolve('');
  }

  writeFile(_path: string, _content: string): Promise<void> {
    return Promise.resolve();
  }

  exists(_path: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  stat(_path: string): Promise<FileInfo> {
    return Promise.resolve({ isFile: false, isDirectory: false });
  }

  createDir(_path: string): Promise<void> {
    return Promise.resolve();
  }

  readDir(_path: string): Promise<DirEntry[]> {
    return Promise.resolve([]);
  }

  remove(_path: string): Promise<void> {
    return Promise.resolve();
  }

  copy(_src: string, _dest: string): Promise<void> {
    return Promise.resolve();
  }

  async *walk(_dir: string): AsyncIterable<WalkEntry> {
    yield* [];
  }
}
