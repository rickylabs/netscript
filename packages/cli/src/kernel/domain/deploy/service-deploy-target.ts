import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from './deploy-target-port.ts';
import { type ActivationPort, rollbackToPrevious } from './rollback-convention.ts';
import { reconcileSecrets, type SecretsBundle, type SecretsStorePort } from './secrets-convention.ts';
import {
  type ActivateWithHealthGateRequest,
  activateWithHealthGate,
} from './activation-convention.ts';
import type { HealthProbePort, SleepFn } from './health-gate.ts';

/**
 * Canonical operations every bare-metal OS-service deploy target supports as a
 * bare descriptor. `rollback`/`secrets` are added to a target's advertised
 * `operations` only when the corresponding core port is injected (see
 * {@link ServiceDeployTarget.operations}) so an unwired descriptor never exposes
 * an op it cannot really perform (LD-4: omit rather than silent no-op).
 */
export const SERVICE_DEPLOY_OPERATIONS: readonly DeployTargetOperation[] = [
  'plan',
  'emit',
  'up',
  'down',
  'status',
  'logs',
];

/** Real timer for the health-gate retry loop when no deterministic `sleep` is injected. */
const defaultSleep: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Optional core-domain ports that promote a {@link ServiceDeployTarget} from a
 * bare 6-op descriptor to a wired 7-op adapter. All ports are kernel-domain
 * seams (no `public/**` dependency), so injecting them keeps the adapter inside
 * the hexagonal kernel boundary. When a port is absent the matching op falls
 * back to the descriptor result.
 */
export interface ServiceDeployTargetPorts {
  /** Atomic activation + history seam. Presence advertises + wires `rollback` (and gates `up`). */
  readonly activation?: ActivationPort;
  /** Restricted secret store. Presence advertises + wires `secrets`. */
  readonly secretsStore?: SecretsStorePort;
  /** Health-probe transport that gates `up` (used with `activation` + `resolveActivation`). */
  readonly health?: HealthProbePort;
  /** Deterministic timer for the health gate; defaults to a real `setTimeout` delay. */
  readonly sleep?: SleepFn;
  /** Resolve the health-gated activation request for an `up` (candidate release + probe spec). */
  readonly resolveActivation?: (
    request: DeployTargetRequest,
  ) => ActivateWithHealthGateRequest | Promise<ActivateWithHealthGateRequest>;
  /** Resolve the desired secret bundle for a `secrets` reconcile. */
  readonly resolveSecrets?: (
    request: DeployTargetRequest,
  ) => SecretsBundle | Promise<SecretsBundle>;
}

/**
 * Shared base for bare-metal OS-service deploy targets (Windows Servy / Linux
 * systemd). Concrete targets differ only by `key`/`label`; the canonical op
 * surface and the legacy `build`/`install`/`uninstall` verb aliases (LD-3) are
 * identical, so they are centralized here rather than duplicated per OS (mirrors
 * the endorsed base-plugin-service seam).
 *
 * Constructed with no ports, an instance is the Archetype-7 descriptor /
 * extension-point identity exposed through `kernel/extension-points.ts`: it
 * advertises the 6-op subset and every handler returns the canonical operation
 * descriptor. Constructed with {@link ServiceDeployTargetPorts}, the same class
 * becomes the wired 7-op reference binding — `rollback`/`secrets` delegate to the
 * target-agnostic core orchestrators and `up` runs a health-gated activation —
 * without importing the public build pipeline (that remains a public-layer
 * concern; see drift.md D-S8). Injected ports are kernel-domain seams, so this
 * delegation stays inside the hexagonal kernel boundary.
 */
export abstract class ServiceDeployTarget implements DeployTargetPort {
  abstract readonly key: string;
  abstract readonly label: string;

  protected readonly ports: ServiceDeployTargetPorts;

  constructor(ports: ServiceDeployTargetPorts = {}) {
    this.ports = ports;
  }

  /**
   * Advertised operations: the canonical 6-op subset, plus `rollback` when an
   * {@link ActivationPort} is wired and `secrets` when a {@link SecretsStorePort}
   * is wired. The router derives its verb subcommands from this list, so an
   * unwired descriptor never exposes `rollback`/`secrets`.
   */
  get operations(): readonly DeployTargetOperation[] {
    const ops: DeployTargetOperation[] = [...SERVICE_DEPLOY_OPERATIONS];
    if (this.ports.activation) ops.push('rollback');
    if (this.ports.secretsStore) ops.push('secrets');
    return ops;
  }

  /** Compute the deployment plan for this target. */
  plan(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('plan', request);
  }

  /** Emit deployment artifacts for this target. */
  emit(request: DeployTargetRequest): Promise<DeployTargetResult> {
    return this.#result('emit', request);
  }

  /**
   * Bring the deployment up. When an {@link ActivationPort}, {@link HealthProbePort},
   * and `resolveActivation` are all wired, `up` runs the core health-gated
   * activation (atomic cutover + probe + automatic rollback on failure);
   * otherwise it returns the descriptor result.
   */
  async up(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const { activation, health, resolveActivation } = this.ports;
    if (!activation || !health || !resolveActivation) return this.#result('up', request);

    const activateRequest = await resolveActivation(request);
    const result = await activateWithHealthGate(activateRequest, {
      activation,
      health,
      sleep: this.ports.sleep ?? defaultSleep,
    });
    const message = result.activated
      ? `${this.label} up: activated ${result.release} (health-gated, ${result.attempts} probe(s))`
      : `${this.label} up: ${result.release} failed the health gate after ${result.attempts} probe(s)` +
        (result.rolledBackTo ? `; rolled back to ${result.rolledBackTo}` : '');
    return { target: this.key, operation: 'up', message };
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

  /**
   * Roll the deployment back to its previous healthy release via the core
   * {@link rollbackToPrevious} orchestrator when an {@link ActivationPort} is
   * wired; otherwise returns the descriptor result.
   */
  async rollback(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const { activation } = this.ports;
    if (!activation) return this.#result('rollback', request);

    const result = await rollbackToPrevious({ target: this.key }, activation);
    const message = result.rolledBack
      ? `${this.label} rolled back to ${result.activated}`
      : `${this.label} rollback: ${result.reason}`;
    return { target: this.key, operation: 'rollback', message };
  }

  /**
   * Reconcile the target's secrets to the resolved bundle via the core
   * {@link reconcileSecrets} orchestrator when a {@link SecretsStorePort} and
   * `resolveSecrets` are wired; otherwise returns the descriptor result.
   */
  async secrets(request: DeployTargetRequest): Promise<DeployTargetResult> {
    const { secretsStore, resolveSecrets } = this.ports;
    if (!secretsStore || !resolveSecrets) return this.#result('secrets', request);

    const bundle = await resolveSecrets(request);
    const result = await reconcileSecrets({ bundle }, secretsStore);
    const message =
      `${this.label} secrets: wrote ${result.written.length}, pruned ${result.pruned.length}`;
    return { target: this.key, operation: 'secrets', message };
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
