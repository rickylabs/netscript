/**
 * Prisma Migration Script
 *
 * Generic migration runner that works with any Prisma database.
 * Handles both interactive and non-interactive migration modes.
 *
 * Environment Variables:
 *   - PRISMA_MIGRATION_NAME: Create new migration with this name
 *   - CI=true: Non-interactive mode (migrate deploy)
 *   - DATABASE_URL or any *_URI variable: Non-interactive mode
 *
 * Usage:
 *   import { runMigration } from '@netscript/database/scripts';
 *   await runMigration({ provider: 'mysql' });
 *
 * @module
 */

export interface MigrationOptions {
  /** Database provider ('mssql' | 'postgres' | 'mysql' | 'sqlite') */
  provider: 'mssql' | 'postgres' | 'mysql' | 'sqlite';
  /** Path to prisma.config.ts (relative to working directory) */
  configPath?: string;
  /** Explicit migration name override. */
  migrationName?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Run Prisma migration
 *
 * @param options - Migration configuration
 * @returns Exit code from Prisma CLI
 */
export async function runMigration(options: MigrationOptions): Promise<number> {
  const {
    provider,
    configPath = 'prisma.config.ts',
    migrationName: requestedMigrationName,
    verbose = true,
  } = options;
  const log = verbose ? console.log.bind(console) : () => {};

  const migrationName = requestedMigrationName ?? Deno.env.get('PRISMA_MIGRATION_NAME');
  const isCI = Deno.env.get('CI') === 'true';
  const hasDbUri = hasDatabaseUri();
  const nonInteractive = isCI || hasDbUri;

  if (verbose) {
    log('--- ENV VARS FOR PRISMA MIGRATION ---');
    log(`DATABASE_URL: ${Deno.env.get('DATABASE_URL') || '(not set)'}`);
    log(`*_URI: ${hasDbUri ? '(detected)' : '(not set)'}`);
    log(`CI: ${isCI}`);
    log(`Provider: ${provider}`);
    log('-------------------------------------');
  }

  // If migration name is provided, create a new migration
  if (migrationName) {
    log(`🔄 Creating migration with name: ${migrationName}`);
    const command = new Deno.Command('deno', {
      args: [
        'run',
        '-A',
        'npm:prisma',
        'migrate',
        'dev',
        '--config',
        configPath,
        '--name',
        migrationName,
      ],
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const { code } = await command.output();
    return code;
  }

  // In non-interactive mode (Aspire/CI), use migrate deploy to apply existing migrations
  if (nonInteractive) {
    log(`🔄 Non-interactive mode (Aspire: ${hasDbUri}, CI: ${isCI}), using migrate deploy...`);
    const command = new Deno.Command('deno', {
      args: ['run', '-A', 'npm:prisma', 'migrate', 'deploy', '--config', configPath],
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const { code } = await command.output();
    return code;
  }

  // Interactive mode - run prisma migrate dev
  log('🔄 Running interactive migration...');
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:prisma', 'migrate', 'dev', '--config', configPath],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const { code } = await command.output();
  return code;
}

/**
 * CLI runner for migrations
 * Parses --config=<path> from CLI args, exits with the migration command's exit code
 */
export async function runMigrationCli(options: MigrationOptions): Promise<never> {
  let configPath = options.configPath;
  let migrationName = options.migrationName;
  for (let index = 0; index < Deno.args.length; index += 1) {
    const arg = Deno.args[index];
    if (arg.startsWith('--config=')) {
      configPath = arg.slice(9);
      continue;
    }
    if (arg === '--config' && Deno.args[index + 1]) {
      configPath = Deno.args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--name=')) {
      migrationName = arg.slice(7);
      continue;
    }
    if (arg === '--name' && Deno.args[index + 1]) {
      migrationName = Deno.args[index + 1];
      index += 1;
    }
  }
  const code = await runMigration({ ...options, configPath, migrationName });
  Deno.exit(code);
}

function hasDatabaseUri(): boolean {
  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    if (!value) {
      continue;
    }
    if (key === 'DATABASE_URL' || key.endsWith('_URI')) {
      return true;
    }
  }
  return false;
}
