/**
 * @module templates/database/generate-db-deno-json
 */

import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import { resolveNetScriptImports } from '../../adapters/scaffold/import-resolver.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';
import type { DbEngineProvider } from '../../domain/db-engine.ts';

const DENO_SCRIPT_RUN = 'deno run -A --minimum-dependency-age=0';

/** Options for generating `database/<engine>/deno.json`. */
export interface DatabaseDenoJsonOptions {
  /** Scoped project name. */
  readonly projectName: string;
  /** Import mode for generated dependencies. */
  readonly importMode: PackageSourceMode;
  /** Local import base for `workspace-source` mode. */
  readonly localBase?: string;
}

/**
 * Generate a database workspace `deno.json`.
 *
 * @param provider - Engine provider metadata.
 * @param options - Project/import options.
 * @returns Serialized `deno.json` with trailing newline.
 */
export function generateDatabaseDenoJson(
  provider: DbEngineProvider,
  options: DatabaseDenoJsonOptions,
): string {
  const imports = resolveNetScriptImports(options.importMode, options.localBase);
  const scriptTasks = [
    'deno task db:clear-seeded-client',
    `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 generate --generator client --config prisma.config.ts`,
  ];
  if (provider.capabilities.hasZodGeneration) {
    scriptTasks.push(`${DENO_SCRIPT_RUN} scripts/generate-zod.ts`);
  }
  scriptTasks.push(`${DENO_SCRIPT_RUN} scripts/fix-zod-imports.ts`);

  const tasks: Record<string, string> = {
    'db:generate': scriptTasks.join(' && '),
    [`db:generate:${provider.engine}`]: 'deno task db:generate',
    'db:generate:all': 'deno task db:generate',
    'db:clear-seeded-client':
      'deno run --allow-write=schema/.generated/client.server.ts scripts/clear-seeded-client.ts',
    'db:init': `${DENO_SCRIPT_RUN} scripts/migrate.ts --name=init`,
    [`db:init:${provider.engine}`]: 'deno task db:init',
    'db:init:all': 'deno task db:init',
    'db:migrate': `${DENO_SCRIPT_RUN} scripts/migrate.ts`,
    [`db:migrate:${provider.engine}`]: 'deno task db:migrate',
    'db:migrate:all': 'deno task db:migrate',
    'db:migrate:deploy':
      `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 migrate deploy --config prisma.config.ts`,
    'db:push': `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 db push --config prisma.config.ts`,
    'db:studio':
      `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 studio --config prisma.config.ts --port 5555`,
    [`db:studio:${provider.engine}`]: 'deno task db:studio',
    'db:studio:all': 'deno task db:studio',
    'db:seed': `${DENO_SCRIPT_RUN} ./scripts/seed.ts`,
    [`db:seed:${provider.engine}`]: 'deno task db:seed',
    'db:seed:all': 'deno task db:seed',
    'db:introspect': `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 db pull --config prisma.config.ts`,
    [`db:introspect:${provider.engine}`]: 'deno task db:introspect',
    'db:introspect:all': 'deno task db:introspect',
    'db:reset':
      `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 migrate reset --force --config prisma.config.ts`,
    [`db:reset:${provider.engine}`]: 'deno task db:reset',
    'db:reset:all': 'deno task db:reset',
    'db:status': `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 migrate status --config prisma.config.ts`,
    [`db:status:${provider.engine}`]: 'deno task db:status',
    'db:status:all': 'deno task db:status',
    'db:validate': `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 validate --schema schema/schema.prisma`,
  };

  if (provider.capabilities.hasPrismaFormat) {
    tasks['db:format'] = `${DENO_SCRIPT_RUN} npm:prisma@^7.4.2 format --schema schema/schema.prisma`;
  }
  if (provider.capabilities.hasZodGeneration) {
    tasks['db:zod'] = `${DENO_SCRIPT_RUN} scripts/generate-zod.ts`;
  }
  tasks['db:patch-client'] = `${DENO_SCRIPT_RUN} scripts/patch-prisma-client.ts`;
  tasks['db:fix-zod'] = `${DENO_SCRIPT_RUN} scripts/fix-zod-imports.ts`;
  const databaseImports = options.importMode === 'local'
    ? {
      [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]:
        imports[SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS],
      [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]:
        imports[SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING],
    }
    : {
      [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: imports[SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE],
      [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]:
        `${imports[SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]}/scripts`,
      [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]:
        `${imports[SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]}/tracing`,
    };

  const config = {
    name: `@${options.projectName}/database-${provider.engine}`,
    version: '1.0.0',
    exports: {
      '.': './mod.ts',
      './zod': './schema/.generated/zod/schemas/index.ts',
    },
    tasks,
    imports: {
      prisma: 'npm:prisma@^7.4.2',
      '@prisma/client': 'npm:@prisma/client@^7.4.2',
      '@prisma/instrumentation-contract': 'npm:@prisma/instrumentation-contract@^7.4.2',
      '@opentelemetry/api': 'npm:@opentelemetry/api@^1.9.0',
      dotenv: 'npm:dotenv@^16.4.7',
      zod: 'npm:zod@^4.3.6',
      ...databaseImports,
      [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: imports[SCAFFOLD_PACKAGES.NETSCRIPT_SDK],
      ...adapterImports(provider.engine, imports),
    },
    compilerOptions: {
      lib: ['deno.ns', 'deno.unstable', 'dom'],
      strict: true,
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}

function adapterImports(
  engine: DbEngineProvider['engine'],
  imports: Record<string, string>,
): Record<string, string> {
  if (engine === 'postgres') {
    return {
      '@prisma/adapter-pg': 'npm:@prisma/adapter-pg@^7.4.2',
      pg: 'npm:pg@^8.13.1',
    };
  }
  if (engine === 'mysql') {
    return {
      [SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL]:
        imports[SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL],
    };
  }
  if (engine === 'mssql') {
    return { '@prisma/adapter-mssql': 'npm:@prisma/adapter-mssql@^7.4.2' };
  }
  if (engine === 'sqlite') {
    return { '@prisma/adapter-libsql': 'npm:@prisma/adapter-libsql@^7.4.2' };
  }
  return {};
}
