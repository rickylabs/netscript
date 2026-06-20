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
