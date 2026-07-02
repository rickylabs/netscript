import { join } from '@std/path';
import type { NetScriptConfig } from '@netscript/aspire/types';
import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import { generateTsAspireConfig } from '../../templates/aspire/generate-aspire-config.ts';
import {
  buildDefaultTools,
  buildCacheBlock,
  deriveContainerDbResourceName,
  deriveSqliteDbFileName,
} from '../../templates/aspire/generate-appsettings.ts';
import { HelpersGeneratorPipeline } from '../../templates/aspire/helpers/helpers-generator-pipeline.ts';
import type { InitPipelineContext } from './context.ts';

export async function scaffoldTsAppHost(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  const start = performance.now();
  const filesCreated: string[] = [];
  const directoriesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const targetPath = options.targetPath;
  const appProxyPort = PORT_RANGES.APP.start + 10; // 8010 — differs from Vite default (8000)

  // All TS AppHost files live here — isolated from the Deno workspace root.
  const aspireDir = join(targetPath, SCAFFOLD_DIRS.ASPIRE_TS);
  await context.scaffolder.createDir(aspireDir);
  directoriesCreated.push(aspireDir);

  // 1. aspire.config.json (TS AppHost format)
  //
  // Pass the selected DB engine so the generator can declare the matching
  // Aspire Hosting NuGet (Postgres/MySql/etc.). Without it, `aspire restore`
  // produces an `.aspire/modules/aspire.mts` SDK that lacks `builder.addPostgres`
  // and friends — and the generated `.helpers/register-infrastructure.ts`
  // throws "is not a function" at apphost start.
  const aspireConfigContent = generateTsAspireConfig({
    dbEngine: options.dbEngine,
    cache: options.cache,
    cacheBackend: options.cacheBackend,
  });
  const aspireConfigPath = join(aspireDir, SCAFFOLD_FILES.ASPIRE_CONFIG);
  if (await context.scaffolder.writeFile(aspireConfigPath, aspireConfigContent, options.force)) {
    filesCreated.push(aspireConfigPath);
  } else {
    filesSkipped.push(aspireConfigPath);
  }

  // 2. deno.json — makes the Aspire fork's TypeScript AppHost toolchain
  //    resolver select the **Deno** runtime (it runs `deno run -A apphost.mts`
  //    + a `deno check` pre-flight) instead of the Node/tsx toolchain.
  //
  //    Marker precedence in the fork resolver: a bare `package.json` never
  //    selects npm, and `deno.json` outranks `package-lock.json`, so emitting
  //    this file (and NOT a Node `package.json`/`tsconfig`) is what pins the
  //    AppHost to Deno.
  //
  //    - `unstable: ["sloppy-imports"]` is REQUIRED: the fork's SDK codegen
  //      emits `.mjs` import specifiers that point at `.mts` files (e.g.
  //      `base.mts` imports `./transport.mjs`). Deno rejects that by default;
  //      the resolver runs a plain `deno check` with no `--sloppy-imports`
  //      flag, so the workaround has to live in the config.
  //    - `nodeModulesDir: "auto"` + the `vscode-jsonrpc` import map (bare +
  //      subpath) resolve the one npm dependency the generated SDK transport
  //      pulls in (`vscode-jsonrpc/node.js`).
  const denoJsonContent = JSON.stringify(
    {
      nodeModulesDir: 'auto',
      unstable: ['sloppy-imports'],
      imports: {
        'vscode-jsonrpc': 'npm:vscode-jsonrpc@8.2.0',
        'vscode-jsonrpc/': 'npm:/vscode-jsonrpc@8.2.0/',
      },
    },
    null,
    2,
  ) + '\n';
  const denoJsonPath = join(aspireDir, 'deno.json');
  if (await context.scaffolder.writeFile(denoJsonPath, denoJsonContent, options.force)) {
    filesCreated.push(denoJsonPath);
  } else {
    filesSkipped.push(denoJsonPath);
  }

  // 4. .helpers/ directory (inside aspire/)
  const helpersDir = join(aspireDir, SCAFFOLD_DIRS.HELPERS);
  await context.scaffolder.createDir(helpersDir);
  directoriesCreated.push(helpersDir);

  // 5. Build NetScriptConfig for the helpers generator from validated options.
  //    Mirrors what appsettings.json contains after scaffoldRoot writes it.
  const services: NetScriptConfig['Services'] = {};
  if (options.includeExampleService && options.serviceName && options.servicePort) {
    services[options.serviceName] = {
      Enabled: true,
      Runtime: 'deno',
      Port: options.servicePort,
      Entrypoint: 'src/main.ts',
      Workdir: `${SCAFFOLD_DIRS.SERVICES}/${options.serviceName}`,
    };
  }

  const databases: NetScriptConfig['Databases'] = {};
  let primaryDatabase: string | undefined;
  // DatabaseName must match what `generate-appsettings.ts` writes into
  // appsettings.json — otherwise the helpers generator emits a resource
  // name that appsettings has never heard of, and the kebab-vs-underscore
  // drift crashes Aspire's resource-name validator at AppHost startup.
  // Route both sites through the shared helpers.
  const containerDbName = deriveContainerDbResourceName(options.name);
  const sqliteDbFile = deriveSqliteDbFileName(options.name);
  switch (options.dbEngine) {
    case 'postgres':
      databases.postgres = {
        Enabled: true,
        Engine: 'Postgres',
        Mode: 'Container',
        DatabaseName: containerDbName,
        Persistent: true,
        DataPath: '.data/postgres',
      };
      primaryDatabase = 'postgres';
      break;
    case 'mysql':
      databases.mysql = {
        Enabled: true,
        Engine: 'Mysql',
        Mode: 'Container',
        DatabaseName: containerDbName,
        Persistent: true,
        DataPath: '.data/mysql',
      };
      primaryDatabase = 'mysql';
      break;
    case 'mssql':
      databases.mssql = {
        Enabled: true,
        Engine: 'Mssql',
        Mode: 'Container',
        DatabaseName: containerDbName,
        Persistent: true,
        ImageTag: '2022-latest',
      };
      primaryDatabase = 'mssql';
      break;
    case 'sqlite':
      databases.sqlite = {
        Enabled: true,
        Engine: 'Sqlite',
        DatabaseName: sqliteDbFile,
        Persistent: false,
      };
      primaryDatabase = 'sqlite';
      break;
    case 'none':
      // No database registered.
      break;
  }

  const cache = options.cache ? buildCacheBlock(options.cacheBackend) : undefined;
  const caches: NetScriptConfig['Cache'] = cache
    ? {
      [cache.key]: {
        Enabled: true,
        ...cache.block,
      },
    }
    : {};

  const initConfig: NetScriptConfig = {
    Name: options.name,
    Version: SCAFFOLD_DEFAULTS.VERSION,
    ...(primaryDatabase ? { PrimaryDatabase: primaryDatabase } : {}),
    ...(cache ? { PrimaryCache: cache.key } : {}),
    Otel: {
      HttpEndpoint: `http://localhost:${PORT_RANGES.OTEL_COLLECTOR}`,
      Protocol: 'http/protobuf',
    },
    Defaults: {
      Deno: {
        Permissions: ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'],
        WatchMode: false,
      },
    },
    Services: services,
    Apps: {
      [options.appName]: {
        Enabled: true,
        Runtime: 'deno',
        Type: 'app' as const,
        WatchMode: false,
        Port: appProxyPort,
        RequiresKv: false,
        ...(options.includeExampleService && options.serviceName
          ? { ServiceReferences: [options.serviceName] }
          : {}),
      },
    },
    Plugins: {},
    BackgroundProcessors: {},
    Databases: databases,
    Cache: caches,
    Tools: buildDefaultTools(primaryDatabase),
  };

  // 6. Run helpers generator pipeline → apphost.mts + .helpers/*.mts
  //    configPath is relative to `apphost.mts`'s location — which is inside
  //    `aspire/`, so we need to walk one level up to hit the root
  //    `appsettings.json` written by `scaffoldRoot()`.
  const helpersPipeline = new HelpersGeneratorPipeline(context.templateAdapter);
  const generatedFiles = await helpersPipeline.execute({
    config: initConfig,
    configPath: `../${SCAFFOLD_FILES.APPSETTINGS}`, // '../appsettings.json'
    generateAppHost: true,
  });

  // 7. Write all generated files under aspire/ (apphost.mts + .helpers/*.mts)
  for (const file of generatedFiles) {
    const filePath = join(aspireDir, file.path);
    if (await context.scaffolder.writeFile(filePath, file.content, options.force)) {
      filesCreated.push(filePath);
    } else {
      filesSkipped.push(filePath);
    }
  }

  return {
    filesCreated,
    directoriesCreated,
    filesSkipped,
    totalOperations: filesCreated.length + directoriesCreated.length,
    durationMs: performance.now() - start,
  };
}
