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
  // produces a `.modules/aspire.ts` SDK that lacks `builder.addPostgres`
  // and friends — and the generated `.helpers/register-infrastructure.ts`
  // throws "is not a function" at apphost start.
  const aspireConfigContent = generateTsAspireConfig({
    dbEngine: options.dbEngine,
  });
  const aspireConfigPath = join(aspireDir, SCAFFOLD_FILES.ASPIRE_CONFIG);
  if (await context.scaffolder.writeFile(aspireConfigPath, aspireConfigContent, options.force)) {
    filesCreated.push(aspireConfigPath);
  } else {
    filesSkipped.push(aspireConfigPath);
  }

  // 2. package.json — tsx + vscode-jsonrpc required by Aspire TS AppHost runtime.
  //    Lives inside `aspire/` to keep the Node.js package graph isolated
  //    from the Deno workspace at the project root.
  const packageJsonContent = JSON.stringify(
    {
      name: `${options.name}-apphost`,
      version: '1.0.0',
      private: true,
      type: 'module',
      devDependencies: {
        tsx: '4.21.0',
        'vscode-jsonrpc': '8.2.0',
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

  // 3. .helpers/ directory (inside aspire/)
  const helpersDir = join(aspireDir, SCAFFOLD_DIRS.HELPERS);
  await context.scaffolder.createDir(helpersDir);
  directoriesCreated.push(helpersDir);

  // 4. Build NetScriptConfig for the helpers generator from validated options.
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
        Mode: 'Container',
        DatabaseName: sqliteDbFile,
        Persistent: false,
      };
      primaryDatabase = 'sqlite';
      break;
    case 'none':
      // No database registered.
      break;
  }

  const initConfig: NetScriptConfig = {
    Name: options.name,
    Version: SCAFFOLD_DEFAULTS.VERSION,
    ...(primaryDatabase ? { PrimaryDatabase: primaryDatabase } : {}),
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
    Cache: {},
    Tools: buildDefaultTools(primaryDatabase),
  };

  // 5. Run helpers generator pipeline → apphost.ts + .helpers/*.ts
  //    configPath is relative to `apphost.ts`'s location — which is inside
  //    `aspire/`, so we need to walk one level up to hit the root
  //    `appsettings.json` written by `scaffoldRoot()`.
  const helpersPipeline = new HelpersGeneratorPipeline(context.templateAdapter);
  const generatedFiles = await helpersPipeline.execute({
    config: initConfig,
    configPath: `../${SCAFFOLD_FILES.APPSETTINGS}`, // '../appsettings.json'
    generateAppHost: true,
  });

  // 6. Write all generated files under aspire/ (apphost.ts + .helpers/*.ts)
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
