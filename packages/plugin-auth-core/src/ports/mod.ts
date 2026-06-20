import type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthSession,
  AuthSessionPrincipalMapping,
} from '../domain/mod.ts';
export { AUTH_SESSION_STATES } from '../domain/mod.ts';

export type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthSession,
  AuthSessionPrincipalMapping,
  AuthSessionState,
  Principal,
} from '../domain/mod.ts';

/** Default backend registry key used when no explicit backend name is requested. */
export const DEFAULT_AUTH_BACKEND_NAME = 'default';

/** Session query accepted by backend adapters. */
export type AuthSessionLookup = Readonly<{
  sessionId?: string;
  token?: string;
  request?: AuthnRequest;
}>;

/** Session creation input accepted by backend adapters. */
export type AuthSessionCreateInput = Readonly<{
  userId: string;
  accountId?: string;
  providerId?: string;
  subject: string;
  scopes?: readonly string[];
  roles?: readonly string[];
  claims?: Readonly<Record<string, unknown>>;
  expiresAt: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Provider descriptor exposed by backend adapters. */
export type AuthProviderDescriptor = Readonly<{
  id: string;
  displayName: string;
  kind: 'oauth' | 'oidc' | 'saml' | 'credentials' | 'custom';
  capabilities: readonly AuthProviderCapability[];
}>;

/** Capability advertised by an auth provider. */
export type AuthProviderCapability =
  | 'signin'
  | 'callback'
  | 'refresh'
  | 'signout'
  | 'session';

/** Provider registry contract exposed by pure auth backends. */
export interface AuthProviderRegistryPort {
  /** Lists provider descriptors known to the backend. */
  listProviders(): readonly AuthProviderDescriptor[] | Promise<readonly AuthProviderDescriptor[]>;
  /** Finds a provider descriptor by configured provider id. */
  getProvider(providerId: string):
    | AuthProviderDescriptor
    | undefined
    | Promise<AuthProviderDescriptor | undefined>;
}

/** Session store contract exposed by pure auth backends. */
export interface AuthSessionStorePort {
  /** Reads a session by id, token, or request-derived credential. */
  getSession(lookup: AuthSessionLookup): Promise<AuthSession | undefined> | AuthSession | undefined;
  /** Creates a normalized session record. */
  createSession(input: AuthSessionCreateInput): Promise<AuthSession> | AuthSession;
  /** Refreshes a session and returns the updated normalized session. */
  refreshSession(sessionId: string): Promise<AuthSession> | AuthSession;
  /** Revokes a session and returns the revoked normalized session. */
  revokeSession(sessionId: string): Promise<AuthSession> | AuthSession;
}

/** Crypto contract exposed by pure auth backends for token lifecycle work. */
export interface AuthSessionCryptoPort {
  /** Seals an opaque session token for transport or persistence. */
  sealSessionToken(session: AuthSession): Promise<string> | string;
  /** Opens an opaque session token and returns the session id it represents. */
  openSessionToken(token: string): Promise<string> | string;
}

/** Error thrown when a backend operation is outside an adapter's upstream capability boundary.
 *
 * @example
 * ```ts
 * throw new AuthBackendOperationUnsupportedError(
 *   "workos",
 *   "sessions.createSession",
 *   "WorkOS owns hosted sign-in session creation.",
 * );
 * ```
 */
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

const HMAC_SESSION_TOKEN_ERROR_MESSAGE = 'Invalid auth backend session token.';

/** Creates WebCrypto-backed HMAC session-token operations for backend-owned opaque tokens.
 *
 * @param secret - Backend-owned secret key material used for HMAC signing and verification.
 * @returns An `AuthSessionCryptoPort` that signs session ids and verifies signatures through
 * WebCrypto.
 *
 * @example
 * ```ts
 * const cryptoPort = createHmacSessionTokenCrypto(
 *   Deno.env.get("AUTH_SESSION_TOKEN_SECRET")!,
 * );
 * const token = await cryptoPort.sealSessionToken(session);
 * const sessionId = await cryptoPort.openSessionToken(token);
 * ```
 */
export function createHmacSessionTokenCrypto(secret: string): AuthSessionCryptoPort {
  return {
    async sealSessionToken(session: AuthSession): Promise<string> {
      const payload = encodeBase64Url(textEncoder.encode(session.id));
      const signature = await signHmac(payload, secret);
      return `${payload}.${encodeBase64Url(signature)}`;
    },
    async openSessionToken(token: string): Promise<string> {
      const [payload, encodedSignature, extra] = token.split('.');
      if (!payload || !encodedSignature || extra !== undefined) {
        throw new Error(HMAC_SESSION_TOKEN_ERROR_MESSAGE);
      }

      const signature = decodeBase64Url(encodedSignature);
      const valid = await verifyHmac(payload, signature, secret);
      if (!valid) {
        throw new Error(HMAC_SESSION_TOKEN_ERROR_MESSAGE);
      }
      return textDecoder.decode(decodeBase64Url(payload));
    },
  };
}

/** Principal mapping contract shared by all auth backends. */
export interface AuthPrincipalMapperPort {
  /** Maps a normalized session into a NetScript service principal. */
  mapSessionToPrincipal(session: AuthSession): AuthSessionPrincipalMapping;
}

/** Pure backend contract implemented by concrete auth backend adapters. */
export interface AuthBackendPort extends AuthenticatorPort {
  /** Stable backend name used in configuration and backend selection. */
  readonly name: string;
  /** Provider registry access owned by the backend adapter. */
  readonly providers: AuthProviderRegistryPort;
  /** Session store operations owned by the backend adapter. */
  readonly sessions: AuthSessionStorePort;
  /** Token crypto operations owned by the backend adapter. */
  readonly crypto: AuthSessionCryptoPort;
  /** Session-to-principal mapper owned by the backend adapter. */
  readonly principalMapper: AuthPrincipalMapperPort;
  /** Authenticates a service request through the backend. */
  authenticate(request: AuthnRequest): Promise<AuthnResult> | AuthnResult;
}

/** Error thrown when a requested backend is not present in a registry. */
export class AuthBackendNotFoundError extends Error {
  /** Requested backend name. */
  readonly backendName: string;

  /** Available backend names in the registry. */
  readonly availableBackends: readonly string[];

  /** Creates a missing-backend error. */
  constructor(backendName: string, availableBackends: readonly string[]) {
    super(`Auth backend "${backendName}" is not registered.`);
    this.name = 'AuthBackendNotFoundError';
    this.backendName = backendName;
    this.availableBackends = availableBackends;
  }
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function signHmac(value: string, secret: string): Promise<Uint8Array> {
  const key = await importHmacKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encodeText(value));
  return new Uint8Array(signature);
}

async function verifyHmac(
  value: string,
  signature: Uint8Array<ArrayBuffer>,
  secret: string,
): Promise<boolean> {
  const key = await importHmacKey(secret, ['verify']);
  return await crypto.subtle.verify('HMAC', key, signature, encodeText(value));
}

function importHmacKey(secret: string, usages: readonly KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encodeText(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

function encodeText(value: string): Uint8Array<ArrayBuffer> {
  const encoded = textEncoder.encode(value);
  const buffer = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(buffer).set(encoded);
  return new Uint8Array(buffer);
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  );
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Backend-selection registry used by app composition roots. */
export type AuthBackendRegistry = Map<string, AuthBackendPort>;

/** Resolved single-active backend selection for one app composition root. */
export type ResolvedAuthBackendRegistry = Readonly<{
  backends: AuthBackendRegistry;
  default: AuthBackendPort;
  defaultName: string;
  resolveBackend(name?: string): AuthBackendPort;
}>;

/** Resolves a backend from a registry, defaulting to the single active backend. */
export function resolveBackend(
  backends: ReadonlyMap<string, AuthBackendPort>,
  name: string = DEFAULT_AUTH_BACKEND_NAME,
): AuthBackendPort {
  const backend = backends.get(name);
  if (backend === undefined) {
    throw new AuthBackendNotFoundError(name, [...backends.keys()]);
  }
  return backend;
}

/** Creates a pure auth backend registry with one resolved default backend accessor. */
export function createAuthBackendRegistry(
  backends: ReadonlyMap<string, AuthBackendPort>,
  defaultName: string = DEFAULT_AUTH_BACKEND_NAME,
): ResolvedAuthBackendRegistry {
  const registry: AuthBackendRegistry = new Map(backends);
  const defaultBackend = resolveBackend(registry, defaultName);
  return {
    backends: registry,
    default: defaultBackend,
    defaultName,
    resolveBackend(name?: string): AuthBackendPort {
      return resolveBackend(registry, name ?? defaultName);
    },
  };
}
