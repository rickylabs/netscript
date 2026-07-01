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

  // 2. package.json — Node/TypeScript dependencies required by Aspire TS AppHost runtime.
  //    Lives inside `aspire/` to keep the Node.js package graph isolated
  //    from the Deno workspace at the project root.
  const packageJsonContent = JSON.stringify(
    {
      name: `${options.name}-apphost`,
      version: '1.0.0',
      private: true,
      type: 'module',
      dependencies: {
        'vscode-jsonrpc': '8.2.0',
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        tsx: '4.21.0',
        typescript: '^5.9.3',
      },
    },
    null,
    2,
  ) + '\n';
  const packageJsonPath = join(aspireDir, 'package.json');
  if (await context.scaffolder.writeFile(packageJsonPath, packageJsonContent, options.force)) {
    filesCreated.push(packageJsonPath);
  } else {
    filesSkipped.push(packageJsonPath);
  }

  // 3. tsconfig.apphost.json — Aspire 13.4 validates TypeScript AppHosts before startup.
  const tsconfigApphostContent = JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        outDir: './dist/apphost',
        rootDir: '.',
      },
      include: [
        SCAFFOLD_FILES.APPHOST_MTS,
        `${SCAFFOLD_DIRS.ASPIRE_GENERATED}/${SCAFFOLD_DIRS.MODULES}/aspire.mts`,
        `${SCAFFOLD_DIRS.ASPIRE_GENERATED}/${SCAFFOLD_DIRS.MODULES}/base.mts`,
        `${SCAFFOLD_DIRS.ASPIRE_GENERATED}/${SCAFFOLD_DIRS.MODULES}/transport.mts`,
      ],
      exclude: ['node_modules'],
    },
    null,
    2,
  ) + '\n';
  const tsconfigApphostPath = join(aspireDir, SCAFFOLD_FILES.TSCONFIG_APPHOST);
  if (
    await context.scaffolder.writeFile(tsconfigApphostPath, tsconfigApphostContent, options.force)
  ) {
    filesCreated.push(tsconfigApphostPath);
  } else {
    filesSkipped.push(tsconfigApphostPath);
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
