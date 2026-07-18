/**
 * Desktop-gated oRPC binding for Fresh runtime composition roots.
 *
 * The adapter returns an explicit disabled lifecycle in browser and Aspire
 * processes, and owns one isolated SDK bind port per native window.
 *
 * @module
 */

export { bindDesktopRpcWindow } from './bind-desktop-rpc-window.ts';
export { DESKTOP_RPC_BINDING_STATUSES, DESKTOP_RPC_DISABLED_REASONS } from './constants.ts';
export type {
  BindDesktopRpcWindowOptions,
  BoundDesktopRpcWindowBinding,
  DesktopBindableWindow,
  DesktopRpcBindingStatus,
  DesktopRpcDisabledReason,
  DesktopRpcProcedure,
  DesktopRpcRouter,
  DesktopRpcWindowBinding,
  DesktopRuntimeCapability,
  DisabledDesktopRpcWindowBinding,
} from './types.ts';
