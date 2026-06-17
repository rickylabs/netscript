/** Public deploy operation exposed by a deploy target adapter. */
export type DeployTargetOperation = 'build' | 'install' | 'uninstall';

/** Request passed to deploy target operations. */
export interface DeployTargetRequest {
  /** Project root for the deployment operation. */
  readonly projectRoot: string;
  /** Optional deployment output directory. */
  readonly outputDir?: string;
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

/** Deploy target adapter surface used by CLI extension registries. */
export interface DeployTargetPort {
  /** Stable target identifier. */
  readonly key: string;
  /** Human-readable target label. */
  readonly label: string;
  /** Supported public deploy operations for the target. */
  readonly operations: readonly DeployTargetOperation[];
  /** Build deployment assets for this target. */
  readonly build?: (request: DeployTargetRequest) => Promise<DeployTargetResult>;
  /** Install deployment assets for this target. */
  readonly install?: (request: DeployTargetRequest) => Promise<DeployTargetResult>;
  /** Uninstall deployment assets for this target. */
  readonly uninstall?: (request: DeployTargetRequest) => Promise<DeployTargetResult>;
}
