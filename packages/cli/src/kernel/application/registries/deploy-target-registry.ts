import { Registry } from '../abstracts/registry.ts';

/** Deploy target identifiers supported by public deploy commands. */
export type DeployTargetKey = 'windows-service';

/** Metadata for a deploy target exposed by the CLI. */
export interface DeployTarget {
  /** Stable target identifier. */
  readonly key: DeployTargetKey;
  /** Human-readable target label. */
  readonly label: string;
  /** Supported public deploy operations for the target. */
  readonly operations: readonly ['build', 'install', 'uninstall'];
}

/** Windows service deploy target descriptor. */
export const WINDOWS_SERVICE_DEPLOY_TARGET: DeployTarget = {
  key: 'windows-service',
  label: 'Windows service',
  operations: ['build', 'install', 'uninstall'],
};

/** Ordered default deployment targets. */
export const DEFAULT_DEPLOY_TARGETS: readonly (readonly [DeployTargetKey, DeployTarget])[] = Object
  .freeze([
    ['windows-service', WINDOWS_SERVICE_DEPLOY_TARGET],
  ]);

/** Registry for supported deployment targets. */
export class DeployTargetRegistry extends Registry<DeployTargetKey, DeployTarget> {
  override readonly id = 'deploy-targets';

  readonly #targets = new Map<DeployTargetKey, DeployTarget>();

  constructor(
    targets: readonly (readonly [DeployTargetKey, DeployTarget])[] = DEFAULT_DEPLOY_TARGETS,
  ) {
    super();
    for (const [key, target] of targets) {
      this.register(key, target);
    }
  }

  /** Register or replace a deploy target. */
  override register(key: DeployTargetKey, target: DeployTarget): void {
    this.#targets.set(key, target);
  }

  /** Resolve a deploy target by key. */
  override get(key: DeployTargetKey): DeployTarget | undefined {
    return this.#targets.get(key);
  }

  /** List registered deploy targets in deterministic order. */
  override entries(): readonly (readonly [DeployTargetKey, DeployTarget])[] {
    return [...this.#targets.entries()].sort(([left], [right]) => left.localeCompare(right));
  }
}
