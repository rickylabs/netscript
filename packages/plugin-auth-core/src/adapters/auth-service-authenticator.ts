import { ORPCError } from '@orpc/contract';
import { createServiceClient, safe } from '@netscript/sdk/client';
import type { AuthenticatorPort } from '@netscript/service/auth';
import { AUTH_SESSION_STATES, authContract, SessionResponseSchema } from '../contracts/v1/mod.ts';
import { createBearerSdkClientContribution } from '../sdk/mod.ts';
import { readBearerCredential } from './bearer-credential.ts';

/** Caller-owned discovery and verification policy for the remote auth service. */
export interface AuthServiceAuthenticatorOptions {
  /** Aspire discovery name of the auth service. */
  readonly serviceName: string;
  /** Positive integer timeout in milliseconds, at most 2,147,483,647. */
  readonly timeoutMs: number;
  /** Contract router namespace; defaults to auth. */
  readonly routerName?: string;
  /** Discovery protocol; follows the SDK default when omitted. */
  readonly protocol?: 'http' | 'https';
  /** Explicitly allow bearer credentials over non-loopback cleartext transport. */
  readonly allowInsecureTransport?: boolean;
}

/** Stable credential-denial reasons, distinct from verifier unavailability. */
export const REMOTE_SESSION_REJECTIONS: Readonly<{
  bearerMissing: 'remote_session_bearer_missing';
  unauthorized: 'remote_session_unauthorized';
  notActive: 'remote_session_not_active';
  expired: 'remote_session_expired';
}> = {
  bearerMissing: 'remote_session_bearer_missing',
  unauthorized: 'remote_session_unauthorized',
  notActive: 'remote_session_not_active',
  expired: 'remote_session_expired',
};

/** Safe verifier diagnostics; raw transport errors and response bodies are discarded. */
export class RemoteSessionVerificationError extends Error {
  /** Bounded failure classification. Discovery errors share transport's classification. */
  readonly code: 'transport' | 'timeout' | 'malformed_response' | 'remote_error';
  /** Contract procedure being verified. */
  readonly procedurePath: 'session' = 'session';

  /** Construct a redacted failure with no raw cause. */
  constructor(code: RemoteSessionVerificationError['code']) {
    super('Remote session verification unavailable');
    this.name = 'RemoteSessionVerificationError';
    this.code = code;
  }

  /** Serialize only stable, credential-free diagnostic fields. */
  toJSON(): { code: RemoteSessionVerificationError['code']; procedurePath: 'session' } {
    return { code: this.code, procedurePath: this.procedurePath };
  }
}

/**
 * Verify each bearer request through the native auth service, without retaining a principal.
 *
 * A denied session returns a rejection; verifier failure throws for the native service's
 * redacted 503 handling. No backend handle, provider credential, cookie or response cache is used.
 *
 * @param options Explicit discovery and timeout policy.
 * @returns The native service authentication port.
 * @example
 * ```ts
 * const authenticator = createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: 10_000 });
 * // Pass authenticator to createService(...).withAuthn({ authenticator }).
 * ```
 */
export function createAuthServiceAuthenticator(
  options: AuthServiceAuthenticatorOptions,
): AuthenticatorPort {
  if (typeof options.serviceName !== 'string' || !options.serviceName.trim()) {
    throw new TypeError('serviceName must be a non-empty string');
  }
  if (
    !Number.isInteger(options.timeoutMs) || options.timeoutMs < 1 ||
    options.timeoutMs > 2_147_483_647
  ) {
    throw new TypeError('timeoutMs must be an integer from 1 through 2147483647');
  }
  const timeoutMs = options.timeoutMs;
  const bearer = createBearerSdkClientContribution<{ accessToken: string }>({
    context: { accessToken: 'required' },
    resolveCredential: ({ context }) => context.accessToken,
    responseCache: { mode: 'direct-only' },
    allowInsecureTransport: options.allowInsecureTransport,
  });
  const client = createServiceClient({
    contract: authContract,
    serviceName: options.serviceName,
    routerName: options.routerName ?? 'auth',
    protocol: options.protocol,
    contributions: [bearer] as const,
  });
  return {
    async authenticate(request) {
      const accessToken = readBearerCredential(request);
      if (!accessToken) return { ok: false, reason: REMOTE_SESSION_REJECTIONS.bearerMissing };
      const signal = AbortSignal.timeout(timeoutMs);
      const result = await safe(client.session(undefined, { context: { accessToken, signal } }));
      if (!result.isSuccess) {
        const error = result.error;
        const remote = error instanceof ORPCError && error.defined;
        if (remote && error.code === 'UNAUTHORIZED') {
          return { ok: false, reason: REMOTE_SESSION_REJECTIONS.unauthorized };
        }
        throw new RemoteSessionVerificationError(
          signal.aborted ? 'timeout' : remote ? 'remote_error' : 'transport',
        );
      }
      const parsed = SessionResponseSchema.safeParse(result.data);
      if (!parsed.success) throw new RemoteSessionVerificationError('malformed_response');
      const session = parsed.data.session;
      if (!parsed.data.authenticated || !session || session.state !== AUTH_SESSION_STATES.active) {
        return { ok: false, reason: REMOTE_SESSION_REJECTIONS.notActive };
      }
      if (Date.parse(session.expiresAt) <= Date.now()) {
        return { ok: false, reason: REMOTE_SESSION_REJECTIONS.expired };
      }
      return {
        ok: true,
        principal: {
          subject: session.subject,
          scopes: session.scopes,
          roles: session.roles,
          claims: session.claims,
          scheme: 'bearer',
        },
      };
    },
  };
}
