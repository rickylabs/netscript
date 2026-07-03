import { Registry } from '../abstracts/registry.ts';
import type { DeployTargetPort } from '../../domain/deploy/deploy-target-port.ts';
import type { DeployTargetRegistryPort } from '../../domain/deploy/deploy-target-registry-port.ts';
import { WindowsServiceDeployTarget } from '../../domain/deploy/windows-service-deploy-target.ts';
import { LinuxServiceDeployTarget } from '../../domain/deploy/linux-service-deploy-target.ts';

/** Metadata and operations for a deploy target exposed by the CLI. */
export type DeployTarget = DeployTargetPort;

/** Windows service deploy target descriptor. */
export const WINDOWS_SERVICE_DEPLOY_TARGET: DeployTarget = new WindowsServiceDeployTarget();

/** Linux (systemd) service deploy target descriptor. */
export const LINUX_SERVICE_DEPLOY_TARGET: DeployTarget = new LinuxServiceDeployTarget();

/** Ordered default deployment targets. */
export const DEFAULT_DEPLOY_TARGETS: readonly (readonly [string, DeployTarget])[] = Object
  .freeze([
    ['windows-service', WINDOWS_SERVICE_DEPLOY_TARGET],
    ['linux-service', LINUX_SERVICE_DEPLOY_TARGET],
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
