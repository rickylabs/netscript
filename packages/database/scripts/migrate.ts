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
  /**
   * Maximum number of attempts for a single Prisma invocation. The Prisma
   * schema engine is a separate subprocess that intermittently dies on Windows
   * with `ERR_STREAM_PREMATURE_CLOSE` during its `can-connect-to-database`
   * preflight (engine binary first-touch / AV scan / cold cache). That failure
   * occurs before any migration SQL is written, so re-running is idempotent.
   * Only that transient signature is retried; every other failure returns
   * immediately so real schema/SQL errors are never masked.
   *
   * @default 4
   */
  maxAttempts?: number;
  /**
   * Base delay in milliseconds between transient-failure retries. Backoff is
   * linear in the attempt index (`baseRetryDelayMs * attempt`).
   *
   * @default 750
   */
  baseRetryDelayMs?: number;
}

/**
 * Matches the transient Prisma schema-engine subprocess failure that is safe to
 * retry. The schema engine spawns as a child process; on Windows it can exit
 * with a premature stream close before establishing connectivity, which is
 * non-deterministic and clears on a fresh spawn.
 */
const TRANSIENT_ENGINE_FAILURE = /ERR_STREAM_PREMATURE_CLOSE|Premature close|Schema engine exited/i;

/** Determine whether a failed Prisma invocation matches the transient, retriable signature. */
export function isRetriableMigrationFailure(stderr: string): boolean {
  return TRANSIENT_ENGINE_FAILURE.test(stderr);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PrismaInvocation {
  readonly label: string;
  readonly args: readonly string[];
}

/** Result of a single Prisma subprocess invocation. */
export interface PrismaSpawnResult {
  /** Process exit code. */
  readonly code: number;
  /** Captured stderr text (empty when stderr was inherited). */
  readonly stderr: string;
}

/** Spawns a single `deno run -A npm:prisma <args>` invocation. */
export type PrismaSpawn = (
  args: readonly string[],
  interactive: boolean,
) => Promise<PrismaSpawnResult>;

/**
 * Default spawner. stdout streams straight through; for non-interactive runs
 * stderr is captured (so the failure can be classified) and mirrored back to the
 * parent process so logs are never swallowed. Interactive runs inherit stderr so
 * Prisma prompts surface immediately.
 */
const defaultPrismaSpawn: PrismaSpawn = async (args, interactive) => {
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:prisma', ...args],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: interactive ? 'inherit' : 'piped',
  });
  const { code, stderr } = await command.output();
  if (!interactive && stderr.byteLength > 0) {
    await writeAllToStderr(stderr);
  }
  return { code, stderr: interactive ? '' : new TextDecoder().decode(stderr) };
};

/** Options governing a bounded, signature-scoped Prisma retry. */
export interface RunPrismaWithRetryOptions {
  readonly interactive: boolean;
  readonly maxAttempts: number;
  readonly baseRetryDelayMs: number;
  readonly log: (message: string) => void;
  /** Injectable spawner (defaults to a real `Deno.Command`). */
  readonly spawn?: PrismaSpawn;
  /** Injectable delay (defaults to `setTimeout`). */
  readonly sleep?: (ms: number) => Promise<void>;
}

/**
 * Run a single Prisma CLI invocation with a bounded retry that fires only on the
 * transient schema-engine premature-close signature. Interactive runs execute
 * exactly once and are never retried (a prompt is not a transient engine crash).
 * Every non-transient failure returns immediately so real schema/SQL errors are
 * never masked.
 */
export async function runPrismaWithRetry(
  invocation: PrismaInvocation,
  options: RunPrismaWithRetryOptions,
): Promise<number> {
  const { interactive, maxAttempts, baseRetryDelayMs, log } = options;
  const spawn = options.spawn ?? defaultPrismaSpawn;
  const sleep = options.sleep ?? delay;
  const attempts = interactive ? 1 : Math.max(1, maxAttempts);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { code, stderr } = await spawn(invocation.args, interactive);

    if (code === 0) {
      return 0;
    }
    if (interactive || attempt >= attempts || !isRetriableMigrationFailure(stderr)) {
      return code;
    }

    const backoff = baseRetryDelayMs * attempt;
    log(
      `⚠️  Prisma ${invocation.label} hit a transient schema-engine failure ` +
        `(attempt ${attempt}/${attempts}); retrying in ${backoff}ms...`,
    );
    await sleep(backoff);
  }

  return 1;
}

async function writeAllToStderr(bytes: Uint8Array): Promise<void> {
  let offset = 0;
  while (offset < bytes.byteLength) {
    offset += await Deno.stderr.write(bytes.subarray(offset));
  }
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
    maxAttempts = 4,
    baseRetryDelayMs = 750,
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
    return await runPrismaWithRetry(
      {
        label: 'migrate dev',
        args: ['migrate', 'dev', '--config', configPath, '--name', migrationName],
      },
      { interactive: !nonInteractive, maxAttempts, baseRetryDelayMs, log },
    );
  }

  // In non-interactive mode (Aspire/CI), use migrate deploy to apply existing migrations
  if (nonInteractive) {
    log(`🔄 Non-interactive mode (Aspire: ${hasDbUri}, CI: ${isCI}), using migrate deploy...`);
    return await runPrismaWithRetry(
      { label: 'migrate deploy', args: ['migrate', 'deploy', '--config', configPath] },
      { interactive: false, maxAttempts, baseRetryDelayMs, log },
    );
  }

  // Interactive mode - run prisma migrate dev
  log('🔄 Running interactive migration...');
  return await runPrismaWithRetry(
    { label: 'migrate dev', args: ['migrate', 'dev', '--config', configPath] },
    { interactive: true, maxAttempts, baseRetryDelayMs, log },
  );
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
