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
  type AppHostLifecycleLock,
  type AppHostLifecycleLease,
  FileAppHostLifecycleLock,
} from './apphost-lifecycle-lock.ts';
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
  isNoRunningAppHostOutput,
  TERMINAL_RESOURCE_STATES,
} from './operation-runner-helpers.ts';

const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 15 * 60_000;

interface DbOperationRunnerOptions {
  readonly executor?: AspireCommandExecutor;
  readonly lifecycleLock?: AppHostLifecycleLock;
  readonly pollIntervalMs?: number;
  readonly timeoutMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly writeOperationRequest?: (path: string, env: Record<string, string>) => Promise<void>;
  readonly removeOperationRequest?: (path: string) => Promise<void>;
}

/** Executes database operations by delegating to Aspire AppHost CLI mode. */
export class DbOperationRunner {
  private readonly executor: AspireCommandExecutor;
  private readonly lifecycleLock: AppHostLifecycleLock;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly writeOperationRequest: (path: string, env: Record<string, string>) => Promise<void>;
  private readonly removeOperationRequest: (path: string) => Promise<void>;

  constructor(options: DbOperationRunnerOptions = {}) {
    this.executor = options.executor ?? new DenoAspireCommandExecutor();
    this.lifecycleLock = options.lifecycleLock ?? new FileAppHostLifecycleLock();
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.sleep = options.sleep ??
      ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.writeOperationRequest = options.writeOperationRequest ??
      ((path, env) => Deno.writeTextFile(path, JSON.stringify(env)));
    this.removeOperationRequest = options.removeOperationRequest ?? (async (path) => {
      try {
        await Deno.remove(path);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
    });
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
    const residentAppHostPath = join(aspireDir, SCAFFOLD_FILES.APPHOST_MTS);
    const env = buildDbCliEnv(
      request.operation,
      database.configKey,
      request.migrationName,
    );

    if (request.operation === 'studio') {
      return await this.executeInteractive(residentAppHostPath, aspireDir, env);
    }

    const operationAppHostPath = join(
      aspireDir,
      SCAFFOLD_FILES.DB_OPERATION_APPHOST_MTS,
    );

    return await this.executeDetached(
      request.operation,
      database.configKey,
      operationAppHostPath,
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
    const operationRequestPath = join(apphostPath, '..', '.netscript-db-operation.json');
    outputText(`Starting db ${operation} for ${configKey}...`);
    const lease = await this.lifecycleLock.acquire(apphostPath, {
      timeoutMs: this.timeoutMs,
      pollIntervalMs: this.pollIntervalMs,
      sleep: this.sleep,
    });

    try {
      await this.writeOperationRequest(operationRequestPath, env);
      const startedByInvocation = !(await this.hasRunningAppHost(apphostPath, aspireDir));

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
        if (startedByInvocation) {
          await this.stopDetached(apphostPath, aspireDir);
        }
      }
    } finally {
      await this.removeOperationRequest(operationRequestPath);
      await this.releaseLease(lease, apphostPath);
    }
  }

  private async releaseLease(lease: AppHostLifecycleLease, apphostPath: string): Promise<void> {
    try {
      await lease.release();
    } catch (error) {
      outputWarning(
        `Failed to release database AppHost lifecycle lock for ${apphostPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async hasRunningAppHost(apphostPath: string, aspireDir: string): Promise<boolean> {
    const args = [
      'describe',
      '--apphost',
      apphostPath,
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
    ];
    const output = await this.executor.output(args, { cwd: aspireDir });
    if (output.code === 0) {
      return true;
    }

    const details = output.stderr.trim() || output.stdout.trim() || 'unknown Aspire error';
    if (isNoRunningAppHostOutput(output.stdout, output.stderr)) {
      return false;
    }

    throw new Error(`aspire describe failed with exit code ${output.code}: ${details}`);
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
        [
          'describe',
          '--apphost',
          apphostPath,
          '--format',
          'Json',
          '--non-interactive',
          '--nologo',
        ],
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
      throw new Error(`aspire ${args[0]} failed with exit code ${output.code}: ${details}`);
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
