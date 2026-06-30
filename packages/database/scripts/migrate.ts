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
   * immediately so real schema/SQL errors are never masked. The default
   * budget allows cold Windows engine startup / antivirus first-touch delays
   * to clear without making permanent failures look successful.
   *
   * @default 5
   */
  maxAttempts?: number;
  /**
   * Base delay in milliseconds between transient-failure retries. Backoff is
   * exponential in the attempt index and capped by `maxRetryDelayMs`.
   *
   * @default 1000
   */
  baseRetryDelayMs?: number;
  /**
   * Maximum delay in milliseconds between transient-failure retries.
   *
   * @default 15000
   */
  maxRetryDelayMs?: number;
  /**
   * Maximum duration in milliseconds for one non-interactive Prisma child
   * process attempt before it is killed and treated as a transient engine
   * lifecycle failure. This prevents Aspire db-init executables from sitting
   * in a non-terminal state until the outer operation timeout expires.
   *
   * @default 45000
   */
  attemptTimeoutMs?: number;
}

/**
 * Matches the transient Prisma schema-engine subprocess failure that is safe to
 * retry. The schema engine spawns as a child process; on Windows it can exit
 * with a premature stream close before establishing connectivity, which is
 * non-deterministic and clears on a fresh spawn.
 */
const PREMATURE_CLOSE_FAILURE = /ERR_STREAM_PREMATURE_CLOSE|Premature close/i;
const SCHEMA_ENGINE_CAN_CONNECT_FAILURE =
  /Schema engine exited[\s\S]*schema-engine(?:-[\w]+)?(?:\.exe)?\s+cli\s+can-connect-to-database|schema-engine(?:-[\w]+)?(?:\.exe)?\s+cli\s+can-connect-to-database[\s\S]*Schema engine exited/i;
const OWNED_ENGINE_TIMEOUT_FAILURE = /Timed out waiting for Prisma schema engine/i;
const DATABASE_NOT_READY_FAILURE = /P1001: Can't reach database server/i;

/** Determine whether a failed Prisma invocation matches the transient, retriable signature. */
export function isRetriableMigrationFailure(stderr: string): boolean {
  return PREMATURE_CLOSE_FAILURE.test(stderr) ||
    SCHEMA_ENGINE_CAN_CONNECT_FAILURE.test(stderr) ||
    OWNED_ENGINE_TIMEOUT_FAILURE.test(stderr) ||
    DATABASE_NOT_READY_FAILURE.test(stderr);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A single Prisma CLI command invocation managed by the retry runner. */
export interface PrismaInvocation {
  /** Human-readable command label used in diagnostics. */
  readonly label: string;
  /** Prisma CLI arguments passed after `deno run -A npm:prisma`. */
  readonly args: readonly string[];
}

/** Result of a single Prisma subprocess invocation. */
export interface PrismaSpawnResult {
  /** Process exit code. */
  readonly code: number;
  /** Captured stderr text (empty when stderr was inherited). */
  readonly stderr: string;
}

/** Per-attempt execution controls passed to a Prisma spawner. */
export interface PrismaSpawnOptions {
  /** Optional timeout for non-interactive child processes, in milliseconds. */
  readonly timeoutMs?: number;
}

/** Spawns a single `deno run -A npm:prisma <args>` invocation. */
export type PrismaSpawn = (
  args: readonly string[],
  interactive: boolean,
  options: PrismaSpawnOptions,
) => Promise<PrismaSpawnResult>;

/**
 * Default spawner. stdout streams straight through; for non-interactive runs
 * stderr is captured (so the failure can be classified) and mirrored back to the
 * parent process so logs are never swallowed. Interactive runs inherit stderr so
 * Prisma prompts surface immediately.
 */
const defaultPrismaSpawn: PrismaSpawn = async (args, interactive, options) => {
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:prisma', ...args],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: interactive ? 'inherit' : 'piped',
  });
  if (!interactive && options.timeoutMs !== undefined && options.timeoutMs > 0) {
    return await runCommandWithTimeout(command, options.timeoutMs);
  }
  const { code, stderr } = await command.output();
  if (!interactive && stderr.byteLength > 0) {
    await writeAllToStderr(stderr);
  }
  return { code, stderr: interactive ? '' : new TextDecoder().decode(stderr) };
};

