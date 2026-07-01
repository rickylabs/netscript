import { join } from '@std/path';
import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import { cli, commandGate, denoCommand } from './gate-factory.ts';

const STANDALONE_DATABASE_CODEGEN_SCRIPT = `
const [databaseUrl, providerEnvKey] = Deno.args;
if (!databaseUrl) throw new Error('database URL argument is required');
Deno.env.set('DATABASE_URL', databaseUrl);
if (providerEnvKey) Deno.env.set(providerEnvKey, databaseUrl);
const child = new Deno.Command('deno', {
  args: ['task', 'db:generate'],
  stdout: 'inherit',
  stderr: 'inherit',
}).spawn();
const status = await child.status;
Deno.exit(status.code);
`;

/** Create database workflow gates for a generated project. */
export function createDatabaseGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.DATABASE_INIT,
      'Initialize generated database',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(
          context,
          'db',
          'init',
          '--project-root',
          context.project.projectRoot,
          '--db',
          context.request.options.database,
          '--name',
          'init',
        ),
    ),
    commandGate(
      GATE.DATABASE_GENERATE,
      'Generate database clients',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(
          context,
          'db',
          'generate',
          '--project-root',
          context.project.projectRoot,
          '--db',
          context.request.options.database,
        ),
    ),
    commandGate(
      GATE.DATABASE_CODEGEN,
      'Generate database clients (standalone, no Aspire)',
      GATE_PHASE.DATABASE,
      standaloneDatabaseCodegenCommand,
      (context) => join(context.project.projectRoot, 'database', context.request.options.database),
    ),
    commandGate(
      GATE.DATABASE_SEED,
      'Seed generated database',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(
          context,
          'db',
          'seed',
          '--project-root',
          context.project.projectRoot,
          '--db',
          context.request.options.database,
        ),
    ),
  ];
}

function standaloneDatabaseCodegenCommand(context: RunContext): readonly string[] {
  const offline = offlineGenerateDatabaseUrl(context.request.options.database);
  return [
    'deno',
    'eval',
    STANDALONE_DATABASE_CODEGEN_SCRIPT,
    offline.url,
    offline.envKey,
  ];
}

function offlineGenerateDatabaseUrl(
  database: string,
): { readonly url: string; readonly envKey: string } {
  switch (database) {
    case 'postgres':
      return {
        url: 'postgres://postgres:postgres@localhost:5432/postgres',
        envKey: 'POSTGRES_URI',
      };
    case 'mysql':
      return {
        url: 'mysql://root:password@localhost:3306/mysql',
        envKey: 'MYSQL_URI',
      };
    case 'mssql':
      return {
        url:
          'sqlserver://localhost:1433;database=master;user=sa;password=Password123;trustServerCertificate=true',
        envKey: 'MSSQL_URI',
      };
    case 'sqlite':
      return { url: 'file:./sqlite.db', envKey: 'SQLITE_URI' };
    default:
      throw new Error(`Unsupported database for standalone codegen: ${database}`);
  }
}

/** Create type-check gates for generated project slices. */
export function createGeneratedCheckGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.GENERATED_SERVICE_CHECK,
      'Type-check generated service workspace',
      GATE_PHASE.DATABASE,
      (context) => denoCommand(context, 'check', '--unstable-kv', './packages', './services'),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_CONTRACTS_CHECK,
      'Type-check generated contracts',
      GATE_PHASE.DATABASE,
      (context) => denoCommand(context, 'check', '--unstable-kv', './contracts'),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_INFRASTRUCTURE_CHECK,
      'Type-check generated infrastructure workspace',
      GATE_PHASE.DATABASE,
      (context) =>
        denoCommand(
          context,
          'check',
          '--unstable-kv',
          './packages',
          './services',
          './contracts',
          './database',
        ),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_DENO_CHECK,
      'Type-check generated workspaces',
      GATE_PHASE.DATABASE,
      (context) => {
        if (context.request.options.packageSource === PACKAGE_SOURCE.JSR) {
          return denoCommand(
            context,
            'check',
            '--unstable-kv',
            './contracts',
            './database',
            './services/users',
          );
        }
        return denoCommand(
          context,
          'check',
          '--unstable-kv',
          './packages',
          './plugins',
          './workers',
          './sagas',
          './triggers',
          './services',
          './database',
        );
      },
      (context) => context.project.projectRoot,
    ),
  ];
}
