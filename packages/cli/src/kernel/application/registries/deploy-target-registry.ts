import { Registry } from '../abstracts/registry.ts';
import type { DeployTargetPort } from '../../domain/deploy/deploy-target-port.ts';
import type { DeployTargetRegistryPort } from '../../domain/deploy/deploy-target-registry-port.ts';
import { WindowsServiceDeployTarget } from '../../domain/deploy/windows-service-deploy-target.ts';
import { LinuxServiceDeployTarget } from '../../domain/deploy/linux-service-deploy-target.ts';
import { AspireComposeDeployTarget } from '../../adapters/aspire/aspire-compose-deploy-target.ts';
import { AspireCloudDeployTarget } from '../../adapters/aspire/aspire-cloud-deploy-target.ts';
import { createDenoDeployTarget } from '../../adapters/deno-deploy/create-deno-deploy-target.ts';
import { DenoProcess } from '../../adapters/runtime/process/deno-process.ts';

/** Metadata and operations for a deploy target exposed by the CLI. */
export type DeployTarget = DeployTargetPort;

/** Windows service deploy target descriptor. */
export const WINDOWS_SERVICE_DEPLOY_TARGET: DeployTarget = new WindowsServiceDeployTarget();

/** Linux (systemd) service deploy target descriptor. */
export const LINUX_SERVICE_DEPLOY_TARGET: DeployTarget = new LinuxServiceDeployTarget();

/**
 * Deno Deploy cloud target descriptor. Composed with the concrete `deno deploy`
 * CLI adapter (ProcessPort-backed) and the FS preflight reader; the registry
 * instance carries no baked defaults (the CLI surface builds a config-resolved
 * instance per invocation).
 */
export const DENO_DEPLOY_TARGET: DeployTarget = createDenoDeployTarget();

/** Aspire-backed Docker Compose target descriptor. */
export const COMPOSE_DEPLOY_TARGET: DeployTarget = new AspireComposeDeployTarget({
  key: 'compose',
  process: new DenoProcess(),
});

/** Aspire-backed Docker target descriptor. */
export const DOCKER_DEPLOY_TARGET: DeployTarget = new AspireComposeDeployTarget({
  key: 'docker',
  process: new DenoProcess(),
});

/** Aspire-backed Kubernetes target descriptor. */
export const KUBERNETES_DEPLOY_TARGET: DeployTarget = new AspireCloudDeployTarget({
  key: 'kubernetes',
  process: new DenoProcess(),
});

/** Aspire-backed Azure Container Apps target descriptor. */
export const AZURE_ACA_DEPLOY_TARGET: DeployTarget = new AspireCloudDeployTarget({
  key: 'azure-aca',
  process: new DenoProcess(),
});

/** Aspire-backed Azure App Service target descriptor. */
export const AZURE_APP_SERVICE_DEPLOY_TARGET: DeployTarget = new AspireCloudDeployTarget({
  key: 'azure-app-service',
  process: new DenoProcess(),
});

/** Aspire-backed Azure Kubernetes Service target descriptor. */
export const AZURE_AKS_DEPLOY_TARGET: DeployTarget = new AspireCloudDeployTarget({
  key: 'azure-aks',
  process: new DenoProcess(),
});

/** Aspire-backed Cloud Run Docker-image target descriptor. */
export const CLOUD_RUN_DEPLOY_TARGET: DeployTarget = new AspireCloudDeployTarget({
  key: 'cloud-run',
  process: new DenoProcess(),
});

/** Ordered default deployment targets. */
export const DEFAULT_DEPLOY_TARGETS: readonly (readonly [string, DeployTarget])[] = Object
  .freeze([
    ['azure-aca', AZURE_ACA_DEPLOY_TARGET],
    ['azure-aks', AZURE_AKS_DEPLOY_TARGET],
    ['azure-app-service', AZURE_APP_SERVICE_DEPLOY_TARGET],
    ['cloud-run', CLOUD_RUN_DEPLOY_TARGET],
    ['kubernetes', KUBERNETES_DEPLOY_TARGET],
    ['windows-service', WINDOWS_SERVICE_DEPLOY_TARGET],
    ['linux-service', LINUX_SERVICE_DEPLOY_TARGET],
    ['deno-deploy', DENO_DEPLOY_TARGET],
    ['compose', COMPOSE_DEPLOY_TARGET],
    ['docker', DOCKER_DEPLOY_TARGET],
  ]);

/** Registry for supported deployment targets. */
export class DeployTargetRegistry extends Registry<string, DeployTarget>
  implements DeployTargetRegistryPort {
  override readonly id = 'deploy-targets';

  readonly #targets = new Map<string, DeployTarget>();

  constructor(
    targets: readonly (readonly [string, DeployTarget])[] = DEFAULT_DEPLOY_TARGETS,
  ) {
    super();
    for (const [key, target] of targets) {
      this.register(key, target);
    }
  }

  /** Register or replace a deploy target. */
  override register(key: string, target: DeployTarget): void {
    this.#targets.set(key, target);
  }

  /** Resolve a deploy target by key. */
  override get(key: string): DeployTarget | undefined {
    return this.#targets.get(key);
  }

  /** List registered deploy targets in deterministic order. */
  override entries(): readonly (readonly [string, DeployTarget])[] {
    return [...this.#targets.entries()].sort(([left], [right]) => left.localeCompare(right));
  }
}
