/**
 * Internal service credential contribution for NetScript service clients.
 *
 * @module
 */

import {
  deriveInternalCredential,
  type InstallationSecret,
  loadInstallationSecret,
} from '@netscript/service/auth';
import { defineSdkClientContribution } from './sdk-client-contribution.ts';
import type {
  SdkClientContextDeclaration,
  SdkClientContribution,
  SdkClientTransportDescriptor,
} from '../ports/sdk-client-contribution.ts';

const INTERNAL_CREDENTIAL_CONTRIBUTION_ID = '@netscript/sdk:internal-credential' as const;
const INTERNAL_CREDENTIAL_HEADER_KEYS = ['authorization'] as const;

/** Options for {@link createInternalCredentialSdkClientContribution}. */
export interface InternalCredentialSdkClientContributionOptions {
  /** Name of the target service; the credential is derived for it alone. */
  readonly service: string;
  /**
   * Installation secret handle. Defaults to loading, once, the file referenced by
   * `NETSCRIPT_INSTALLATION_SECRET_FILE`.
   */
  readonly secret?: InstallationSecret;
  /** Explicitly permit the credential over non-loopback cleartext HTTP. */
  readonly allowInsecureTransport?: boolean;
}

/** Direct-only contribution that owns the `authorization` header for internal service calls. */
export type InternalCredentialSdkClientContribution = SdkClientContribution<
  '@netscript/sdk:internal-credential',
  Record<never, never>,
  SdkClientContextDeclaration<Record<never, never>>,
  readonly ['authorization']
>;

/**
 * Create the contribution that sends this installation's internal service credential.
 *
 * Workers, sagas, and triggers use it to call internal procedures, and session-guarded services
 * that compose `createInternalCredentialAuthenticator`, under a service identity rather than an
 * app or user session. The installation secret is read from its file reference at most once and
 * the per-service bearer is derived once per contribution. Procedures declaring
 * `authentication: 'none'` receive no credential. The contribution is `direct-only`, so
 * credentialed responses never enter a shared query cache.
 *
 * @param options - Target service name, optional secret handle, and transport consent.
 * @returns A version-1 SDK contribution owning the `authorization` header.
 *
 * @example
 * ```ts
 * import { oc } from '@orpc/contract';
 * import {
 *   createInternalCredentialSdkClientContribution,
 *   createServiceClient,
 * } from '@netscript/sdk/client';
 * import { z } from 'zod';
 *
 * const contract = {
 *   reindex: oc.route({ method: 'POST' })
 *     .meta({ access: { audience: 'internal' } })
 *     .input(z.object({}))
 *     .output(z.object({ queued: z.number() })),
 * };
 *
 * const client = createServiceClient({
 *   contract,
 *   serviceName: 'catalog',
 *   contributions: [
 *     createInternalCredentialSdkClientContribution({ service: 'catalog' }),
 *   ] as const,
 * });
 * await client.reindex({});
 * ```
 */
export function createInternalCredentialSdkClientContribution(
  options: InternalCredentialSdkClientContributionOptions,
): InternalCredentialSdkClientContribution {
  let authorization: Promise<string> | undefined;

  const resolveAuthorization = (): Promise<string> => {
    authorization ??= (async () => {
      const secret = options.secret ?? await loadInstallationSecret();
      return `Bearer ${await deriveInternalCredential(secret, options.service)}`;
    })().catch((error: unknown) => {
      authorization = undefined;
      throw error;
    });
    return authorization;
  };

  return defineSdkClientContribution()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: INTERNAL_CREDENTIAL_CONTRIBUTION_ID,
    context: {},
    headerKeys: INTERNAL_CREDENTIAL_HEADER_KEYS,
    responseCache: { mode: 'direct-only' },
    async prepare({ procedure, transport }) {
      if (procedure.meta.access?.authentication === 'none') return {};
      if (!isPermittedTransport(transport, options.allowInsecureTransport === true)) {
        throw new Error(
          'Internal service credentials require secure transport, a loopback origin, or explicit insecure-transport consent.',
        );
      }
      return { headers: { authorization: await resolveAuthorization() } };
    },
  });
}

function isPermittedTransport(
  transport: SdkClientTransportDescriptor,
  allowInsecureTransport: boolean,
): boolean {
  return transport.secure || allowInsecureTransport || isLoopbackOrigin(transport.origin);
}

function isLoopbackOrigin(origin: URL): boolean {
  const hostname = origin.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' ||
    /^127(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(hostname);
}
