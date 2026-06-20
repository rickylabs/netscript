import type {
  AuthBackendPort,
  AuthProviderDescriptor,
  AuthSession,
  AuthSessionCreateInput,
  AuthSessionLookup,
  AuthSessionPrincipalMapping,
} from '@netscript/plugin-auth-core';
import type { AuthnRequest, AuthnResult } from '@netscript/service/auth';
import {
  type BetterAuthAuthenticatorOptions,
  type BetterAuthInstance,
  type BetterAuthSessionPayload,
  createBetterAuthAuthenticator,
  principalFromBetterAuthSession,
  unwrapSessionResponse,
} from './better-auth.ts';

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

/** Error thrown when a better-auth backend operation is outside better-auth's request API. */
export class AuthBackendOperationUnsupportedError extends Error {
  /** Backend that rejected the operation. */
  readonly backendName: string;
  /** Port operation that is not supported. */
  readonly operation: string;
  /** Short explanation of the upstream capability boundary. */
  readonly reason: string;

  /** Creates an unsupported-operation error. */
  constructor(backendName: string, operation: string, reason: string) {
    super(`${backendName} does not support ${operation}: ${reason}`);
    this.name = 'AuthBackendOperationUnsupportedError';
    this.backendName = backendName;
    this.operation = operation;
    this.reason = reason;
  }
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
      sealSessionToken(session: AuthSession): Promise<string> {
        return signSessionToken(session.id, options.sessionTokenSecret);
      },
      openSessionToken(token: string): Promise<string> {
        return verifySessionToken(token, options.sessionTokenSecret);
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
      claims: {
        ...session.claims,
        sessionId: session.id,
        userId: session.userId,
        providerId: session.providerId,
      },
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

async function signSessionToken(sessionId: string, secret: string): Promise<string> {
  const payload = `${sessionId}.${crypto.randomUUID()}`;
  const signature = await hmac(payload, secret);
  return `${base64UrlEncode(payload)}.${signature}`;
}

async function verifySessionToken(token: string, secret: string): Promise<string> {
  const [encodedPayload, signature, extra] = token.split('.');
  if (!encodedPayload || !signature || extra !== undefined) {
    throw new Error('Invalid better-auth backend session token.');
  }
  const payload = base64UrlDecode(encodedPayload);
  const expected = await hmac(payload, secret);
  if (signature !== expected) {
    throw new Error('Invalid better-auth backend session token signature.');
  }
  return payload.split('.', 1)[0] ?? '';
}

async function hmac(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(value: string): string {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  );
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

type BetterAuthSessionLookupResult = Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>;

export type { BetterAuthSessionLookupResult };
