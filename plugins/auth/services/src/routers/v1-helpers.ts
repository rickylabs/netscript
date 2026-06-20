import type { AuthnRequest, AuthSession } from '@netscript/plugin-auth-core/domain';
import type {
  AuthSessionResponse,
  AuthUserResponse,
} from '@netscript/plugin-auth-core/contracts/v1';
import { AuthServiceHandlerError, type AuthServiceRequest } from './v1-types.ts';

/** Convert a backend session into the public contract response shape. */
export function mapSession(session: AuthSession): AuthSessionResponse {
  return {
    id: session.id,
    userId: session.userId,
    providerId: session.providerId,
    state: session.state,
    subject: session.subject,
    scopes: Object.freeze([...session.scopes]),
    roles: Object.freeze([...session.roles]),
    claims: Object.freeze({ ...session.claims }),
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    refreshedAt: session.refreshedAt,
    revokedAt: session.revokedAt,
  };
}

/** Convert a backend principal into the public `me` response user shape. */
export function mapUserFromSession(session: AuthSession): AuthUserResponse {
  const claims = session.claims;
  return {
    id: session.userId,
    displayName: stringClaim(claims.displayName ?? claims.name),
    email: stringClaim(claims.email),
    emailVerified: booleanClaim(claims.emailVerified ?? claims.email_verified),
    imageUrl: stringClaim(claims.imageUrl ?? claims.picture),
    claims,
  };
}

/** Build a Web Request for backend interactive-flow primitives. */
export function toRequest(
  serviceRequest: AuthServiceRequest | undefined,
  path: string,
  params: URLSearchParams,
): Request {
  const base = serviceRequest?.url ?? `https://app.example.test${path}`;
  const url = new URL(base);
  url.pathname = path;
  for (const [key, value] of params) {
    url.searchParams.set(key, value);
  }
  return new Request(url, {
    method: serviceRequest?.method ?? 'GET',
    headers: serviceRequest?.headers ?? new Headers({ 'x-forwarded-proto': 'https' }),
  });
}

/** Build an AuthnRequest for backend authenticate/session ports. */
export function toAuthnRequest(
  serviceRequest: AuthServiceRequest | undefined,
  sessionId?: string,
): AuthnRequest {
  const headers = new Headers(serviceRequest?.headers ?? {});
  if (sessionId && !headers.has('cookie')) {
    headers.set('cookie', `__Host-ns_session=${encodeURIComponent(sessionId)}`);
  }
  return {
    method: serviceRequest?.method ?? 'GET',
    path: serviceRequest ? new URL(serviceRequest.url).pathname : '/v1/auth/session',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => new Headers(headers),
    cookie: (name) => readCookie(headers.get('cookie') ?? undefined, name),
  };
}

/** Extract a redirect location from a backend flow response. */
export function responseLocation(response: Response): string | undefined {
  return response.headers.get('location') ?? undefined;
}

/** Convert unsupported backend operations into a contract-level provider failure. */
export function unsupportedOperation(backendName: string, operation: string): never {
  throw new AuthServiceHandlerError(
    'AUTH_PROVIDER_ERROR',
    `${backendName} does not expose an interactive ${operation} flow through its AS2 backend port.`,
    { providerId: backendName },
  );
}

/** Normalize unknown backend errors into contract-level provider failures. */
export function providerFailure(error: unknown, providerId?: string): AuthServiceHandlerError {
  if (error instanceof AuthServiceHandlerError) {
    return error;
  }
  const reason = error instanceof Error ? error.message : 'Auth backend operation failed.';
  return new AuthServiceHandlerError('AUTH_PROVIDER_ERROR', reason, { providerId });
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function booleanClaim(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return undefined;
}
