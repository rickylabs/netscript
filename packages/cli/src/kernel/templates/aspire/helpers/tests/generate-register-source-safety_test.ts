import {
  assertEquals,
  assertStringIncludes,
} from '@std/assert';
import type {
  AppEntry,
  CacheEntry,
  DatabaseEntry,
  PluginEntry,
  ToolEntry,
} from '@netscript/aspire/types';
import { generateRegisterApps } from '../register/generate-register-apps.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import { generateRegisterTools } from '../register/generate-register-tools.ts';
import { MINIMAL_DENO_DEFAULTS } from './generators-test-support.ts';

const RESERVED_AND_COLLIDING_NAMES = [
  'class',
  'await',
  'function',
  'const',
  'return',
  'a-b',
  'a_b',
  'workers-api',
  'workers_api',
] as const;

const HOSTILE_LITERAL = "quote'\"\\slash`tick${value}\nline";
const HOSTILE_NAMES = [...RESERVED_AND_COLLIDING_NAMES, HOSTILE_LITERAL] as const;

const LINT_RULE_EXCLUSIONS = [
  'no-unused-vars',
  'require-await',
  'no-explicit-any',
].join(',');

async function assertGeneratedSourceParses(label: string, source: string): Promise<void> {
  const directory = await Deno.makeTempDir({ prefix: `netscript-1836-${label}-` });
  const path = `${directory}/${label}.mts`;
  try {
    await Deno.writeTextFile(path, source);
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'lint',
        '--no-config',
        `--rules-exclude=${LINT_RULE_EXCLUSIONS}`,
        path,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const decoder = new TextDecoder();
    const details = [decoder.decode(result.stdout), decoder.decode(result.stderr)]
      .filter(Boolean)
      .join('\n');
    assertEquals(result.code, 0, `${label} generated invalid TypeScript:\n${details}`);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
}

function appEntry(type: AppEntry['Type'] = 'app'): AppEntry {
  return {
    Enabled: true,
    Runtime: 'deno',
    Type: type,
    WatchMode: false,
    RequiresKv: false,
  };
}

function pluginEntry(): PluginEntry {
  return {
    Enabled: true,
    Runtime: 'deno',
    Entrypoint: 'main.ts',
    RequiresKv: false,
    RequiresDb: false,
  };
}

function databaseEntry(): DatabaseEntry {
  return {
    Enabled: true,
    Engine: 'Postgres',
    Mode: 'Container',
    Persistent: false,
  };
}

function cacheEntry(): CacheEntry {
  return {
    Enabled: true,
    Engine: 'Redis',
    Mode: 'Container',
  };
}

Deno.test('source-safe hostile inputs: apps', async () => {
  const apps = Object.fromEntries(
    HOSTILE_NAMES.map((name): [string, AppEntry] => [name, appEntry()]),
  );
  apps.class = {
    ...appEntry(),
    Workdir: HOSTILE_LITERAL,
    TaskName: HOSTILE_LITERAL,
    Prebuild: HOSTILE_LITERAL,
    HealthCheckPath: HOSTILE_LITERAL,
    ServiceReferences: [...HOSTILE_NAMES],
    PluginReferences: [...HOSTILE_NAMES],
  };
  apps.await = {
    ...appEntry('tauri'),
    Workdir: HOSTILE_LITERAL,
    TaskName: HOSTILE_LITERAL,
    Remote: HOSTILE_LITERAL,
  };
  apps.function = {
    ...appEntry('desktop'),
    Workdir: HOSTILE_LITERAL,
    Prebuild: HOSTILE_LITERAL,
    TaskName: HOSTILE_LITERAL,
  };
  apps.const = {
    ...appEntry('task'),
    Workdir: HOSTILE_LITERAL,
    TaskName: HOSTILE_LITERAL,
  };

  const source = generateRegisterApps({
    apps,
    version: 'test',
    denoDefaults: MINIMAL_DENO_DEFAULTS,
  });
  await assertGeneratedSourceParses('apps', source);
  assertStringIncludes(source, JSON.stringify(HOSTILE_LITERAL));
});

Deno.test('source-safe hostile inputs: plugins', async () => {
  const plugins = Object.fromEntries(
    HOSTILE_NAMES.map((name): [string, PluginEntry] => [name, pluginEntry()]),
  );
  plugins.class = {
    ...pluginEntry(),
    Entrypoint: HOSTILE_LITERAL,
    Workdir: HOSTILE_LITERAL,
    HealthCheckPath: HOSTILE_LITERAL,
    Permissions: [HOSTILE_LITERAL],
    Environment: { [HOSTILE_LITERAL]: HOSTILE_LITERAL },
    ServiceReferences: [...HOSTILE_NAMES],
    PluginReferences: [...HOSTILE_NAMES],
  };

  const source = generateRegisterPlugins({
    plugins,
    version: 'test',
    denoDefaults: MINIMAL_DENO_DEFAULTS,
  });
  await assertGeneratedSourceParses('plugins', source);
  assertStringIncludes(source, JSON.stringify(HOSTILE_LITERAL));
});

Deno.test('source-safe hostile inputs: tools', async () => {
  const tools = Object.fromEntries(
    HOSTILE_NAMES.map((name): [string, ToolEntry] => [name, {
      Enabled: true,
      TaskName: HOSTILE_LITERAL,
      Database: HOSTILE_LITERAL,
    }]),
  );

  const source = generateRegisterTools({ tools });
  await assertGeneratedSourceParses('tools', source);
  assertStringIncludes(source, JSON.stringify(HOSTILE_LITERAL));
});

Deno.test('source-safe hostile inputs: infrastructure', async () => {
  const databases = Object.fromEntries(
    HOSTILE_NAMES.map((name): [string, DatabaseEntry] => [name, databaseEntry()]),
  );
  databases[HOSTILE_LITERAL] = {
    Enabled: true,
    Engine: 'Sqlite',
    Mode: 'Container',
    Persistent: false,
    DataPath: HOSTILE_LITERAL,
  };
  databases.class = {
    ...databaseEntry(),
    DatabaseName: HOSTILE_LITERAL,
    DataPath: HOSTILE_LITERAL,
  };
  databases.await = {
    Enabled: true,
    Engine: 'Mssql',
    Mode: 'Container',
    Persistent: false,
    DatabaseName: HOSTILE_LITERAL,
    DataPath: HOSTILE_LITERAL,
    ImageTag: HOSTILE_LITERAL,
  };
  databases.function = {
    Enabled: true,
    Engine: 'Mysql',
    Mode: 'Container',
    Persistent: false,
    DatabaseName: HOSTILE_LITERAL,
    DataPath: HOSTILE_LITERAL,
  };
  databases.const = {
    ...databaseEntry(),
    Mode: 'External',
  };

  const caches = Object.fromEntries(
    HOSTILE_NAMES.map((name): [string, CacheEntry] => [name, cacheEntry()]),
  );
  caches[HOSTILE_LITERAL] = {
    Enabled: true,
    Engine: 'DenoKv',
    Mode: 'Container',
    ImageTag: HOSTILE_LITERAL,
    DataPath: HOSTILE_LITERAL,
  };
  caches.class = {
    Enabled: true,
    Engine: 'Garnet',
    Mode: 'Executable',
    ToolVersion: HOSTILE_LITERAL,
  };
  caches.await = {
    Enabled: true,
    Engine: 'Redis',
    Mode: 'Container',
    ImageTag: HOSTILE_LITERAL,
    DataPath: HOSTILE_LITERAL,
  };
  caches.function = {
    Enabled: true,
    Engine: 'Garnet',
    Mode: 'Auto',
    ImageTag: HOSTILE_LITERAL,
    DataPath: HOSTILE_LITERAL,
    ToolVersion: HOSTILE_LITERAL,
  };
  caches.const = {
    Enabled: true,
    Engine: 'Redis',
    Mode: 'External',
  };
  caches.return = {
    Enabled: true,
    Engine: 'DenoKv',
    Mode: 'Local',
  };

  const source = generateRegisterInfrastructure({
    databases,
    caches,
    primaryDatabase: HOSTILE_LITERAL,
    primaryCache: HOSTILE_LITERAL,
  });
  await assertGeneratedSourceParses('infrastructure', source);
  assertStringIncludes(source, JSON.stringify(HOSTILE_LITERAL));
});
