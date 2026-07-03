import {
  detectServiceOs,
  fullServiceNameForOs,
  type ServiceOs,
} from '../../../../kernel/adapters/deploy/runtime-detect.ts';
import { Pipeline } from '../../../../kernel/application/abstracts/pipeline.ts';
import {
  PipelineStep,
  type PipelineStepInspection,
} from '../../../../kernel/application/abstracts/pipeline-step.ts';
import type {
  ResolvedServiceManifest,
  ServiceManifestPort,
} from '../../../ports/service-manifest-port.ts';
import type { OsServicePort } from '../../../ports/os-service-port.ts';

/** Request for uninstalling deployed services. */
export interface UninstallServiceDeployRequest {
  /** Optional installed application directory. */
  readonly installDir?: string;

  /** Optional build output directory. */
  readonly deployDir?: string;

  /** Optional single service name. */
  readonly service?: string;

  /** Stop each service before uninstalling it. */
  readonly stopFirst: boolean;
}

/** Dependencies for the public service uninstall flow. */
export interface UninstallServiceDeployDependencies {
  /** Deployment manifest resolver. */
  readonly manifests: ServiceManifestPort;

  /** OS service lifecycle adapter (servy on Windows, systemd on Linux). */
  readonly services: OsServicePort;

  /** Target service OS. Defaults to the detected host OS. */
  readonly os?: ServiceOs;
}

/** Result of uninstalling deployment services. */
export interface UninstallServiceDeployResult {
  /** Resolved manifest and install directory. */
  readonly resolved: ResolvedServiceManifest;

  /** Service names that uninstalled successfully. */
  readonly uninstalled: readonly string[];

  /** Service names that failed uninstall. */
  readonly failed: readonly string[];
}

/** Deploy uninstall step that removes manifest services. */
export class UninstallServiceDeployStep
  extends PipelineStep<UninstallServiceDeployRequest, UninstallServiceDeployResult> {
  readonly id = 'public.deploy.uninstall.remove-services';

  constructor(private readonly dependencies: UninstallServiceDeployDependencies) {
    super();
  }

  inspect(input: UninstallServiceDeployRequest): PipelineStepInspection {
    return {
      id: this.id,
      label: 'Uninstall Windows services',
      touches: [input.installDir ?? input.deployDir ?? 'deployment manifest'],
    };
  }

  prepare(input: UninstallServiceDeployRequest): UninstallServiceDeployRequest {
    return input;
  }

  async execute(request: UninstallServiceDeployRequest): Promise<UninstallServiceDeployResult> {
    const resolved = await this.dependencies.manifests.resolve({
      installDir: request.installDir,
      deployDir: request.deployDir,
    });
    const serviceNames = selectServiceNames(resolved.manifest.services, 'stop', request.service);
    const os = this.dependencies.os ?? detectServiceOs();
    const uninstalled: string[] = [];
    const failed: string[] = [];

    for (const serviceName of serviceNames) {
      const osName = fullServiceNameForOs(os, serviceName);
      if (request.stopFirst) await this.dependencies.services.run('stop', osName);
      const result = await this.dependencies.services.run('uninstall', osName);
      if (result.success) uninstalled.push(serviceName);
      else failed.push(serviceName);
    }

    return { resolved, uninstalled, failed };
  }
}

/** Public deploy uninstall pipeline. */
export class UninstallServiceDeployPipeline
  extends Pipeline<UninstallServiceDeployRequest, UninstallServiceDeployResult> {
  readonly id = 'public.deploy.uninstall';
  protected readonly steps: readonly PipelineStep<unknown, unknown>[];

  constructor(dependencies: UninstallServiceDeployDependencies) {
    super();
    this.steps = [new UninstallServiceDeployStep(dependencies)];
  }
}

/** Uninstall one or more services from deployment artifacts. */
export async function uninstallServiceDeploy(
  request: UninstallServiceDeployRequest,
  dependencies: UninstallServiceDeployDependencies,
): Promise<UninstallServiceDeployResult> {
  return (await new UninstallServiceDeployPipeline(dependencies).execute(request)).output;
}

function selectServiceNames(
  services: Record<string, unknown>,
  mode: 'start' | 'stop',
  singleService?: string,
): string[] {
  if (singleService) {
    if (!services[singleService]) {
      const available = Object.keys(services).join(', ');
      throw new Error(`Service "${singleService}" not found in manifest. Available: ${available}`);
    }
    return [singleService];
  }
  const names = Object.keys(services);
  return mode === 'stop' ? [...names].reverse() : names;
}
