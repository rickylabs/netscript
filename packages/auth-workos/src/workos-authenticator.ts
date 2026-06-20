import type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  Principal,
} from '@netscript/service/auth';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

/** Controls whether the authenticator refreshes the WorkOS sealed session after verification. */
export type WorkosRefreshMode = 'never' | 'always';

/** Cookie attributes used when a refreshed WorkOS sealed session is emitted. */
export interface WorkosCookieOptions {
  /** Cookie name that carries the WorkOS sealed session. */
  readonly name?: string;
  /** Cookie path attribute. */
  readonly path?: string;
  /** Cookie domain attribute. */
  readonly domain?: string;
  /** Max-Age attribute in seconds. */
  readonly maxAge?: number;
  /** SameSite attribute. */
  readonly sameSite?: 'Strict' | 'Lax' | 'None';
  /** Whether to include the Secure attribute. */
  readonly secure?: boolean;
  /** Whether to include the HttpOnly attribute. */
  readonly httpOnly?: boolean;
}

/** Minimal WorkOS SDK surface consumed by the sealed-session authenticator. */
export interface WorkosSessionClient {
  /** WorkOS User Management client. */
  readonly userManagement: {
    /** Loads a sealed session from a WorkOS AuthKit cookie. */
    loadSealedSession(options: {
      readonly sessionData: string;
      readonly cookiePassword: string;
    }): WorkosCookieSession;
  };
}

/** Minimal WorkOS sealed-session surface consumed by the authenticator. */
export interface WorkosCookieSession {
  /** Authenticates the current sealed session. */
  authenticate(): Promise<WorkosSessionAuthenticationResult>;
  /** Refreshes the session and returns a rotated sealed session when WorkOS issues one. */
  refresh(options?: {
    readonly cookiePassword?: string;
    readonly organizationId?: string;
  }): Promise<WorkosSessionRefreshResult>;
}

/** Successful WorkOS sealed-session authentication result. */
export interface WorkosSessionAuthenticationSuccess {
  readonly authenticated: true;
  readonly accessToken: string;
  readonly authenticationMethod?: string;
  readonly sessionId: string;
  readonly organizationId?: string;
  readonly role?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly entitlements?: readonly string[];
  readonly featureFlags?: readonly string[];
  readonly user: { readonly id: string; readonly [key: string]: unknown };
  readonly impersonator?: unknown;
}

/** Failed WorkOS sealed-session authentication result. */
export interface WorkosSessionAuthenticationFailure {
  readonly authenticated: false;
  readonly reason: string;
}

/** WorkOS sealed-session authentication result. */
export type WorkosSessionAuthenticationResult =
  | WorkosSessionAuthenticationSuccess
  | WorkosSessionAuthenticationFailure;

/** Successful WorkOS sealed-session refresh result. */
export type WorkosSessionRefreshSuccess =
  & Omit<WorkosSessionAuthenticationSuccess, 'accessToken'>
  & {
    readonly authenticated: true;
    readonly sealedSession?: string;
    readonly session?: unknown;
  };

/** WorkOS sealed-session refresh result. */
export type WorkosSessionRefreshResult =
  | WorkosSessionRefreshSuccess
  | WorkosSessionAuthenticationFailure;

/** Options for creating a WorkOS AuthKit sealed-session authenticator. */
export interface WorkosAuthenticatorOptions {
  /** Configured WorkOS SDK client. */
  readonly workos: WorkosSessionClient;
  /** Password used by WorkOS to unseal and reseal session cookie data. */
  readonly cookiePassword: string;
  /** Cookie attributes for reading and writing the WorkOS sealed session. */
  readonly cookie?: WorkosCookieOptions;
  /** Whether to refresh a valid session after authentication. Defaults to `never`. */
  readonly refresh?: WorkosRefreshMode;
}

/** Options for creating a WorkOS bearer access-token authenticator. */
export interface WorkosAccessTokenAuthenticatorOptions {
  /** WorkOS client ID used as the expected JWT audience and default JWKS URL suffix. */
  readonly clientId: string;
  /** WorkOS JWKS URL. Defaults to `https://api.workos.com/sso/jwks/<clientId>`. */
  readonly jwksUrl?: string | URL;
  /** Expected JWT issuer. Omit when a WorkOS environment uses a custom issuer. */
  readonly issuer?: string;
}

const DEFAULT_COOKIE_NAME = 'wos-session';

/** Creates a NetScript authenticator backed by WorkOS AuthKit sealed sessions.
 *
 * @param options - WorkOS SDK client, cookie password, and cookie behavior.
 * @returns An `AuthenticatorPort` that maps WorkOS sessions to NetScript principals.
 *
 * @example
 * ```ts
 * const authenticator = createWorkosAuthenticator({
 *   workos,
 *   cookiePassword,
 *   refresh: 'always',
 * });
 * ```
 */
export function createWorkosAuthenticator(
  options: WorkosAuthenticatorOptions,
): AuthenticatorPort {
  const cookieName = options.cookie?.name ?? DEFAULT_COOKIE_NAME;

  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      const sessionData = request.cookie(cookieName);
      if (!sessionData) {
        return { ok: false, reason: 'workos_session_cookie_missing' };
      }

      const session = options.workos.userManagement.loadSealedSession({
        sessionData,
        cookiePassword: options.cookiePassword,
      });

      let authenticated: WorkosSessionAuthenticationResult;
      try {
        authenticated = await session.authenticate();
      } catch (error) {
        return {
          ok: false,
          reason: normalizeProviderError(error, 'workos_authentication_failed'),
        };
      }

      if (!authenticated.authenticated) {
        return { ok: false, reason: `workos_${authenticated.reason}` };
      }

      if (options.refresh === 'always') {
        return await authenticateWithRefresh(session, authenticated, options);
      }

      return {
        ok: true,
        principal: principalFromWorkosSession(authenticated),
      };
    },
  };
}

