import type {
  AuthBackendPort,
  AuthProviderDescriptor,
  AuthSession,
  AuthSessionCreateInput,
  AuthSessionLookup,
  AuthSessionPrincipalMapping,
} from '@netscript/plugin-auth-core';
import {
  AuthBackendOperationUnsupportedError,
  createHmacSessionTokenCrypto,
} from '@netscript/plugin-auth-core';
import type { AuthnRequest, AuthnResult } from '@netscript/service/auth';
import {
  type BetterAuthAuthenticatorOptions,
  type BetterAuthSessionPayload,
  createBetterAuthAuthenticator,
  principalFromBetterAuthSession,
  unwrapSessionResponse,
} from './better-auth.ts';

export { AuthBackendOperationUnsupportedError } from '@netscript/plugin-auth-core';

/** Configured better-auth provider exposed by the backend registry. */
export interface BetterAuthProviderOptions {
  /** Stable provider id from the better-auth social provider configuration. */
  readonly id: string;
  /** Human-readable provider name. */
  readonly displayName: string;
  /** Provider kind. Defaults to OAuth because better-auth social providers are OAuth/OIDC backed. */
  readonly kind?: AuthProviderDescriptor['kind'];
  /** Capabilities supported by this configured provider. */
  readonly capabilities?: AuthProviderDescriptor['capabilities'];
}

/** Options for creating a pure better-auth backend. */
export interface BetterAuthBackendOptions extends BetterAuthAuthenticatorOptions {
  /** Configured better-auth social providers exposed through the provider registry. */
  readonly providers?: readonly BetterAuthProviderOptions[];
  /** Secret used to sign backend-owned opaque session tokens. */
  readonly sessionTokenSecret: string;
}

const BETTER_AUTH_BACKEND_NAME = 'better-auth';

/** Creates a pure better-auth AuthBackendPort backed by `auth.api.getSession`.
 *
 * @param options - better-auth server instance, provider registry, and backend token secret.
 * @returns An `AuthBackendPort` that exposes better-auth authentication, provider, session, crypto,
 * and principal-mapping ports.
 *
 * @example
 * ```ts
 * const backend = createBetterAuthBackend({
 *   auth,
 *   sessionTokenSecret: Deno.env.get("BETTER_AUTH_SECRET")!,
 *   providers: [{ id: "github", displayName: "GitHub" }],
 * });
 * ```
 */
export function createBetterAuthBackend(options: BetterAuthBackendOptions): AuthBackendPort {
  const authenticator = createBetterAuthAuthenticator(options);
  const providers = normalizeBetterAuthProviders(options.providers);
  const sessionCrypto = createHmacSessionTokenCrypto(options.sessionTokenSecret);

  return {
    name: BETTER_AUTH_BACKEND_NAME,
    providers: {
      listProviders(): readonly AuthProviderDescriptor[] {
        return providers;
      },
      getProvider(providerId: string): AuthProviderDescriptor | undefined {
        return providers.find((provider) => provider.id === providerId);
      },
    },
    sessions: {
      async getSession(lookup: AuthSessionLookup): Promise<AuthSession | undefined> {
        const headers = headersFromSessionLookup(lookup);
        if (!headers) {
          return undefined;
        }
        const resolved = await options.auth.api.getSession({ headers, returnHeaders: true });
        const { session } = unwrapSessionResponse(resolved);
        return session ? authSessionFromBetterAuth(session) : undefined;
      },
      createSession(input: AuthSessionCreateInput): AuthSession {
        throw unsupportedBetterAuthOperation(
          'sessions.createSession',
          `better-auth creates sessions through its sign-in APIs, not arbitrary userId "${input.userId}" records.`,
        );
      },
      refreshSession(sessionId: string): AuthSession {
        throw unsupportedBetterAuthOperation(
          'sessions.refreshSession',
          `better-auth refresh is request-cookie driven through getSession, not session id "${sessionId}".`,
        );
      },
      revokeSession(sessionId: string): AuthSession {
        throw unsupportedBetterAuthOperation(
          'sessions.revokeSession',
          `better-auth revocation is exposed through its request API surface, not this backend session id "${sessionId}" port.`,
        );
      },
    },
    crypto: {
      async sealSessionToken(session: AuthSession): Promise<string> {
        return await sessionCrypto.sealSessionToken(session);
      },
      async openSessionToken(token: string): Promise<string> {
        return await sessionCrypto.openSessionToken(token);
      },
    },
    principalMapper: {
      mapSessionToPrincipal(session: AuthSession): AuthSessionPrincipalMapping {
        return mapAuthSessionToPrincipal(session);
      },
    },
    authenticate(request: AuthnRequest): Promise<AuthnResult> | AuthnResult {
      return authenticator.authenticate(request);
    },
  };
}

function normalizeBetterAuthProviders(
  providers: readonly BetterAuthProviderOptions[] | undefined,
): readonly AuthProviderDescriptor[] {
  if (!providers || providers.length === 0) {
    return [{
      id: 'better-auth',
      displayName: 'better-auth',
      kind: 'credentials',
      capabilities: ['signin', 'callback', 'refresh', 'signout', 'session'],
    }];
  }
  return providers.map((provider) => ({
    id: provider.id,
    displayName: provider.displayName,
    kind: provider.kind ?? 'oauth',
    capabilities: provider.capabilities ?? ['signin', 'callback', 'refresh', 'signout', 'session'],
  }));
}

function headersFromSessionLookup(lookup: AuthSessionLookup): Headers | undefined {
  if (lookup.request) {
    return lookup.request.headers();
  }
  if (lookup.token) {
    return new Headers({ cookie: `better-auth.session_token=${lookup.token}` });
  }
  return undefined;
}

function authSessionFromBetterAuth(payload: BetterAuthSessionPayload): AuthSession {
  const principal = principalFromBetterAuthSession(payload);
  return {
    id: payload.session.id,
    userId: payload.session.userId ?? payload.user.id,
    providerId: stringValue(payload.session.providerId) ?? 'better-auth',
    state: 'active',
    subject: payload.user.id,
    scopes: principal.scopes,
    roles: principal.roles,
    claims: principal.claims,
    issuedAt: dateValue(payload.session.createdAt) ?? new Date(0).toISOString(),
    expiresAt: dateValue(payload.session.expiresAt) ?? new Date(8640000000000000).toISOString(),
  };
}

function mapAuthSessionToPrincipal(session: AuthSession): AuthSessionPrincipalMapping {
  return {
    session,
    principal: {
      subject: session.subject,
      scopes: session.scopes,
      roles: session.roles,
      scheme: 'custom',
      claims: session.claims,
    },
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function dateValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return value instanceof Date ? value.toISOString() : undefined;
}

function unsupportedBetterAuthOperation(
  operation: string,
  reason: string,
): AuthBackendOperationUnsupportedError {
  return new AuthBackendOperationUnsupportedError(BETTER_AUTH_BACKEND_NAME, operation, reason);
}
