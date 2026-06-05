import {
  outputError,
  outputText,
  outputWarning,
} from '../../presentation/output/default-output.ts';
/**
 * @module infra/database/operation-runner
 */

import { join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { DbOperationRequest, DiscoveredDatabase } from '../../domain/db-engine.ts';
import {
  type AspireCommandExecutor,
  type AspireCommandOptions,
  type CommandOutput,
  DenoAspireCommandExecutor,
} from './aspire-command-executor.ts';
import {
  buildAspireArgs,
  buildDbCliEnv,
  buildExecutableDisplayName,
  findExecutableStatus,
  TERMINAL_RESOURCE_STATES,
} from './operation-runner-helpers.ts';

const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 5 * 60_000;

interface DbOperationRunnerOptions {
  readonly executor?: AspireCommandExecutor;
  readonly pollIntervalMs?: number;
  readonly timeoutMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}

/** Executes database operations by delegating to Aspire AppHost CLI mode. */
export class DbOperationRunner {
  private readonly executor: AspireCommandExecutor;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: DbOperationRunnerOptions = {}) {
    this.executor = options.executor ?? new DenoAspireCommandExecutor();
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.sleep = options.sleep ??
      ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * Execute a database operation.
   *
   * @param request - Operation request.
   * @returns Process exit code.
   */
  async execute(request: DbOperationRequest): Promise<number> {
    const databases = request.target.kind === 'all'
      ? request.target.databases
      : [request.target.database];

    for (const database of databases) {
      const code = await this.executeOne(request, database);
      if (code !== 0) {
        return code;
      }
    }

    return 0;
  }

  /** Execute one concrete database target through Aspire. */
  private async executeOne(
    request: DbOperationRequest,
    database: DiscoveredDatabase,
  ): Promise<number> {
    const aspireDir = join(request.projectRoot, SCAFFOLD_DIRS.ASPIRE_TS);
    const apphostPath = join(aspireDir, SCAFFOLD_FILES.APPHOST_TS);
    const env = buildDbCliEnv(
      request.operation,
      database.configKey,
      request.migrationName,
    );

    if (request.operation === 'studio') {
      return await this.executeInteractive(apphostPath, aspireDir, env);
    }

    return await this.executeDetached(
      request.operation,
      database.configKey,
      apphostPath,
      aspireDir,
      env,
    );
  }

  private async executeInteractive(
    apphostPath: string,
    aspireDir: string,
    env: Record<string, string>,
  ): Promise<number> {
    return await this.executor.spawn(
      buildAspireArgs('run', apphostPath),
      {
        cwd: aspireDir,
        env,
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
      },
    );
  }

  private async executeDetached(
    operation: DbOperationRequest['operation'],
    configKey: string,
    apphostPath: string,
    aspireDir: string,
    env: Record<string, string>,
  ): Promise<number> {
    const displayName = buildExecutableDisplayName(operation, configKey);
    outputText(`Starting db ${operation} for ${configKey}...`);

    await this.runAspire(
      buildAspireArgs('start', apphostPath),
      { cwd: aspireDir, env },
    );

    try {
      const code = await this.waitForExecutableCompletion(
        operation,
        configKey,
        apphostPath,
        aspireDir,
      );

      await this.printResourceLogs(displayName, apphostPath, aspireDir);

      if (code === 0) {
        outputText(`db ${operation} completed successfully.`);
      } else {
        outputError(`db ${operation} failed with exit code ${code}.`);
      }

      return code;
    } finally {
      await this.stopDetached(apphostPath, aspireDir);
    }
  }

  private async printResourceLogs(
    resourceName: string,
    apphostPath: string,
    aspireDir: string,
  ): Promise<void> {
    try {
      const output = await this.executor.output(
        [
          'logs',
          resourceName,
          '--apphost',
          apphostPath,
          '--non-interactive',
          '--nologo',
        ],
        { cwd: aspireDir },
      );
      const logs = output.stdout.trim();
      if (logs) {
        outputText(logs);
      }
      const errLogs = output.stderr.trim();
      if (errLogs) {
        outputError(errLogs);
      }
    } catch {
      // Log fetching is best-effort — don't fail the operation
    }
  }

  private async waitForExecutableCompletion(
    operation: DbOperationRequest['operation'],
    configKey: string,
    apphostPath: string,
    aspireDir: string,
  ): Promise<number> {
    const displayName = buildExecutableDisplayName(operation, configKey);
    const deadline = Date.now() + this.timeoutMs;

    while (Date.now() <= deadline) {
      const output = await this.runAspire(
        ['ps', '--resources', '--format', 'Json', '--non-interactive', '--nologo'],
        { cwd: aspireDir },
      );
      const resource = findExecutableStatus(output.stdout, apphostPath, displayName);
      if (resource && resource.state && TERMINAL_RESOURCE_STATES.has(resource.state)) {
        if (typeof resource.exitCode === 'number') {
          return resource.exitCode;
        }
        throw new Error(
          `Aspire resource ${displayName} reached ${resource.state} without an exit code.`,
        );
      }

      await this.sleep(this.pollIntervalMs);
    }

    throw new Error(
      `Timed out waiting for Aspire resource ${displayName} to complete.`,
    );
  }

  private async runAspire(
    args: readonly string[],
    options: AspireCommandOptions,
  ): Promise<CommandOutput> {
    const output = await this.executor.output(args, options);
    if (output.code !== 0) {
      const details = output.stderr.trim() || output.stdout.trim() || 'unknown Aspire error';
      throw new Error(`aspire ${args[0]} failed: ${details}`);
    }
    return output;
  }

  private async stopDetached(apphostPath: string, aspireDir: string): Promise<void> {
    const output = await this.executor.output(
      ['stop', '--apphost', apphostPath, '--non-interactive', '--nologo'],
      { cwd: aspireDir },
    );
    if (output.code !== 0) {
      outputWarning(
        `Failed to stop detached Aspire apphost ${apphostPath}: ${
          output.stderr.trim() || output.stdout.trim() || output.code
        }`,
      );
    }
  }
}
