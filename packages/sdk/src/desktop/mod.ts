/**
 * Type-safe oRPC transport for Deno Desktop window bindings.
 *
 * The SDK adapts one promise-based `bindings.<name>()` function into real
 * MessagePort endpoints. oRPC's default string/binary serializer then carries
 * the same contract used by NetScript services across the window boundary,
 * including `Uint8Array`, without a hand-maintained `bindings.d.ts`.
 *
 * @example Create a typed client inside the webview
 * ```ts
 * import { createDesktopServiceClient } from '@netscript/sdk/desktop';
 * import { ordersContract } from './contracts/orders.ts';
 *
 * const orders = createDesktopServiceClient({ contract: ordersContract });
 * const order = await orders.get({ id: 'order-42' });
 *
 * console.log(order);
 * ```
 *
 * @module
 */

export {
  createDesktopBindClientPort,
  createDesktopBindServerPort,
  DesktopBindingProtocolError,
  DesktopBindingUnavailableError,
  normalizeDesktopBindingError,
  resolveDesktopBindingInvoke,
} from './adapters/bind-channel.ts';
export {
  DESKTOP_RPC_JSON_SERIALIZERS,
  DESKTOP_UINT8_ARRAY_SERIALIZER,
  DESKTOP_UINT8_ARRAY_SERIALIZER_TYPE,
} from './adapters/orpc-serialization.ts';
export {
  createDesktopRpcLink,
  createDesktopServiceClient,
} from './application/desktop-rpc-client.ts';
export {
  DEFAULT_DESKTOP_RPC_BINDING,
  DESKTOP_BIND_ERROR_NAMES,
  DESKTOP_BIND_OPERATIONS,
  DESKTOP_BIND_RESULT_STATUSES,
  DESKTOP_PORT_CLOSE_REASONS,
} from './domain/constants.ts';
export type {
  CreateDesktopBindClientPortOptions,
  CreateDesktopRpcLinkOptions,
  CreateDesktopServiceClientOptions,
  DesktopBindAcceptedResult,
  DesktopBindClientPort,
  DesktopBindClosedResult,
  DesktopBindHandlerResult,
  DesktopBindingErrorShape,
  DesktopBindingHandler,
  DesktopBindingInvoke,
  DesktopBindOperation,
  DesktopBindResultStatus,
  DesktopBindServerPort,
  DesktopPortClosedResult,
  DesktopPortCloseReason,
  DesktopPortCloseResult,
  DesktopPortTransportErrorResult,
  DesktopRpcFrame,
  DesktopRpcJsonSerializer,
  DesktopRpcLink,
  DesktopRpcLinkCallOptions,
  DesktopServiceClient,
} from './domain/types.ts';
export type {
  ContractLike,
  ContractProcedureLike,
  ContractProcedureMetadata,
  ContractSchema,
  ContractSchemaInput,
  ContractSchemaOutput,
  NetScriptProcedureSchemas,
  ProcedureInputFromNode,
  ProcedureOutputFromNode,
  ServiceClient,
  ServiceClientContext,
  ServiceClientContract,
  ServiceClientMethod,
  ServiceClientShape,
  ServiceRequestOptions,
} from '../ports/service-client.ts';
