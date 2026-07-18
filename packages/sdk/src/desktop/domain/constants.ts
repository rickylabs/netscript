/** Default Deno Desktop binding name used by the SDK RPC bridge. */
export const DEFAULT_DESKTOP_RPC_BINDING = '__netscript_rpc__';

/** Operations carried over the promise-based Deno Desktop binding. */
export const DESKTOP_BIND_OPERATIONS = {
  /** Deliver one client-to-runtime RPC frame. */
  SEND: 'send',
  /** Wait for one runtime-to-client RPC frame. */
  RECEIVE: 'receive',
  /** Close this window's bridge. */
  CLOSE: 'close',
} as const;

/** Successful binding-handler result statuses. */
export const DESKTOP_BIND_RESULT_STATUSES = {
  /** A client frame was accepted by the runtime port. */
  ACCEPTED: 'accepted',
  /** The per-window bridge is closed. */
  CLOSED: 'closed',
} as const;

/** Reasons reported when a client-side bind port closes. */
export const DESKTOP_PORT_CLOSE_REASONS = {
  /** The local or remote endpoint closed normally. */
  CLOSED: 'closed',
  /** A native binding invocation or protocol validation failed. */
  TRANSPORT_ERROR: 'transport-error',
} as const;

/** Stable error names emitted by the SDK bind adapter. */
export const DESKTOP_BIND_ERROR_NAMES = {
  /** The requested webview binding is unavailable. */
  UNAVAILABLE: 'DesktopBindingUnavailableError',
  /** A binding call violated the SDK wire protocol. */
  PROTOCOL: 'DesktopBindingProtocolError',
} as const;
