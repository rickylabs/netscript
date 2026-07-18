import type { DESKTOP_RPC_BINDING_STATUSES, DESKTOP_RPC_DISABLED_REASONS } from './constants.ts';

/** Minimal native-window surface consumed by the Fresh Desktop adapter. */
export interface DesktopBindableWindow {
  /** Register one promise-based native binding handler. */
  bind(
    name: string,
    handler: (operation: unknown, payload?: unknown) => Promise<unknown>,
  ): void;
  /** Remove a binding during lifecycle cleanup when the runtime supports it. */
  unbind?(name: string): void | Promise<void>;
}

/** Structural oRPC procedure node accepted by the Desktop runtime adapter. */
export interface DesktopRpcProcedure {
  /** oRPC's runtime procedure marker. */
  readonly '~orpc': unknown;
}

/** Existing oRPC procedure or recursively keyed router. */
export type DesktopRpcRouter =
  | DesktopRpcProcedure
  | { readonly [key: string]: DesktopRpcRouter };

/** Structural Deno capability used to gate Desktop-only activation. */
export interface DesktopRuntimeCapability {
  /** Deno Desktop window constructor; absent in browser and Aspire processes. */
  readonly BrowserWindow?: unknown;
}

/** Options for binding one existing oRPC router to one Desktop window. */
export interface BindDesktopRpcWindowOptions {
  /** Native window that owns the binding and its isolated transport state. */
  readonly window?: DesktopBindableWindow;
  /** Existing oRPC router shared with other NetScript transports. */
  readonly router: DesktopRpcRouter;
  /** Fixed oRPC context for calls from this window. */
  readonly context: Record<PropertyKey, unknown>;
  /** Optional binding name. Defaults to the SDK Desktop binding constant. */
  readonly bindingName?: string;
  /** Explicit capability seam for tests and non-global embedders. */
  readonly runtime?: DesktopRuntimeCapability | null;
}

/** Fresh Desktop RPC binding lifecycle status. */
export type DesktopRpcBindingStatus =
  (typeof DESKTOP_RPC_BINDING_STATUSES)[keyof typeof DESKTOP_RPC_BINDING_STATUSES];

/** Reason a Fresh Desktop RPC binding was disabled. */
export type DesktopRpcDisabledReason =
  (typeof DESKTOP_RPC_DISABLED_REASONS)[keyof typeof DESKTOP_RPC_DISABLED_REASONS];

/** Active binding lifecycle for one native window. */
export interface BoundDesktopRpcWindowBinding {
  /** Active lifecycle discriminator. */
  readonly status: typeof DESKTOP_RPC_BINDING_STATUSES.BOUND;
  /** Native binding name registered on the supplied window. */
  readonly bindingName: string;
  /** Close the transport and unbind the native handler exactly once. */
  close(): Promise<void>;
}

/** Inert lifecycle returned outside a usable Desktop window. */
export interface DisabledDesktopRpcWindowBinding {
  /** Disabled lifecycle discriminator. */
  readonly status: typeof DESKTOP_RPC_BINDING_STATUSES.DISABLED;
  /** Capability reason for the no-op. */
  readonly reason: DesktopRpcDisabledReason;
  /** Idempotent no-op for unconditional application cleanup. */
  close(): Promise<void>;
}

/** Result of attempting to bind an oRPC router to a Desktop window. */
export type DesktopRpcWindowBinding =
  | BoundDesktopRpcWindowBinding
  | DisabledDesktopRpcWindowBinding;
