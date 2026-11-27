import {
  outputError,
  outputText,
  outputWarning,
} from '../../../presentation/output/default-output.ts';
/**
 * @module infra/database/operation-runner
 */

import { join } from '@std/path';
import { DenoFileSystem } from '../../runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../runtime/process/deno-process.ts';
import { DockerCliTopologyInspector } from '../../aspire/docker-topology-inspector.ts';
import type { DockerTopologyInspector } from '../../../domain/docker-topology.ts';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import { refreshGeneratedClientConsumers } from './refresh-generated-client-consumers.ts';

import { SCAFFOLD_DIRS } from '../../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../constants/scaffold/scaffold-files.ts';
import type {
  DbOperationExecutor,
  DbOperationRequest,
  DiscoveredDatabase,
} from '../../../domain/db-engine.ts';
import {
  type AppHostLifecycleLease,
  type AppHostLifecycleLock,
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
  commandDetails,
  findRunningAppHost,
  inspectForeignDockerDiagnostic,
  isTypedResourceOperation,
  registerSignalAbort,
  resolveDbCliTimeoutSeconds,
  stopOperationResource,
  stopStandaloneAppHost,
  watchExecutableCompletion,
} from './operation-runner-helpers.ts';

const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DOCKER_DIAGNOSTIC_TIMEOUT_MS = 3_000;
const WAIT_TIMEOUT_EXIT_CODES: ReadonlySet<number> = new Set([17, 18]);

interface DbOperationRunnerOptions {
  readonly fs?: Pick<FileSystemPort, 'readFile'>;
  readonly realPath?: (path: string) => Promise<string>;
  readonly executor?: AspireCommandExecutor;
  readonly lifecycleLock?: AppHostLifecycleLock;
  readonly dockerTopologyInspector?: Pick<DockerTopologyInspector, 'inspectEndpoint'>;
  readonly pollIntervalMs?: number;
  readonly timeoutMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly writeOperationRequest?: (path: string, env: Record<string, string>) => Promise<void>;
  readonly removeOperationRequest?: (path: string) => Promise<void>;
  readonly registerSignalAbort?: (abort: () => void) => () => void;
}

/** Executes database operations through a resident AppHost or a scoped standalone host. */
export class DbOperationRunner implements DbOperationExecutor {
  private readonly fs: Pick<FileSystemPort, 'readFile'>;
  private readonly realPath: (path: string) => Promise<string>;
  private readonly executor: AspireCommandExecutor;
  private readonly lifecycleLock: AppHostLifecycleLock;
  private readonly dockerTopologyInspector: Pick<DockerTopologyInspector, 'inspectEndpoint'>;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly writeOperationRequest: (
    path: string,
    env: Record<string, string>,
  ) => Promise<void>;
  private readonly removeOperationRequest: (path: string) => Promise<void>;
  private readonly registerSignalAbort: (abort: () => void) => () => void;

  constructor(options: DbOperationRunnerOptions = {}) {
    this.fs = options.fs ?? new DenoFileSystem();
    this.realPath = options.realPath ?? Deno.realPath;
    this.executor = options.executor ?? new DenoAspireCommandExecutor();
    this.lifecycleLock = options.lifecycleLock ?? new FileAppHostLifecycleLock();
    this.dockerTopologyInspector = options.dockerTopologyInspector ??
      new DockerCliTopologyInspector(new DenoProcess(), {
        timeoutMs: DOCKER_DIAGNOSTIC_TIMEOUT_MS,
      });
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.timeoutMs = options.timeoutMs ?? resolveDbCliTimeoutSeconds() * 1_000;
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
    this.registerSignalAbort = options.registerSignalAbort ?? registerSignalAbort;
  }

  /** Execute a database operation and return its process exit code. */
  async execute(request: DbOperationRequest): Promise<number> {
    const databases = request.target.kind === 'all'
      ? request.target.databases
      : [request.target.database];

    if (request.operation === 'studio') {
      return await this.executeOne(request, databases[0]);
    }

    const refreshed = new Set<string>();
    const generatedDatabases: DiscoveredDatabase[] = [];
    const controller = new AbortController();
    const unregisterSignals = this.registerSignalAbort(() => controller.abort());
    try {
      for (const [index, database] of databases.entries()) {
        const code = await this.executeOne(
          request,
          database,
          controller.signal,
          refreshed,
          generatedDatabases,
          index === databases.length - 1,
        );
        if (code !== 0) return code;
      }
    } finally {
      if (refreshed.size) outputText(`Database consumers refreshed: ${[...refreshed].join(', ')}.`);
      unregisterSignals();
    }

    return 0;
  }

