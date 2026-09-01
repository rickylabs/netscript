import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/message-port';
import { createDesktopBindClientPort } from '../adapters/bind-channel.ts';
import { DESKTOP_RPC_JSON_SERIALIZERS } from '../adapters/orpc-serialization.ts';
import { SdkClientContributionError } from '../../client/errors.ts';
import type {
  CreateDesktopRpcLinkOptions,
  CreateDesktopServiceClientOptions,
  DesktopRpcLink,
  DesktopServiceClient,
} from '../domain/types.ts';
import type { ContractLike, ServiceClientContext } from '../../ports/service-client.ts';

/** Create oRPC's MessagePort link over a Deno Desktop bind-channel client port. */
export function createDesktopRpcLink(
  options: CreateDesktopRpcLinkOptions = {},
): DesktopRpcLink {
  const clientPort = createDesktopBindClientPort(options);
  return new RPCLink<ServiceClientContext>({
    port: clientPort.port,
    customJsonSerializers: DESKTOP_RPC_JSON_SERIALIZERS,
  });
}

/** Create a typed service client that calls an existing contract over Deno Desktop bindings. */
export function createDesktopServiceClient<TContract extends ContractLike>(
  options: CreateDesktopServiceClientOptions<TContract>,
): DesktopServiceClient<TContract> {
  if (Object.prototype.hasOwnProperty.call(options, 'contributions')) {
    throw new SdkClientContributionError({
      code: 'SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED',
      phase: 'construction',
    });
  }
  const link = createDesktopRpcLink({
    bindingName: options.bindingName,
    invoke: options.invoke,
  });
  return createORPCClient<DesktopServiceClient<TContract>>(link);
}
