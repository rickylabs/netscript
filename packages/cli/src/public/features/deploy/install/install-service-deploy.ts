import { join } from '@std/path';
import {
  detectServiceOs,
  fullServiceNameForOs,
  type ServiceOs,
  serviceConfigPath,
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

/** Request for installing services from deployment artifacts. */
export interface InstallServiceDeployRequest {
  /** Optional installed application directory. */
  readonly installDir?: string;

  /** Optional build output directory. */
  readonly deployDir?: string;

  /** Optional single service name. */
  readonly service?: string;

  /** Whether existing registrations may be overwritten. */
  readonly force: boolean;
}

/** Dependencies for the public service install flow. */
export interface InstallServiceDeployDependencies {
  /** Deployment manifest resolver. */
  readonly manifests: ServiceManifestPort;

  /** OS service lifecycle adapter (servy on Windows, systemd on Linux). */
  readonly services: OsServicePort;

  /** Target service OS. Defaults to the detected host OS. */
  readonly os?: ServiceOs;
}

/** Result of installing deployment services. */
export interface InstallServiceDeployResult {
  /** Resolved manifest and install directory. */
  readonly resolved: ResolvedServiceManifest;

  /** Service names that installed successfully. */
  readonly installed: readonly string[];

  /** Service names that failed installation. */
  readonly failed: readonly string[];
}

/** Deploy install step that registers manifest services. */
export class InstallServiceDeployStep
  extends PipelineStep<InstallServiceDeployRequest, InstallServiceDeployResult> {
  readonly id = 'public.deploy.install.register-services';

  constructor(private readonly dependencies: InstallServiceDeployDependencies) {
    super();
  }

  inspect(input: InstallServiceDeployRequest): PipelineStepInspection {
    return {
      id: this.id,
      label: 'Install Windows services',
      touches: [input.installDir ?? input.deployDir ?? 'deployment manifest'],
    };
  }

  prepare(input: InstallServiceDeployRequest): InstallServiceDeployRequest {
    return input;
  }

  async execute(request: InstallServiceDeployRequest): Promise<InstallServiceDeployResult> {
    const resolved = await this.dependencies.manifests.resolve({
      installDir: request.installDir,
      deployDir: request.deployDir,
    });
    const serviceNames = selectServiceNames(resolved.manifest.services, 'start', request.service);
    const os = this.dependencies.os ?? detectServiceOs();
    const configDir = join(resolved.installDir, 'config');
    const installed: string[] = [];
    const failed: string[] = [];

    for (const serviceName of serviceNames) {
      const result = await this.dependencies.services.install({
        serviceName: fullServiceNameForOs(os, serviceName),
        configPath: serviceConfigPath(os, configDir, serviceName),
        force: request.force,
      });
      if (result.success) installed.push(serviceName);
      else failed.push(serviceName);
    }

    return { resolved, installed, failed };
  }
}

/** Public deploy install pipeline. */
export class InstallServiceDeployPipeline
  extends Pipeline<InstallServiceDeployRequest, InstallServiceDeployResult> {
  readonly id = 'public.deploy.install';
  protected readonly steps: readonly PipelineStep<unknown, unknown>[];

  constructor(dependencies: InstallServiceDeployDependencies) {
    super();
    this.steps = [new InstallServiceDeployStep(dependencies)];
  }
}

/** Install one or more services from deployment artifacts. */
export async function installServiceDeploy(
  request: InstallServiceDeployRequest,
  dependencies: InstallServiceDeployDependencies,
): Promise<InstallServiceDeployResult> {
  return (await new InstallServiceDeployPipeline(dependencies).execute(request)).output;
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