  private async executeOne(
    request: DbOperationRequest,
    database: DiscoveredDatabase,
    signal?: AbortSignal,
    refreshed = new Set<string>(),
    generatedDatabases: DiscoveredDatabase[] = [],
    isLastDatabase = true,
  ): Promise<number> {
    const aspireDir = join(request.projectRoot, SCAFFOLD_DIRS.ASPIRE_TS);
    const apphostPath = join(aspireDir, SCAFFOLD_FILES.APPHOST_MTS);
    const env = buildDbCliEnv(
      request.operation,
      database.configKey,
      request.migrationName,
      request.interactive,
    );

    if (request.operation === 'studio') {
      return await this.executeInteractive(apphostPath, aspireDir, env);
    }
    if (!signal) throw new Error('Database operation cancellation signal is required.');

    const lease = await this.lifecycleLock.acquire(apphostPath, {
      timeoutMs: this.timeoutMs,
      pollIntervalMs: this.pollIntervalMs,
      sleep: this.sleep,
    });
    try {
      const runningAppHost = await this.findProjectAppHost(apphostPath, aspireDir, signal);
      if (runningAppHost) {
        const code = await this.executeOnAppHost(
          request,
          database,
          apphostPath,
          aspireDir,
          env,
          signal,
        );
        if (code === 0 && request.operation === 'generate') {
          generatedDatabases.push(database);
          if (isLastDatabase) {
            await refreshGeneratedClientConsumers({
              projectRoot: request.projectRoot,
              database,
              databases: generatedDatabases,
              apphostPath,
              aspireDir,
              executor: this.executor,
              fs: this.fs,
              realPath: this.realPath,
              timeoutMs: this.timeoutMs,
              signal,
              refreshed,
            });
          }
        }
        return code;
      }
      return await this.executeStandalone(
        request,
        database,
        apphostPath,
        aspireDir,
        env,
        signal,
      );
    } finally {
      await this.releaseLease(lease, apphostPath);
    }
  }

