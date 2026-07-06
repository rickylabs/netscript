import type { DeployTargetPort } from './deploy-target-port.ts';

/**
 * Well-known deploy target keys reserved by the framework registry shape.
 *
 * Adapters may still register under any string key — this union documents the
 * first-party reservations so sibling deployment slices agree on the canonical
 * keys.
 */
export type KnownDeployTargetKey =
  | 'windows-service'
  | 'linux-service'
  | 'deno-deploy'
  | 'compose'
  | 'docker'
  | 'kubernetes'
  | 'azure-aca'
  | 'azure-app-service'
  | 'azure-aks'
  | 'cloud-run';

/** Registry surface for deploy target adapters. */
export interface DeployTargetRegistryPort {
  /** Register or replace a deploy target adapter. */
  readonly register: (key: string, target: DeployTargetPort) => void;
  /** Resolve a deploy target adapter by key. */
  readonly get: (key: string) => DeployTargetPort | undefined;
  /** List deploy target adapters in deterministic order. */
  readonly entries: () => readonly (readonly [string, DeployTargetPort])[];
}
