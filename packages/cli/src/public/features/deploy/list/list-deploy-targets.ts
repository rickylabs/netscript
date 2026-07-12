import type { DeployTargetRegistryPort } from '../../../../kernel/domain/deploy/deploy-target-registry-port.ts';
import type { DeployTargetOperation } from '../../../../kernel/domain/deploy/deploy-target-port.ts';

/** Discoverable deploy target descriptor rendered by `deploy list`. */
export interface DeployTargetDescriptor {
  readonly key: string;
  readonly label: string;
  readonly operations: readonly DeployTargetOperation[];
}

/** List every registered deploy target and its advertised operations. */
export function listDeployTargets(
  registry: DeployTargetRegistryPort,
): readonly DeployTargetDescriptor[] {
  return registry.entries().map(([key, target]) => ({
    key,
    label: target.label,
    operations: [...target.operations],
  }));
}
