/** Job initialization context. */
export interface InitContext {
  readonly signal?: AbortSignal;
}

/** Job disposal context. */
export interface DisposeContext {
  readonly reason?: string;
}

/** Stub-only contract for job lifecycle adapters. */
export abstract class JobLifecycleAdapter {
  abstract init(ctx: InitContext): Promise<void>;
  abstract dispose(ctx: DisposeContext): Promise<void>;
}
