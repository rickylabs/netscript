/**
 * @module kernel/adapters/aspire/aspire-compose-deploy-target
 *
 * Aspire-driven Docker / Compose deploy target adapter (Archetype 7).
 */

import { join } from '@std/path/posix';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from '../../domain/deploy/deploy-target-port.ts';

/** Registry keys served by the single Aspire compose adapter. */
export type AspireComposeTargetKey = 'compose' | 'docker';

/** Construction options for {@link AspireComposeDeployTarget}. */
export interface AspireComposeDeployTargetOptions {
  /** Registry key this instance is registered under (`compose` or `docker`). */
  readonly key: AspireComposeTargetKey;
  /** Process port used to shell `aspire` / `docker`. */
  readonly process: ProcessPort;
  /** `aspire` executable name. Default: `aspire`. */
  readonly aspireBin?: string;
  /** `docker` executable name. Default: `docker`. */
  readonly dockerBin?: string;
  /**
   * Default output directory (relative to the project root) for emitted compose
   * artifacts. Default: `.deploy/compose`.
   */
  readonly defaultOutputDir?: string;
  /**
   * Compose artifact filename emitted by `aspire publish`. Default:
   * `docker-compose.yaml`.
   */
  readonly composeFileName?: string;
}

/**
 * Aspire-driven Docker/Compose deploy target adapter.
 *
 * A pure **delegation shell** over {@link ProcessPort}: it authors **no** compose
 * YAML itself (A7 / F-2). `plan`/`emit` shell `aspire publish` (which reads the
 * generated compose-enabled `apphost.mts` and emits the docker-compose project);
 * the post-apply lifecycle (`down`/`status`/`logs`) shells `docker compose`
 * against the emitted project. Registered under two keys: `compose` (emit +
 * self-host `docker compose up`) and `docker` (single-image build/push via
 * `aspire deploy`); the adapter branches on {@link key} so the router stays thin
 * (R-DEPLOY-2).
 *
 * `rollback` and `secrets` are **omitted** (declared unsupported, not silent
 * no-ops): they are shared core conventions (R-DEPLOY-3) that land with the
 * deployment hardening slice (#341). Adapters advertise their supported subset
 * via {@link operations}.
 */
export class AspireComposeDeployTarget implements DeployTargetPort {
  /** Stable target identifier (`compose` or `docker`). */
  readonly key: AspireComposeTargetKey;
  /** Human-readable target label. */
  readonly label: string;
  /** Supported public deploy operations (subset — no rollback/secrets). */
  readonly operations: readonly DeployTargetOperation[] = [
    'plan',
    'emit',
    'up',
    'down',
    'status',
    'logs',
  ];

  readonly #process: ProcessPort;
  readonly #aspireBin: string;
  readonly #dockerBin: string;
  readonly #defaultOutputDir: string;
  readonly #composeFileName: string;

  constructor(options: AspireComposeDeployTargetOptions) {
    this.key = options.key;
    this.label = options.key === 'docker' ? 'Docker image' : 'Docker Compose';
    this.#process = options.process;
    this.#aspireBin = options.aspireBin ?? 'aspire';
    this.#dockerBin = options.dockerBin ?? 'docker';
    this.#defaultOutputDir = options.defaultOutputDir ??
      join('.deploy', 'compose');
    this.#composeFileName = options.composeFileName ?? 'docker-compose.yaml';
  }

  /** Emit the compose artifact via `aspire publish` (authors no YAML — A7/F-2). */
  plan(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#publish('plan', request);
  }

  /** Alias of {@link plan}: emit deploy artifacts via `aspire publish`. */
  emit(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#publish('emit', request);
  }

  /**
   * Bring the deployment up. `compose` self-hosts via `docker compose up -d` on
   * the emitted project; `docker` delegates the build/push/apply to
   * `aspire deploy`.
   */
  async up(request: DeployTargetRequest): Promise<DeployTargetResult> {
    if (this.key === 'docker') {
      const args = ['deploy', ...this.#aspireCommonArgs(request)];
      if (request.clearCache) args.push('--clear-cache');
      const result = await this.#exec('up', request, this.#aspireBin, args);
      return this.#result('up', args.join(' '), result);
    }
    const outputDir = this.#outputDir(request);
    const result = await this.#exec('up', request, this.#dockerBin, [
      'compose',
      '-f',
      this.#composeFile(outputDir),
      'up',
      '-d',
    ]);
    return this.#result('up', 'docker compose up -d', result);
  }

  /** Bring the deployment down via `docker compose down` on the emitted project. */
  async down(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const result = await this.#exec('down', request, this.#dockerBin, [
      'compose',
      '-f',
      this.#composeFile(outputDir),
      'down',
    ]);
    return this.#result('down', 'docker compose down', result);
  }

  /** Report deployment status via `docker compose ps` on the emitted project. */
  async status(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const result = await this.#exec('status', request, this.#dockerBin, [
      'compose',
      '-f',
      this.#composeFile(outputDir),
      'ps',
    ]);
    return this.#result(
      'status',
      result.stdout.trim() || 'docker compose ps',
      result,
    );
  }

  /** Tail deployment logs via `docker compose logs` on the emitted project. */
  async logs(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const result = await this.#exec('logs', request, this.#dockerBin, [
      'compose',
      '-f',
      this.#composeFile(outputDir),
      'logs',
      '--no-color',
    ]);
    return this.#result(
      'logs',
      result.stdout.trim() || 'docker compose logs',
      result,
    );
  }

  async #publish(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
  ): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const args = [
      'publish',
      '--output-path',
      outputDir,
      ...this.#aspireCommonArgs(request),
    ];
    const result = await this.#exec(operation, request, this.#aspireBin, args);
    return this.#result(operation, args.join(' '), result);
  }

  #aspireCommonArgs(request: DeployTargetRequest): string[] {
    const args: string[] = [];
    if (request.environment) args.push('--environment', request.environment);
    if (request.nonInteractive) args.push('--non-interactive');
    return args;
  }

  #outputDir(request: DeployTargetRequest): string {
    return request.outputDir ?? this.#defaultOutputDir;
  }

  #composeFile(outputDir: string): string {
    return join(outputDir, this.#composeFileName);
  }

  async #exec(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
    command: string,
    args: readonly string[],
  ): Promise<ProcessResult> {
    const result = await this.#process.exec(command, args, {
      cwd: request.projectRoot,
    });
    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout).trim();
      throw new Error(
        `${this.label} ${operation} failed (${command} ${args.join(' ')}) exited ${result.code}` +
          (detail ? `: ${detail}` : ''),
      );
    }
    return result;
  }

  #result(
    operation: DeployTargetOperation,
    message: string,
    _result: ProcessResult,
  ): DeployTargetResult {
    return {
      target: this.key,
      operation,
      message: `${this.label}: ${message}`,
    };
  }
}
