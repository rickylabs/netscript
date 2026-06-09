/** Job initialization context. */
export interface InitContext {
  /** Cancellation signal for initialization. */
  readonly signal?: AbortSignal;
}

/** Job disposal context. */
export interface DisposeContext {
  /** Disposal reason. */
  readonly reason?: string;
}

/** Stub-only contract for job lifecycle adapters. */
export abstract class JobLifecycleAdapter {
  /** Initialize lifecycle resources. */
  abstract init(ctx: InitContext): Promise<void>;
  /** Dispose lifecycle resources. */
  abstract dispose(ctx: DisposeContext): Promise<void>;
}
