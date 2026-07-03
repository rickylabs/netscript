import type { DeployTargetPort } from './deploy-target-port.ts';

/**
 * Well-known deploy target keys reserved by the framework registry shape.
 *
 * `windows-service` ships today; `linux-service` is reserved for the bare-metal
 * Linux (systemd) adapter that is registered at the bare-metal realization slice
 * (#339). Adapters may still register under any string key — this union
 * documents the first-party reservations so sibling deployment slices agree on
 * the canonical keys without registering an adapter here.
 */
export type KnownDeployTargetKey = 'windows-service' | 'linux-service';

/** Registry surface for deploy target adapters. */
export interface DeployTargetRegistryPort {
  /** Register or replace a deploy target adapter. */
  readonly register: (key: string, target: DeployTargetPort) => void;
  /** Resolve a deploy target adapter by key. */
  readonly get: (key: string) => DeployTargetPort | undefined;
  /** List deploy target adapters in deterministic order. */
  readonly entries: () => readonly (readonly [string, DeployTargetPort])[];
}
