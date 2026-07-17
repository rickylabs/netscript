import type {
  DESKTOP_BIND_OPERATIONS,
  DESKTOP_BIND_RESULT_STATUSES,
  DESKTOP_PORT_CLOSE_REASONS,
} from './constants.ts';
import type {
  ContractLike,
  ServiceClient,
  ServiceClientContext,
} from '../../ports/service-client.ts';

/** String or binary frame accepted by oRPC's default MessagePort serializer. */
export type DesktopRpcFrame = string | Uint8Array;

/** Package-owned shape for an oRPC custom JSON-value serializer. */
export interface DesktopRpcJsonSerializer {
  /** Serializer discriminator, unique within one RPC link/handler pair. */
  readonly type: number;
  /** Return whether this serializer owns a procedure value. */
  condition(data: unknown): boolean;
  /** Convert an owned value to JSON-compatible data. */
  serialize(data: unknown): unknown;
  /** Restore an owned value from JSON-compatible data. */
  deserialize(serialized: unknown): unknown;
}

/** Operation name accepted by the SDK bind-channel protocol. */
export type DesktopBindOperation =
  (typeof DESKTOP_BIND_OPERATIONS)[keyof typeof DESKTOP_BIND_OPERATIONS];

/** Successful result status returned by a native binding handler. */
export type DesktopBindResultStatus =
  (typeof DESKTOP_BIND_RESULT_STATUSES)[keyof typeof DESKTOP_BIND_RESULT_STATUSES];

/** Client-port close reason. */
export type DesktopPortCloseReason =
  (typeof DESKTOP_PORT_CLOSE_REASONS)[keyof typeof DESKTOP_PORT_CLOSE_REASONS];

/** Plain error shape produced when Deno Desktop crosses the webview realm. */
export interface DesktopBindingErrorShape {
  /** Runtime error class name. */
  readonly name: string;
  /** Runtime error message. */
  readonly message: string;
  /** Runtime stack, when supplied by the native binding bridge. */
  readonly stack?: string;
}

/** Promise function that invokes one named Deno Desktop webview binding. */
export type DesktopBindingInvoke = (
  operation: DesktopBindOperation,
  payload?: DesktopRpcFrame,
) => Promise<unknown>;

/** Handler registered with `win.bind()` for one per-window RPC bridge. */
export type DesktopBindingHandler = (
  operation: unknown,
  payload?: unknown,
) => Promise<DesktopBindHandlerResult>;

/** A delivered client frame was accepted. */
export interface DesktopBindAcceptedResult {
  /** Accepted result discriminator. */
  readonly status: typeof DESKTOP_BIND_RESULT_STATUSES.ACCEPTED;
}

/** The per-window channel has closed. */
export interface DesktopBindClosedResult {
  /** Closed result discriminator. */
  readonly status: typeof DESKTOP_BIND_RESULT_STATUSES.CLOSED;
}

/** Result returned by the runtime-side native binding handler. */
export type DesktopBindHandlerResult =
  | DesktopBindAcceptedResult
  | DesktopBindClosedResult
  | DesktopRpcFrame;

/** Normal client-port closure. */
export interface DesktopPortClosedResult {
  /** Normal closure discriminator. */
  readonly reason: typeof DESKTOP_PORT_CLOSE_REASONS.CLOSED;
}

/** Client-port closure caused by a native or protocol failure. */
export interface DesktopPortTransportErrorResult {
  /** Transport failure discriminator. */
  readonly reason: typeof DESKTOP_PORT_CLOSE_REASONS.TRANSPORT_ERROR;
  /** Rehydrated transport error. */
  readonly error: Error;
}

/** Terminal result for a client-side bind port. */
export type DesktopPortCloseResult = DesktopPortClosedResult | DesktopPortTransportErrorResult;

/** Options for creating the webview half of a Desktop bind port. */
export interface CreateDesktopBindClientPortOptions {
  /** Native binding name. Defaults to `DEFAULT_DESKTOP_RPC_BINDING`. */
  readonly bindingName?: string;
  /** Explicit binding invoke seam. Defaults to `globalThis.bindings[bindingName]`. */
  readonly invoke?: DesktopBindingInvoke;
}

/** Webview bind-port lifecycle and its real MessagePort endpoint. */
export interface DesktopBindClientPort {
  /** MessagePort passed directly to oRPC's `RPCLink`. */
  readonly port: MessagePort;
  /** Terminal lifecycle result, including a rehydrated native failure. */
  readonly closed: Promise<DesktopPortCloseResult>;
  /** Close the native bridge and local MessagePort exactly once. */
  close(): Promise<void>;
}

/** Runtime bind-port lifecycle owned by one native window. */
export interface DesktopBindServerPort {
  /** MessagePort passed directly to `RPCHandler.upgrade`. */
  readonly port: MessagePort;
  /** Promise handler registered with the native window's `bind` method. */
  readonly handler: DesktopBindingHandler;
  /** Close the port, pending receive, and native protocol exactly once. */
  close(): void;
}

/** Options for creating a Desktop oRPC MessagePort link. */
export interface CreateDesktopRpcLinkOptions extends CreateDesktopBindClientPortOptions {}

/** Options forwarded by an oRPC client for one Desktop link call. */
export interface DesktopRpcLinkCallOptions {
  /** Abort signal forwarded to the Desktop transport. */
  readonly signal?: AbortSignal;
  /** Event-stream cursor forwarded by oRPC, when present. */
  readonly lastEventId?: string;
  /** Existing NetScript service-client context. */
  readonly context: ServiceClientContext;
}

/** Package-owned structural surface returned by the Desktop oRPC link factory. */
export interface DesktopRpcLink {
  /** Invoke one RPC path over the Desktop binding transport. */
  call(
    path: readonly string[],
    input: unknown,
    options: DesktopRpcLinkCallOptions,
  ): Promise<unknown>;
}

/** Options for creating a typed Desktop service client. */
export interface CreateDesktopServiceClientOptions<TContract extends ContractLike>
  extends CreateDesktopBindClientPortOptions {
  /** Existing NetScript/oRPC contract used only for client type inference. */
  readonly contract: TContract;
}

/** Typed Desktop client derived from an existing NetScript service contract. */
export type DesktopServiceClient<TContract extends ContractLike> = ServiceClient<TContract>;
