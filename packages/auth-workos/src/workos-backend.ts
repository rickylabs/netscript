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
  createWorkosAuthenticator,
  type WorkosAuthenticatorOptions,
  type WorkosSessionAuthenticationResult,
  type WorkosSessionAuthenticationSuccess,
} from './workos-authenticator.ts';
import type { JWTPayload } from 'jose';

/** Configured WorkOS connection or access-token provider exposed by the backend. */
export interface WorkosProviderOptions {
  /** Stable provider id used by backend-selection and sign-in orchestration. */
  readonly id: string;
  /** Human-readable provider name. */
  readonly displayName: string;
  /** Provider protocol or WorkOS connection kind. */
  readonly kind?: AuthProviderDescriptor['kind'];
  /** Capabilities supported by this configured WorkOS provider. */
  readonly capabilities?: AuthProviderDescriptor['capabilities'];
}

/** Options for creating a pure WorkOS auth backend. */
export interface WorkosBackendOptions extends WorkosAuthenticatorOptions {
  /** Configured WorkOS connections exposed through the provider registry. */
  readonly providers?: readonly WorkosProviderOptions[];
  /** Secret used to sign backend-owned opaque session tokens. Defaults to `cookiePassword`. */
  readonly sessionTokenSecret?: string;
}

/** Error thrown when a WorkOS backend operation is outside WorkOS' managed-session model. */
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

const DEFAULT_COOKIE_NAME = 'wos-session';
const WORKOS_BACKEND_NAME = 'workos';

/** Creates a pure WorkOS AuthBackendPort backed by AuthKit sealed sessions.
 *
 * @param options - WorkOS SDK client, cookie password, provider registry, and token behavior.
 * @returns An `AuthBackendPort` that exposes WorkOS authentication, provider, session, crypto, and
 * principal-mapping ports.
 *
 * @example
 * ```ts
 * const backend = createWorkosBackend({
 *   workos,
 *   cookiePassword,
 *   providers: [{ id: "workos", displayName: "WorkOS" }],
 * });
 * ```
 */
export function createWorkosBackend(options: WorkosBackendOptions): AuthBackendPort {
  const authenticator = createWorkosAuthenticator(options);
  const providers = normalizeWorkosProviders(options.providers);
  const tokenSecret = options.sessionTokenSecret ?? options.cookiePassword;

  return {
    name: WORKOS_BACKEND_NAME,
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
        const token = lookup.token ??
          lookup.request?.cookie(options.cookie?.name ?? DEFAULT_COOKIE_NAME);
        if (!token) {
          return undefined;
        }
        const result = await authenticateSealedSessionToken(token, options);
        if (!result.authenticated) {
          return undefined;
        }
        return authSessionFromWorkos(result);
      },
      createSession(input: AuthSessionCreateInput): AuthSession {
        throw unsupportedWorkosOperation(
          'sessions.createSession',
          `WorkOS AuthKit creates sessions through hosted sign-in, not arbitrary userId "${input.userId}" records.`,
        );
      },
      refreshSession(sessionId: string): AuthSession {
        throw unsupportedWorkosOperation(
          'sessions.refreshSession',
          `WorkOS refresh requires the current sealed session cookie, not only session id "${sessionId}".`,
        );
      },
      revokeSession(sessionId: string): AuthSession {
        throw unsupportedWorkosOperation(
          'sessions.revokeSession',
          `WorkOS session revocation is owned by WorkOS APIs outside this request-local backend port for "${sessionId}".`,
        );
      },
    },
    crypto: {
      sealSessionToken(session: AuthSession): Promise<string> {
        return signSessionToken(session.id, tokenSecret);
      },
      openSessionToken(token: string): Promise<string> {
        return verifySessionToken(token, tokenSecret);
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

async function authenticateSealedSessionToken(
  sessionData: string,
  options: WorkosAuthenticatorOptions,
): Promise<WorkosSessionAuthenticationResult> {
  const session = options.workos.userManagement.loadSealedSession({
    sessionData,
    cookiePassword: options.cookiePassword,
  });
  return await session.authenticate();
}

function normalizeWorkosProviders(
  providers: readonly WorkosProviderOptions[] | undefined,
): readonly AuthProviderDescriptor[] {
  if (!providers || providers.length === 0) {
    return [{
      id: 'workos',
      displayName: 'WorkOS',
      kind: 'oidc',
      capabilities: ['signin', 'callback', 'refresh', 'signout', 'session'],
    }];
  }
  return providers.map((provider) => ({
    id: provider.id,
    displayName: provider.displayName,
    kind: provider.kind ?? 'oidc',
    capabilities: provider.capabilities ?? ['signin', 'callback', 'refresh', 'signout', 'session'],
  }));
}

function authSessionFromWorkos(session: WorkosSessionAuthenticationSuccess): AuthSession {
  const payload = decodeJwtPayload(session.accessToken);
  const issuedAt = dateFromSecondsClaim(payload.iat) ?? new Date(0).toISOString();
  const expiresAt = dateFromSecondsClaim(payload.exp) ?? new Date(8640000000000000).toISOString();

  return {
    id: session.sessionId,
    userId: session.user.id,
    providerId: 'workos',
    state: 'active',
    subject: session.user.id,
    scopes: [...(session.permissions ?? [])],
    roles: collectRoles(session),
    claims: {
      organizationId: session.organizationId,
      authenticationMethod: session.authenticationMethod,
      entitlements: session.entitlements ?? [],
      featureFlags: session.featureFlags ?? [],
      impersonator: session.impersonator,
      workosUser: session.user,
      accessTokenClaims: payload,
    },
    issuedAt,
    expiresAt,
  };
}

function collectRoles(session: WorkosSessionAuthenticationSuccess): readonly string[] {
  const roles = new Set<string>();
  if (session.role) {
    roles.add(session.role);
  }
  for (const role of session.roles ?? []) {
    roles.add(role);
  }
  return [...roles];
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

function unsupportedWorkosOperation(
  operation: string,
  reason: string,
): AuthBackendOperationUnsupportedError {
  return new AuthBackendOperationUnsupportedError(WORKOS_BACKEND_NAME, operation, reason);
}

async function signSessionToken(sessionId: string, secret: string): Promise<string> {
  const payload = `${sessionId}.${crypto.randomUUID()}`;
  const signature = await hmac(payload, secret);
  return `${base64UrlEncode(payload)}.${signature}`;
}

async function verifySessionToken(token: string, secret: string): Promise<string> {
  const [encodedPayload, signature, extra] = token.split('.');
  if (!encodedPayload || !signature || extra !== undefined) {
    throw new Error('Invalid WorkOS backend session token.');
  }
  const payload = base64UrlDecode(encodedPayload);
  const expected = await hmac(payload, secret);
  if (signature !== expected) {
    throw new Error('Invalid WorkOS backend session token signature.');
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

function decodeJwtPayload(token: string | undefined): JWTPayload {
  if (!token) {
    return {};
  }
  const [, payload] = token.split('.');
  if (!payload) {
    return {};
  }
  try {
    return JSON.parse(base64UrlDecode(payload)) as JWTPayload;
  } catch {
    return {};
  }
}

function dateFromSecondsClaim(value: unknown): string | undefined {
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : undefined;
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
