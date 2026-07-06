/**
 * @module kernel/adapters/aspire/aspire-cloud-deploy-target
 *
 * Aspire-driven Kubernetes, Azure, and Docker-image cloud deploy adapters.
 */

import { join } from '@std/path/posix';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from '../../domain/deploy/deploy-target-port.ts';

/** First-party cloud target keys that delegate to Aspire environments. */
export type AspireCloudTargetKey =
  | 'kubernetes'
  | 'azure-aca'
  | 'azure-app-service'
  | 'azure-aks'
  | 'cloud-run';

/** Metadata for a first-party Aspire cloud target. */
interface AspireCloudTargetDescriptor {
  readonly key: AspireCloudTargetKey;
  readonly label: string;
  readonly environment: string;
  readonly defaultOutputDir: string;
}

const TARGETS: Readonly<Record<AspireCloudTargetKey, AspireCloudTargetDescriptor>> = {
  kubernetes: {
    key: 'kubernetes',
    label: 'Kubernetes',
    environment: 'k8s',
    defaultOutputDir: join('.deploy', 'kubernetes'),
  },
  'azure-aca': {
    key: 'azure-aca',
    label: 'Azure Container Apps',
    environment: 'aca',
    defaultOutputDir: join('.deploy', 'azure-aca'),
  },
  'azure-app-service': {
    key: 'azure-app-service',
    label: 'Azure App Service',
    environment: 'app-service',
    defaultOutputDir: join('.deploy', 'azure-app-service'),
  },
  'azure-aks': {
    key: 'azure-aks',
    label: 'Azure Kubernetes Service',
    environment: 'aks',
    defaultOutputDir: join('.deploy', 'azure-aks'),
  },
  'cloud-run': {
    key: 'cloud-run',
    label: 'Google Cloud Run',
    environment: 'cloud-run',
    defaultOutputDir: join('.deploy', 'cloud-run'),
  },
};

/** Construction options for {@link AspireCloudDeployTarget}. */
export interface AspireCloudDeployTargetOptions {
  /** Registry key this instance is registered under. */
  readonly key: AspireCloudTargetKey;
  /** Process port used to shell `aspire`. */
  readonly process: ProcessPort;
  /** `aspire` executable name. Default: `aspire`. */
  readonly aspireBin?: string;
  /** Override the AppHost environment name passed to `--environment`. */
  readonly environment?: string;
  /** Default output directory for emitted artifacts. */
  readonly defaultOutputDir?: string;
}

/**
 * Aspire cloud deployment target adapter.
 *
 * This adapter is a pure delegation shell over the Aspire CLI: Kubernetes and
 * Azure targets depend on the generated TypeScript AppHost carrying the matching
 * Aspire hosting integration/environment, and `cloud-run` is a Docker-image
 * provider lane that reuses the same AppHost image/publish path. NetScript does
 * not author Helm, Bicep, or provider manifests here; Aspire owns the publish /
 * deploy pipeline and the user's kube/cloud credentials own authorization.
 */
export class AspireCloudDeployTarget implements DeployTargetPort {
  /** Stable target identifier. */
  readonly key: AspireCloudTargetKey;
  /** Human-readable target label. */
  readonly label: string;
  /** Supported public deploy operations. */
  readonly operations: readonly DeployTargetOperation[] = ['plan', 'emit', 'up', 'down'];

  readonly #process: ProcessPort;
  readonly #aspireBin: string;
  readonly #environment: string;
  readonly #defaultOutputDir: string;

  constructor(options: AspireCloudDeployTargetOptions) {
    const descriptor = TARGETS[options.key];
    this.key = descriptor.key;
    this.label = descriptor.label;
    this.#process = options.process;
    this.#aspireBin = options.aspireBin ?? 'aspire';
    this.#environment = options.environment ?? descriptor.environment;
    this.#defaultOutputDir = options.defaultOutputDir ?? descriptor.defaultOutputDir;
  }

  /** Emit deployment artifacts through `aspire publish --environment`. */
  plan(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#publish('plan', request);
  }

  /** Alias of {@link plan}: emit deploy artifacts through Aspire. */
  emit(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#publish('emit', request);
  }

  /** Provision/apply the target through `aspire deploy --environment`. */
  async up(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const args = [
      'deploy',
      '--environment',
      this.#environment,
      '--output-path',
      outputDir,
      '--non-interactive',
    ];
    const result = await this.#exec('up', request, args);
    return this.#result('up', `aspire ${args.join(' ')}`, result);
  }

  /** Tear down the target through `aspire destroy --environment --yes`. */
  async down(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const args = [
      'destroy',
      '--environment',
      this.#environment,
      '--output-path',
      outputDir,
      '--yes',
      '--non-interactive',
    ];
    const result = await this.#exec('down', request, args);
    return this.#result('down', `aspire ${args.join(' ')}`, result);
  }

  async #publish(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
  ): Promise<DeployTargetResult> {
    const outputDir = this.#outputDir(request);
    const args = [
      'publish',
      '--environment',
      this.#environment,
      '--output-path',
      outputDir,
      '--non-interactive',
    ];
    const result = await this.#exec(operation, request, args);
    return this.#result(operation, `aspire ${args.join(' ')}`, result);
  }

  #outputDir(request: DeployTargetRequest): string {
    return request.outputDir ?? this.#defaultOutputDir;
  }

  async #exec(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
    args: readonly string[],
  ): Promise<ProcessResult> {
    const result = await this.#process.exec(this.#aspireBin, args, { cwd: request.projectRoot });
    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout).trim();
      throw new Error(
        `${this.label} ${operation} failed (${this.#aspireBin} ${args.join(' ')}) exited ` +
          `${result.code}${detail ? `: ${detail}` : ''}`,
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