/** Creates a NetScript authenticator backed by WorkOS bearer access tokens.
 *
 * @param options - WorkOS client ID, JWKS URL, and optional issuer constraint.
 * @returns An `AuthenticatorPort` that verifies bearer JWTs before mapping them.
 *
 * @example
 * ```ts
 * const authenticator = createWorkosAccessTokenAuthenticator({
 *   clientId: 'client_123',
 * });
 * ```
 */
export function createWorkosAccessTokenAuthenticator(
  options: WorkosAccessTokenAuthenticatorOptions,
): AuthenticatorPort {
  const jwks = createRemoteJWKSet(
    new URL(options.jwksUrl ?? `https://api.workos.com/sso/jwks/${options.clientId}`),
  );

  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      const token = bearerTokenFromRequest(request);
      if (!token) {
        return { ok: false, reason: 'workos_bearer_token_missing' };
      }

      let payload: JWTPayload;
      try {
        const verified = await jwtVerify(token, jwks, {
          audience: options.clientId,
          ...(options.issuer ? { issuer: options.issuer } : {}),
        });
        payload = verified.payload;
      } catch (error) {
        return {
          ok: false,
          reason: normalizeProviderError(error, 'workos_bearer_token_invalid'),
        };
      }

      try {
        return {
          ok: true,
          principal: principalFromAccessToken(payload),
        };
      } catch (error) {
        return {
          ok: false,
          reason: normalizeProviderError(error, 'workos_bearer_token_invalid'),
        };
      }
    },
  };
}

async function authenticateWithRefresh(
  session: WorkosCookieSession,
  authenticated: WorkosSessionAuthenticationSuccess,
  options: WorkosAuthenticatorOptions,
): Promise<AuthnResult> {
  let refreshed: WorkosSessionRefreshResult;
  try {
    refreshed = await session.refresh({
      cookiePassword: options.cookiePassword,
      organizationId: authenticated.organizationId,
    });
  } catch (error) {
    return {
      ok: false,
      reason: normalizeProviderError(error, 'workos_session_refresh_failed'),
    };
  }

  if (!refreshed.authenticated) {
    return { ok: false, reason: `workos_${refreshed.reason}` };
  }

  const setCookies = refreshed.sealedSession
    ? [serializeSessionCookie(refreshed.sealedSession, options.cookie)]
    : undefined;

  return {
    ok: true,
    principal: principalFromWorkosSession(refreshed),
    ...(setCookies ? { setCookies } : {}),
  };
}

function principalFromWorkosSession(
  session: WorkosSessionAuthenticationSuccess | WorkosSessionRefreshSuccess,
): Principal {
  return {
    subject: session.user.id,
    scopes: [...(session.permissions ?? [])],
    roles: collectRoles(session),
    scheme: 'custom',
    claims: {
      organizationId: session.organizationId,
      sessionId: session.sessionId,
      authenticationMethod: session.authenticationMethod,
      entitlements: session.entitlements ?? [],
      featureFlags: session.featureFlags ?? [],
      impersonator: session.impersonator,
      workosUser: session.user,
    },
  };
}

function collectRoles(
  session: WorkosSessionAuthenticationSuccess | WorkosSessionRefreshSuccess,
): readonly string[] {
  const roles = new Set<string>();
  if (session.role) {
    roles.add(session.role);
  }
  for (const role of session.roles ?? []) {
    roles.add(role);
  }
  return [...roles];
}

function principalFromAccessToken(payload: JWTPayload): Principal {
  const subject = stringClaim(payload.sub);
  if (!subject) {
    throw new Error('missing subject claim');
  }

  return {
    subject,
    scopes: stringArrayClaim(payload.permissions),
    roles: collectAccessTokenRoles(payload),
    scheme: 'custom',
    claims: {
      organizationId: stringClaim(payload.org_id),
      sessionId: stringClaim(payload.sid),
      ...payload,
    },
  };
}

function collectAccessTokenRoles(payload: JWTPayload): readonly string[] {
  const roles = new Set<string>();
  const role = stringClaim(payload.role);
  if (role) {
    roles.add(role);
  }
  for (const value of stringArrayClaim(payload.roles)) {
    roles.add(value);
  }
  return [...roles];
}

function bearerTokenFromRequest(request: AuthnRequest): string | undefined {
  const header = request.header('authorization') ?? request.header('Authorization');
  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }
  return token;
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function stringArrayClaim(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function serializeSessionCookie(
  value: string,
  options: WorkosCookieOptions | undefined,
): string {
  const name = options?.name ?? DEFAULT_COOKIE_NAME;
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options?.path ?? '/'}`,
    'HttpOnly',
    `SameSite=${options?.sameSite ?? 'Lax'}`,
  ];

  if (options?.domain) {
    attributes.push(`Domain=${options.domain}`);
  }
  if (typeof options?.maxAge === 'number') {
    attributes.push(`Max-Age=${options.maxAge}`);
  }
  if (options?.secure ?? true) {
    attributes.push('Secure');
  }
  if (options?.httpOnly === false) {
    return attributes.filter((attribute) => attribute !== 'HttpOnly').join('; ');
  }

  return attributes.join('; ');
}

function normalizeProviderError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return `${fallback}: ${error.message}`;
  }
  return fallback;
}
