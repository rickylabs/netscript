import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from './deploy-target-port.ts';

/**
 * Canonical operations every bare-metal OS-service deploy target supports.
 * `rollback`/`secrets` are declared-unsupported (omitted) until the deployment
 * hardening slice (#341, LD-4) — an adapter omits the method rather than shipping
 * a silent no-op.
 */
export const SERVICE_DEPLOY_OPERATIONS: readonly DeployTargetOperation[] = [
  'plan',
  'emit',
  'up',
  'down',
  'status',
  'logs',
];

/**
 * Shared base for bare-metal OS-service deploy targets (Windows Servy / Linux
 * systemd). Concrete targets differ only by `key`/`label`; the canonical 6-op
 * surface and the legacy `build`/`install`/`uninstall` verb aliases (LD-3) are
 * identical, so they are centralized here rather than duplicated per OS (mirrors
 * the endorsed base-plugin-service seam).
 *
 * These adapters are the Archetype-7 descriptor / extension-point surface exposed
 * through `kernel/extension-points.ts`. Execution of the real build/install
 * pipeline stays on the public `deploy-group` path: as kernel-domain code these
 * adapters must NOT import the public `OsServicePort`/build pipeline (hexagonal
 * layering — kernel may not depend on public). The handlers therefore return the
 * canonical operation descriptor; wiring an injected port/compile delegation onto
 * this seam is a public-layer concern tracked for #341 (see drift.md D-S8).
 */
export abstract class ServiceDeployTarget implements DeployTargetPort {
  abstract readonly key: string;
  abstract readonly label: string;
  readonly operations: readonly DeployTargetOperation[] = SERVICE_DEPLOY_OPERATIONS;

  /** Compute the deployment plan for this target. */
  plan(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('plan', request);
  }

  /** Emit deployment artifacts for this target. */
  emit(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('emit', request);
  }

  /** Bring the deployment up (install + enable + start). */
  up(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('up', request);
  }

  /** Bring the deployment down (stop + disable + uninstall). */
  down(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('down', request);
  }

  /** Report the current deployment status for this target. */
  status(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('status', request);
  }

  /** Tail deployment logs for this target. */
  logs(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('logs', request);
  }

  /** Legacy alias of `plan`/`emit` (LD-3). */
  build(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('build', request);
  }

  /** Legacy alias of `up` (LD-3). */
  install(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('install', request);
  }

  /** Legacy alias of `down` (LD-3). */
  uninstall(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('uninstall', request);
  }

  #result(
    operation: DeployTargetOperation,
    request: DeployTargetRequest,
  ): Promise<DeployTargetResult> {
    return Promise.resolve({
      target: this.key,
      operation,
      message: `${this.label} ${operation} for ${request.projectRoot}`,
    });
  }
}
