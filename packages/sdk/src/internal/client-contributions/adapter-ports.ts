/**
 * Private SDK client-contribution adapter responsibilities.
 *
 * @module
 */

import type {
  SdkClientProcedureDescriptor,
  SdkClientTransportDescriptor,
} from '../../ports/sdk-client-contribution.ts';
import type { ServiceClientContext } from '../../ports/service-client.ts';
import type { ResolvedCallTransportPolicy } from '../transport-policy.ts';

/** One package-owned logical call epoch before contribution preparation. */
export interface SdkClientLogicalCall<TContext extends object = object> {
  readonly context: Readonly<ServiceClientContext & TContext>;
  readonly procedurePath: readonly string[];
  readonly procedure: SdkClientProcedureDescriptor;
  readonly transportPolicy: ResolvedCallTransportPolicy;
  readonly transport: SdkClientTransportDescriptor;
  readonly input: unknown;
  readonly signal?: AbortSignal;
}

/** Canonical contributor-owned headers prepared for one logical call epoch. */
export interface PreparedOutboundHeaders {
  readonly values: Readonly<Record<string, string>>;
}

/** Immutable value passed from preparation to the transport policy. */
export interface PreparedSdkClientCall<TContext extends object = object> {
  readonly call: SdkClientLogicalCall<TContext>;
  readonly procedure: SdkClientProcedureDescriptor;
  readonly contributedHeaders: PreparedOutboundHeaders;
}

/** Prepare contributor output exactly once for one logical call epoch. */
export interface PreparedOutboundHeadersPort {
  prepare<TContext extends object>(
    call: SdkClientLogicalCall<TContext>,
  ): Promise<PreparedSdkClientCall<TContext>>;
}

/** Translate one upstream procedure node into NetScript-owned metadata. */
export interface ProcedureMetadataPort {
  describe(
    procedureNode: unknown,
    procedurePath: readonly string[],
  ): SdkClientProcedureDescriptor;
}

/** Dispatch an already prepared call without invoking contributors. */
export interface ClientTransportPolicyPort {
  dispatch<TOutput, TContext extends object>(
    call: PreparedSdkClientCall<TContext>,
  ): Promise<TOutput>;
}
