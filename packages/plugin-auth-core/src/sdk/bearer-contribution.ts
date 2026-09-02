/**
 * Canonical bearer credential contribution for NetScript service clients.
 *
 * @module
 */

import type { NetScriptAuthenticationRequirement } from '@netscript/contracts';
import {
  defineSdkClientContribution,
  type SdkClientContextDeclaration,
  type SdkClientContribution,
  type SdkClientPrepareOptions,
  type SdkClientResponseCache,
} from '@netscript/sdk/client';

/** Options for {@link createBearerSdkClientContribution}. */
export interface CreateBearerSdkClientContributionOptions<TContext extends object> {
  /** Runtime declaration for the context fields used to resolve credentials. */
  readonly context: SdkClientContextDeclaration<TContext>;
  /** Resolve an opaque bearer credential for one logical call. */
  readonly resolveCredential: (
    options: SdkClientPrepareOptions<TContext>,
  ) => string | undefined | PromiseLike<string | undefined>;
  /** Caller-selected response-cache safety policy. */
  readonly responseCache: SdkClientResponseCache<TContext>;
  /** Authentication policy for procedures without an explicit access declaration. */
  readonly unmarked?: NetScriptAuthenticationRequirement;
  /** Explicitly permit credentials over non-local cleartext HTTP. */
  readonly allowInsecureTransport?: boolean;
}

function isIpv4Loopback(hostname: string): boolean {
  const parts = hostname.split('.');
  return parts.length === 4 && parts[0] === '127' && parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const value = Number(part);
    return value >= 0 && value <= 255;
  });
}

function isLocalDevelopmentOrigin(origin: URL): boolean {
  const hostname = origin.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' ||
    isIpv4Loopback(hostname);
}

/**
 * Create the canonical typed bearer contribution.
 *
 * The contribution resolves a credential only for optional or required
 * procedures, emits the fixed `Authorization: Bearer …` scheme, rejects
 * non-local cleartext transport unless explicitly allowed, and leaves cache
 * partitioning to the caller's non-secret declaration.
 *
 * @param options - Context, credential resolver, cache policy, and transport policy.
 * @returns A version-1 SDK contribution owning the `authorization` header.
 */
export function createBearerSdkClientContribution<
  TContext extends object = Record<never, never>,
>(
  options: CreateBearerSdkClientContributionOptions<TContext>,
): SdkClientContribution<
  '@netscript/plugin-auth:bearer',
  TContext,
  SdkClientContextDeclaration<TContext>,
  readonly ['authorization']
> {
  return defineSdkClientContribution<TContext>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: '@netscript/plugin-auth:bearer',
    context: options.context,
    headerKeys: ['authorization'],
    responseCache: options.responseCache,
    async prepare(prepareOptions) {
      const requirement = prepareOptions.procedure.meta.access?.authentication ??
        options.unmarked ?? 'none';
      if (requirement === 'none') return {};

      const credential = await options.resolveCredential(prepareOptions);
      if (credential === undefined || credential.length === 0) {
        if (requirement === 'required') {
          throw new Error('Required bearer credential is unavailable.');
        }
        return {};
      }

      if (
        !prepareOptions.transport.secure &&
        !isLocalDevelopmentOrigin(prepareOptions.transport.origin) &&
        options.allowInsecureTransport !== true
      ) {
        throw new Error(
          'Bearer credentials require secure transport or explicit insecure-transport consent.',
        );
      }

      return { headers: { authorization: `Bearer ${credential}` } };
    },
  });
}
