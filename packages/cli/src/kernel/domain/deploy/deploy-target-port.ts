/**
 * Canonical deploy lifecycle operations (Archetype 7 — the uniform 7-op
 * contract every deploy target adapter conforms to).
 *
 * A target adapter implements only the subset it supports. The legacy CLI verbs
 * map onto the canonical ops as: `build` → `plan`/`emit`, `install` → `up`,
 * `uninstall` → `down`. `status`, `logs`, `rollback`, and `secrets` are net-new
 * lifecycle ops the legacy 3-op seed did not have. `rollback`/`secrets` bodies
 * land with the deployment hardening slice (#341); until then adapters may
 * declare them unsupported (omit the method) rather than provide a silent no-op.
 */
export type DeployOperation =
  | 'plan'
  | 'emit'
  | 'up'
  | 'down'
  | 'status'
  | 'logs'
  | 'rollback'
  | 'secrets';

/**
 * Legacy CLI deploy verbs retained as thin-router aliases of the canonical
 * {@link DeployOperation} set (`build` → `plan`/`emit`, `install` → `up`,
 * `uninstall` → `down`). Kept alongside the canonical names so existing adapters
 * and the CLI verb surface stay stable; new adapters should prefer the canonical
 * operation names.
 */
export type LegacyDeployOperation = 'build' | 'install' | 'uninstall';

/** Public deploy operation exposed by a deploy target adapter. */
export type DeployTargetOperation = DeployOperation | LegacyDeployOperation;

/**
 * Target-specific config values resolved by the CLI command surface.
 *
 * The router passes only fields that are valid for the configured target. The
 * adapter decides which subset it consumes; unknown target config is not a
 * published extension bag.
 */
export interface DeployTargetRequestConfig {
  /** Directory for emitted deployment artifacts. */
  readonly outputPath?: string;
  /** AppHost entrypoint/project path used for Aspire-backed targets. */
  readonly appHost?: string;
  /** Container registry used by Docker-image provider targets. */
  readonly registry?: string;
  /** Container image name/tag used by Docker-image provider targets. */
  readonly imageName?: string;
}

/** Request passed to deploy target operations. */
export interface DeployTargetRequest {
  /** Project root for the deployment operation. */
  readonly projectRoot: string;
  /** Optional deployment output directory. */
  readonly outputDir?: string;
  /** Optional Aspire deployment environment (for example, `staging`). */
  readonly environment?: string;
  /** Whether Aspire deploy should clear and avoid saving deployment state. */
  readonly clearCache?: boolean;
  /** Whether the underlying deploy tool should run without prompts. */
  readonly nonInteractive?: boolean;
  /** Target-specific config resolved from `deploy.targets.<key>`. */
  readonly targetConfig?: DeployTargetRequestConfig;
}

/** Result returned by deploy target operations. */
export interface DeployTargetResult {
  /** Target that handled the operation. */
  readonly target: string;
  /** Operation that was handled. */
  readonly operation: DeployTargetOperation;
  /** Human-readable status message. */
  readonly message: string;
}

/** Signature shared by every deploy target lifecycle operation. */
export type DeployTargetOperationHandler = (
  request: DeployTargetRequest,
) => Promise<DeployTargetResult>;

/**
 * Deploy target adapter surface used by CLI extension registries.
 *
 * Every operation method is optional: an adapter declares the subset of the
 * canonical {@link DeployOperation} contract it supports (mirrored by
 * {@link DeployTargetPort.operations}). The legacy `build`/`install`/`uninstall`
 * aliases are retained so the shipped seed and CLI verbs keep working while the
 * bare-metal and cloud adapters adopt the canonical op names.
 */
export interface DeployTargetPort {
  /** Stable target identifier. */
  readonly key: string;
  /** Human-readable target label. */
  readonly label: string;
  /** Supported public deploy operations for the target. */
  readonly operations: readonly DeployTargetOperation[];

  /** Compute the deployment plan/artifact spec for this target. */
  readonly plan?: DeployTargetOperationHandler;
  /** Emit deployment artifacts for this target. */
  readonly emit?: DeployTargetOperationHandler;
  /** Bring the deployment up (install + enable + start). */
  readonly up?: DeployTargetOperationHandler;
  /** Bring the deployment down (stop + disable + uninstall). */
  readonly down?: DeployTargetOperationHandler;
  /** Report the current deployment status for this target. */
  readonly status?: DeployTargetOperationHandler;
  /** Stream or tail deployment logs for this target. */
  readonly logs?: DeployTargetOperationHandler;
  /** Roll the deployment back to a previous revision (bodies → #341). */
  readonly rollback?: DeployTargetOperationHandler;
  /** Reconcile deployment secrets for this target (bodies → #341). */
  readonly secrets?: DeployTargetOperationHandler;

  /** Legacy alias of `plan`/`emit`: build deployment assets for this target. */
  readonly build?: DeployTargetOperationHandler;
  /** Legacy alias of `up`: install deployment assets for this target. */
  readonly install?: DeployTargetOperationHandler;
  /** Legacy alias of `down`: uninstall deployment assets for this target. */
  readonly uninstall?: DeployTargetOperationHandler;
}