  private async executeInteractive(
    apphostPath: string,
    aspireDir: string,
    env: Record<string, string>,
  ): Promise<number> {
    return await this.executor.spawn(buildAspireArgs('run', apphostPath), {
      cwd: aspireDir,
      env,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
  }

  private async executeStandalone(
    request: DbOperationRequest,
    database: DiscoveredDatabase,
    apphostPath: string,
    aspireDir: string,
    env: Record<string, string>,
    signal: AbortSignal,
  ): Promise<number> {
    outputText(`Starting the project AppHost for db ${request.operation}...`);
    await this.runAspire(
      buildAspireArgs('start', apphostPath, { isolated: true }),
      { cwd: aspireDir, env, signal },
    );

    try {
      return await this.executeOnAppHost(
        request,
        database,
        apphostPath,
        aspireDir,
        env,
        signal,
      );
    } finally {
      await stopStandaloneAppHost(this.executor, apphostPath, aspireDir);
    }
  }

  private async executeOnAppHost(
    request: DbOperationRequest,
    database: DiscoveredDatabase,
    apphostPath: string,
    aspireDir: string,
    env: Record<string, string>,
    signal: AbortSignal,
  ): Promise<number> {
    const configKey = database.configKey;
    outputText(`Starting db ${request.operation} for ${configKey}...`);
    await this.waitForDatabase(database, apphostPath, aspireDir, signal);

    if (isTypedResourceOperation(request.operation) && !request.migrationName) {
      return await this.executeTypedResourceCommand(
        request.operation,
        configKey,
        apphostPath,
        aspireDir,
        signal,
      );
    }
    return await this.executeLegacyResource(
      request.operation,
      configKey,
      apphostPath,
      aspireDir,
      env,
      signal,
    );
  }

  private async findProjectAppHost(
    apphostPath: string,
    aspireDir: string,
    signal: AbortSignal,
  ): Promise<boolean> {
    const output = await this.runAspire(
      ['ps', '--format', 'Json', '--nologo', '--non-interactive'],
      { cwd: aspireDir, signal },
    );
    return findRunningAppHost(output.stdout, apphostPath);
  }

  private async waitForDatabase(
    database: DiscoveredDatabase,
    apphostPath: string,
    aspireDir: string,
    signal: AbortSignal,
  ): Promise<void> {
    const configKey = database.configKey;
    const timeoutSeconds = Math.max(1, Math.ceil(this.timeoutMs / 1_000));
    const output = await this.executor.output(
      [
        'wait',
        configKey,
        '--status',
        'healthy',
        '--timeout',
        String(timeoutSeconds),
        '--apphost',
        apphostPath,
        '--non-interactive',
        '--nologo',
      ],
      { cwd: aspireDir, signal },
    );
    if (output.code === 0) return;

    const details = commandDetails(output);
    if (WAIT_TIMEOUT_EXIT_CODES.has(output.code)) {
      const foreignDockerNote = await inspectForeignDockerDiagnostic(
        database,
        details,
        this.dockerTopologyInspector,
      );
      throw new Error(
        `Database resource ${configKey} did not become healthy within ${timeoutSeconds} seconds ` +
          `(aspire wait exit ${output.code}). Check its resource logs and listener readiness.` +
          `${foreignDockerNote} Aspire reported: ${details}`,
      );
    }
    throw new Error(`aspire wait failed with exit code ${output.code}: ${details}`);
  }

  private async executeTypedResourceCommand(
    operation: 'migrate' | 'seed' | 'reset',
    configKey: string,
    apphostPath: string,
    aspireDir: string,
    signal: AbortSignal,
  ): Promise<number> {
    const timeoutSeconds = Math.max(1, Math.ceil(this.timeoutMs / 1_000));
    const args = [
      'resource',
      `${configKey}-cli`,
      operation,
      '--timeout',
      String(timeoutSeconds),
    ];
    if (operation === 'reset') args.push('--confirm', 'true');
    args.push('--apphost', apphostPath, '--non-interactive', '--nologo');

    const output = await this.executor.output(args, { cwd: aspireDir, signal });
    if (output.stdout.trim()) outputText(output.stdout.trim());
    if (output.stderr.trim()) outputError(output.stderr.trim());
    if (output.code === 0) outputText(`db ${operation} completed successfully.`);
    return output.code;
  }

  private async executeLegacyResource(
    operation: DbOperationRequest['operation'],
    configKey: string,
    apphostPath: string,
    aspireDir: string,
    env: Record<string, string>,
    signal: AbortSignal,
  ): Promise<number> {
    const resourceName = `${configKey}-cli`;
    const operationRequestPath = join(aspireDir, `.netscript-db-operation-${configKey}.json`);
    await this.writeOperationRequest(operationRequestPath, env);
    let startRequested = false;
    try {
      const code = await watchExecutableCompletion(this.executor, {
        resourceName,
        apphostPath,
        cwd: aspireDir,
        timeoutMs: this.timeoutMs,
        signal,
        start: async (watchSignal) => {
          startRequested = true;
          await this.runAspire(
            [
              'resource',
              resourceName,
              'start',
              '--apphost',
              apphostPath,
              '--non-interactive',
              '--nologo',
            ],
            { cwd: aspireDir, signal: watchSignal },
          );
        },
      });
      await this.printResourceLogs(resourceName, apphostPath, aspireDir, signal);
      if (code === 0) {
        outputText(`db ${operation} completed successfully.`);
      } else {
        outputError(`db ${operation} failed with exit code ${code}.`);
      }
      return code;
    } finally {
      try {
        if (startRequested) {
          await stopOperationResource(this.executor, resourceName, apphostPath, aspireDir);
        }
      } finally {
        await this.removeOperationRequest(operationRequestPath);
      }
    }
  }

  private async printResourceLogs(
    resourceName: string,
    apphostPath: string,
    aspireDir: string,
    signal: AbortSignal,
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
        { cwd: aspireDir, signal },
      );
      if (output.stdout.trim()) outputText(output.stdout.trim());
      if (output.stderr.trim()) outputError(output.stderr.trim());
    } catch {
      // Log fetching is best-effort.
    }
  }

  private async runAspire(
    args: readonly string[],
    options: AspireCommandOptions,
  ): Promise<CommandOutput> {
    const output = await this.executor.output(args, options);
    if (output.code !== 0) {
      throw new Error(
        `aspire ${args[0]} failed with exit code ${output.code}: ${commandDetails(output)}`,
      );
    }
    return output;
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
}
