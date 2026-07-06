/**
 * @module kernel/adapters/aspire/aspire-cloud-deploy-target
 *
 * Kubernetes/Azure AppHost deploy adapters and the Cloud Run image provider.
 */

import { isAbsolute, join as joinPath } from '@std/path';
import { join as joinPosix } from '@std/path/posix';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from '../../domain/deploy/deploy-target-port.ts';

/** First-party cloud target keys for Deploy S10. */
export type AspireCloudTargetKey =
  | 'kubernetes'
  | 'azure-aca'
  | 'azure-app-service'
  | 'azure-aks'
  | 'cloud-run';

type AspireCloudTargetMode = 'apphost' | 'cloud-run';

/** Metadata for a first-party cloud target. */
interface AspireCloudTargetDescriptor {
  readonly key: AspireCloudTargetKey;
  readonly label: string;
  readonly mode: AspireCloudTargetMode;
  readonly defaultOutputDir?: string;
  readonly appHostMarkers?: readonly string[];
  readonly appHostHint?: string;
}

const TARGETS: Readonly<Record<AspireCloudTargetKey, AspireCloudTargetDescriptor>> = {
  kubernetes: {
    key: 'kubernetes',
    label: 'Kubernetes',
    mode: 'apphost',
    defaultOutputDir: joinPosix('.deploy', 'kubernetes'),
    appHostMarkers: ['addKubernetesEnvironment', 'publishAsKubernetesService'],
    appHostHint:
      'Add a Kubernetes environment in the AppHost, for example addKubernetesEnvironment(...) and publishAsKubernetesService(...).',
  },
  'azure-aca': {
    key: 'azure-aca',
    label: 'Azure Container Apps',
    mode: 'apphost',
    defaultOutputDir: joinPosix('.deploy', 'azure-aca'),
    appHostMarkers: [
      'addAzureContainerAppEnvironment',
      'addAzureContainerAppsEnvironment',
      'AzureContainerApp',
    ],
    appHostHint:
      'Add an Azure Container Apps hosting environment in the AppHost; the Aspire AppHost, not --environment, selects the platform.',
  },
  'azure-app-service': {
    key: 'azure-app-service',
    label: 'Azure App Service',
    mode: 'apphost',
    defaultOutputDir: joinPosix('.deploy', 'azure-app-service'),
    appHostMarkers: ['addAzureAppServiceEnvironment', 'AzureAppService'],
    appHostHint:
      'Add an Azure App Service hosting environment in the AppHost; the Aspire AppHost, not --environment, selects the platform.',
  },
  'azure-aks': {
    key: 'azure-aks',
    label: 'Azure Kubernetes Service',
    mode: 'apphost',
    defaultOutputDir: joinPosix('.deploy', 'azure-aks'),
    appHostMarkers: ['addAzureKubernetesEnvironment', 'AzureKubernetes', 'AKS'],
    appHostHint:
      'Add an Azure Kubernetes Service environment in the AppHost, for example addAzureKubernetesEnvironment(...).',
  },
  'cloud-run': {
    key: 'cloud-run',
    label: 'Google Cloud Run',
    mode: 'cloud-run',
  },
};

/** File reader used by AppHost validation. */
export type AppHostSourceReader = (path: string) => Promise<string>;

/** Construction options for {@link AspireCloudDeployTarget}. */
export interface AspireCloudDeployTargetOptions {
  /** Registry key this instance is registered under. */
  readonly key: AspireCloudTargetKey;
  /** Process port used to shell external CLIs. */
  readonly process: ProcessPort;
  /** `aspire` executable name. Default: `aspire`. */
  readonly aspireBin?: string;
  /** `docker` executable name. Default: `docker`. */
  readonly dockerBin?: string;
  /** `gcloud` executable name. Default: `gcloud`. */
  readonly gcloudBin?: string;
  /** Default output directory for emitted Aspire artifacts. */
  readonly defaultOutputDir?: string;
  /** AppHost source reader override for tests. */
  readonly readAppHost?: AppHostSourceReader;
}

/**
 * Deploy S10 cloud target adapter.
 *
 * Kubernetes and Azure targets are honest AppHost-backed adapters: NetScript
 * validates that the AppHost source names the expected platform integration,
 * then delegates to `aspire publish|deploy|destroy --apphost ...`. It does not
 * pass platform names as `--environment`; Aspire's environment flag is a deploy
 * profile, while the AppHost code selects the publisher.
 *
 * `cloud-run` is the Docker-image provider target for this slice. It consumes
 * `registry` and `imageName` from `deploy.targets['cloud-run']`, builds and
 * pushes the image with Docker, then applies it via `gcloud run deploy`.
 */
export class AspireCloudDeployTarget implements DeployTargetPort {
  /** Stable target identifier. */
  readonly key: AspireCloudTargetKey;
  /** Human-readable target label. */
  readonly label: string;
  /** Supported public deploy operations. */
  readonly operations: readonly DeployTargetOperation[] = ['plan', 'emit', 'up', 'down'];

  readonly #descriptor: AspireCloudTargetDescriptor;
  readonly #process: ProcessPort;
  readonly #aspireBin: string;
  readonly #dockerBin: string;
  readonly #gcloudBin: string;
  readonly #defaultOutputDir: string;
  readonly #readAppHost: AppHostSourceReader;

  constructor(options: AspireCloudDeployTargetOptions) {
    const descriptor = TARGETS[options.key];
    this.key = descriptor.key;
    this.label = descriptor.label;
    this.#descriptor = descriptor;
    this.#process = options.process;
    this.#aspireBin = options.aspireBin ?? 'aspire';
    this.#dockerBin = options.dockerBin ?? 'docker';
    this.#gcloudBin = options.gcloudBin ?? 'gcloud';
    this.#defaultOutputDir = options.defaultOutputDir ?? descriptor.defaultOutputDir ??
      joinPosix('.deploy', descriptor.key);
    this.#readAppHost = options.readAppHost ?? ((path) => Deno.readTextFile(path));
  }

