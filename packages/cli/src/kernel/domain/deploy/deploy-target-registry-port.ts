import type { DeployTargetPort } from './deploy-target-port.ts';

/** Registry surface for deploy target adapters. */
export interface DeployTargetRegistryPort {
  /** Register or replace a deploy target adapter. */
  readonly register: (key: string, target: DeployTargetPort) => void;
  /** Resolve a deploy target adapter by key. */
  readonly get: (key: string) => DeployTargetPort | undefined;
  /** List deploy target adapters in deterministic order. */
  readonly entries: () => readonly (readonly [string, DeployTargetPort])[];
}