async function runCommandWithTimeout(
  command: Deno.Command,
  timeoutMs: number,
): Promise<PrismaSpawnResult> {
  const child = command.spawn();
  const outputPromise = child.output();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    timeoutId = setTimeout(() => resolve('timeout'), timeoutMs);
  });
  const result = await Promise.race([outputPromise, timeoutPromise]);
  if (result !== 'timeout') {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (result.stderr.byteLength > 0) {
      await writeAllToStderr(result.stderr);
    }
    return { code: result.code, stderr: new TextDecoder().decode(result.stderr) };
  }

  try {
    child.kill();
  } catch {
    // The child may have exited after the timeout fired but before kill landed.
  }

  const { stderr } = await outputPromise.catch(() => ({ stderr: new Uint8Array() }));
  const decodedStderr = new TextDecoder().decode(stderr);
  const timeoutMessage = `Timed out waiting for Prisma schema engine after ${timeoutMs}ms; ` +
    'killed the Prisma CLI child so db-init can retry a fresh engine process.';
  await writeAllToStderr(new TextEncoder().encode(`${timeoutMessage}\n`));
  if (stderr.byteLength > 0) {
    await writeAllToStderr(stderr);
  }
  return { code: 124, stderr: `${timeoutMessage}\n${decodedStderr}` };
}

/** Options governing a bounded, signature-scoped Prisma retry. */
export interface RunPrismaWithRetryOptions {
  /** Whether the invocation may prompt and therefore must not be retried. */
  readonly interactive: boolean;
  /** Maximum number of attempts for a non-interactive transient failure. */
  readonly maxAttempts: number;
  /** Base retry delay in milliseconds. */
  readonly baseRetryDelayMs: number;
  /** Maximum retry delay in milliseconds after exponential backoff. */
  readonly maxRetryDelayMs: number;
  /** Timeout for one non-interactive Prisma subprocess attempt, in milliseconds. */
  readonly attemptTimeoutMs: number;
  /** Diagnostic sink for retry and exhaustion messages. */
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
  const { interactive, maxAttempts, baseRetryDelayMs, maxRetryDelayMs, attemptTimeoutMs, log } =
    options;
  const spawn = options.spawn ?? defaultPrismaSpawn;
  const sleep = options.sleep ?? delay;
  const attempts = interactive ? 1 : Math.max(1, maxAttempts);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { code, stderr } = await spawn(invocation.args, interactive, {
      timeoutMs: interactive ? undefined : attemptTimeoutMs,
    });

    if (code === 0) {
      return 0;
    }
    const retriable = isRetriableMigrationFailure(stderr);
    if (interactive || !retriable) {
      return code;
    }
    if (attempt >= attempts) {
      log(
        `Prisma ${invocation.label} exhausted ${attempts} attempts after ` +
          'transient schema-engine failures; surfacing the last exit code.',
      );
      return code;
    }

    const backoff = calculateRetryDelay(attempt, baseRetryDelayMs, maxRetryDelayMs);
    log(
      `⚠️  Prisma ${invocation.label} hit a transient schema-engine failure ` +
        `(attempt ${attempt}/${attempts}); retrying in ${backoff}ms...`,
    );
    await sleep(backoff);
  }

  return 1;
}

function calculateRetryDelay(
  attempt: number,
  baseRetryDelayMs: number,
  maxRetryDelayMs: number,
): number {
  const safeBase = Math.max(0, baseRetryDelayMs);
  const safeMax = Math.max(safeBase, maxRetryDelayMs);
  return Math.min(safeMax, safeBase * 2 ** (attempt - 1));
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
    maxAttempts = 5,
    baseRetryDelayMs = 1_000,
    maxRetryDelayMs = 15_000,
    attemptTimeoutMs = 45_000,
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
      {
        interactive: !nonInteractive,
        maxAttempts,
        baseRetryDelayMs,
        maxRetryDelayMs,
        attemptTimeoutMs,
        log,
      },
    );
  }

  // In non-interactive mode (Aspire/CI), use migrate deploy to apply existing migrations
  if (nonInteractive) {
    log(`🔄 Non-interactive mode (Aspire: ${hasDbUri}, CI: ${isCI}), using migrate deploy...`);
    return await runPrismaWithRetry(
      { label: 'migrate deploy', args: ['migrate', 'deploy', '--config', configPath] },
      { interactive: false, maxAttempts, baseRetryDelayMs, maxRetryDelayMs, attemptTimeoutMs, log },
    );
  }

  // Interactive mode - run prisma migrate dev
  log('🔄 Running interactive migration...');
  return await runPrismaWithRetry(
    { label: 'migrate dev', args: ['migrate', 'dev', '--config', configPath] },
    { interactive: true, maxAttempts, baseRetryDelayMs, maxRetryDelayMs, attemptTimeoutMs, log },
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