  /** Preflight or emit the deployment plan for this target. */
  async plan(request: DeployTargetRequest): Promise<DeployTargetResult> {
    if (this.#descriptor.mode === 'cloud-run') {
      const image = this.#cloudRunImage(request);
      return this.#result(
        'plan',
        `docker build -t ${image.ref} . && docker push ${image.ref} && gcloud run deploy ${image.service} --image ${image.ref}`,
      );
    }
    return await this.#publish('plan', request);
  }

  /** Alias of {@link plan}: emit deployment artifacts. */
  emit(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.plan(request);
  }

  /** Apply the target through Aspire or the Cloud Run Docker-image lane. */
  async up(request: DeployTargetRequest): Promise<DeployTargetResult> {
    if (this.#descriptor.mode === 'cloud-run') {
      const image = this.#cloudRunImage(request);
      await this.#exec('up', request, this.#dockerBin, ['build', '-t', image.ref, '.']);
      await this.#exec('up', request, this.#dockerBin, ['push', image.ref]);
      const result = await this.#exec('up', request, this.#gcloudBin, [
        'run',
        'deploy',
        image.service,
        '--image',
        image.ref,
        '--quiet',
      ]);
      return this.#result('up', `gcloud run deploy ${image.service} --image ${image.ref}`, result);
    }

    const { appHost, outputDir } = await this.#appHostRequest(request);
    const args = [
      'deploy',
      '--apphost',
      appHost,
      '--output-path',
      outputDir,
      '--non-interactive',
    ];
    const result = await this.#exec('up', request, this.#aspireBin, args);
    return this.#result('up', `${this.#aspireBin} ${args.join(' ')}`, result);
  }

  /** Tear down the target through Aspire or Cloud Run. */
  async down(request: DeployTargetRequest): Promise<DeployTargetResult> {
    if (this.#descriptor.mode === 'cloud-run') {
      const image = this.#cloudRunImage(request);
      const result = await this.#exec('down', request, this.#gcloudBin, [
        'run',
        'services',
        'delete',
        image.service,
        '--quiet',
      ]);
      return this.#result('down', `gcloud run services delete ${image.service}`, result);
    }

    const { appHost, outputDir } = await this.#appHostRequest(request);
    const args = [
      'destroy',
      '--apphost',
      appHost,
      '--output-path',
      outputDir,
      '--yes',
      '--non-interactive',
    ];
    const result = await this.#exec('down', request, this.#aspireBin, args);
    return this.#result('down', `${this.#aspireBin} ${args.join(' ')}`, result);
  }

  async #publish(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
  ): Promise<DeployTargetResult> {
    const { appHost, outputDir } = await this.#appHostRequest(request);
    const args = [
      'publish',
      '--apphost',
      appHost,
      '--output-path',
      outputDir,
      '--non-interactive',
    ];
    const result = await this.#exec(operation, request, this.#aspireBin, args);
    return this.#result(operation, `${this.#aspireBin} ${args.join(' ')}`, result);
  }

  async #appHostRequest(
    request: DeployTargetRequest,
  ): Promise<{ readonly appHost: string; readonly outputDir: string }> {
    const appHost = this.#appHostPath(request);
    await this.#assertAppHostTargetsPlatform(appHost);
    return { appHost, outputDir: this.#outputDir(request) };
  }

  #outputDir(request: DeployTargetRequest): string {
    return request.outputDir ?? request.targetConfig?.outputPath ?? this.#defaultOutputDir;
  }

  #appHostPath(request: DeployTargetRequest): string {
    const appHost = request.targetConfig?.appHost ?? joinPosix('aspire', 'apphost.mts');
    return isAbsolute(appHost) ? appHost : joinPath(request.projectRoot, appHost);
  }

  async #assertAppHostTargetsPlatform(appHost: string): Promise<void> {
    const markers = this.#descriptor.appHostMarkers ?? [];
    if (markers.length === 0) return;

    let source: string;
    try {
      source = await this.#readAppHost(appHost);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${this.label} requires an AppHost source file for platform validation. ` +
          `Checked ${appHost}: ${detail}. Configure deploy.targets['${this.key}'].appHost ` +
          `or aspire.appHost.`,
      );
    }

    if (markers.some((marker) => source.includes(marker))) return;

    throw new Error(
      `${this.label} requires the AppHost to define the matching platform integration. ` +
        `${this.#descriptor.appHostHint ?? ''} Checked ${appHost}; expected one of: ${
          markers.join(', ')
        }.`,
    );
  }

  #cloudRunImage(
    request: DeployTargetRequest,
  ): { readonly ref: string; readonly service: string } {
    const registry = request.targetConfig?.registry?.replace(/\/+$/, '');
    const imageName = request.targetConfig?.imageName;
    if (!registry || !imageName) {
      throw new Error(
        "Google Cloud Run requires deploy.targets['cloud-run'].registry and imageName.",
      );
    }
    return {
      ref: `${registry}/${imageName}`,
      service: this.#serviceName(imageName),
    };
  }

  #serviceName(imageName: string): string {
    return imageName.split('/').at(-1)?.split(':')[0] || 'netscript-app';
  }

  async #exec(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
    command: string,
    args: readonly string[],
  ): Promise<ProcessResult> {
    const result = await this.#process.exec(command, args, { cwd: request.projectRoot });
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
    _result?: ProcessResult,
  ): DeployTargetResult {
    return {
      target: this.key,
      operation,
      message: `${this.label}: ${message}`,
    };
  }
}
