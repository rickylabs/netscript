import type {
  AuthBackendPort,
  AuthPrincipalMapperPort,
  AuthProviderRegistryPort,
  AuthSession,
  AuthSessionCreateInput,
  AuthSessionCryptoPort,
  AuthSessionLookup,
  AuthSessionStorePort,
} from '@netscript/plugin-auth-core';
import type { AuthnRequest, AuthnResult, Principal } from '@netscript/service/auth';
import * as oauth from '@panva/oauth4webapi';
import { buildCookieHeader } from './cookies.ts';
import type { KvOAuthCookieOptions } from './cookies.ts';
import type { CreateKvOAuthFlowOptions } from './flow.ts';
import { clientAuth, createKvOAuthFlow, discoveryRequestOptions, requestOptions } from './flow.ts';
import { describeProvider, type OAuthProviderConfig } from './providers.ts';
import { createKvOAuthStore, hashToken, type KvOAuthStore, type KvOAuthTokenSet } from './store.ts';

/** Refresh behavior for authenticate-on-read. */
export type KvOAuthRefreshMode = 'never' | 'always';

/** Options for creating the pure KV OAuth backend. */
export type CreateKvOAuthBackendOptions =
  & Omit<CreateKvOAuthFlowOptions, 'store'>
  & Readonly<{
    store?: KvOAuthStore;
    refreshMode?: KvOAuthRefreshMode;
    refreshSkewMs?: number;
  }>;

/** Creates a full `AuthBackendPort` backed by `@netscript/kv`. */
export async function createKvOAuthBackend(
  options: CreateKvOAuthBackendOptions,
): Promise<AuthBackendPort> {
  const store = options.store ?? await createKvOAuthStore();
  const provider = options.provider;
  const cookie = options.cookie;
  const flow = createKvOAuthFlow({ ...options, store });
  const sessions = createSessionStore(provider, store, cookie);
  const principalMapper = createPrincipalMapper();

  return {
    name: 'kv-oauth',
    providers: createProviderRegistry(provider),
    sessions,
    crypto: createSessionCrypto(store),
    principalMapper,
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      const sessionId = request.cookie(cookie?.name ?? '__Host-ns_session');
      if (!sessionId) {
        return { ok: false, reason: 'kv_oauth_session_missing' };
      }
      const record = await store.getSession(sessionId);
      if (!record || record.session.state !== 'active') {
        return { ok: false, reason: 'kv_oauth_session_not_found' };
      }
      const now = Date.now();
      if (Date.parse(record.session.expiresAt) <= now) {
        await store.deleteSession(sessionId);
        return { ok: false, reason: 'kv_oauth_session_expired' };
      }

      let session = record.session;
      let setCookies: readonly string[] | undefined;
      if (
        (options.refreshMode ?? 'always') === 'always' &&
        Date.parse(session.expiresAt) - now <= (options.refreshSkewMs ?? 5 * 60 * 1000)
      ) {
        const refreshed = await refreshRecord(provider, store, record, options);
        if (!refreshed) {
          return { ok: false, reason: 'kv_oauth_refresh_failed' };
        }
        session = refreshed.session;
        setCookies = [buildCookieHeader(session.id, request, cookie)];
      }

      const mapping = principalMapper.mapSessionToPrincipal(session);
      return { ok: true, principal: mapping.principal, setCookies };
    },
    signIn: flow.signIn,
    handleCallback: flow.handleCallback,
    getSessionId: flow.getSessionId,
    signOut: flow.signOut,
  } as AuthBackendPort & ReturnType<typeof createKvOAuthFlow>;
}

function createProviderRegistry(provider: OAuthProviderConfig): AuthProviderRegistryPort {
  const descriptor = describeProvider(provider);
  return {
    listProviders: () => [descriptor],
    getProvider: (providerId: string) => providerId === descriptor.id ? descriptor : undefined,
  };
}

function createSessionStore(
  provider: OAuthProviderConfig,
  store: KvOAuthStore,
  cookie?: KvOAuthCookieOptions,
): AuthSessionStorePort {
  return {
    async getSession(lookup: AuthSessionLookup): Promise<AuthSession | undefined> {
      const sessionId = lookup.sessionId ?? lookup.token ??
        lookup.request?.cookie(cookie?.name ?? '__Host-ns_session');
      if (!sessionId) {
        return undefined;
      }
      return (await store.getSession(sessionId))?.session;
    },
    async createSession(input: AuthSessionCreateInput): Promise<AuthSession> {
      const now = new Date().toISOString();
      const session: AuthSession = {
        id: `sess_${crypto.randomUUID().replaceAll('-', '')}`,
        userId: input.userId,
        accountId: input.accountId,
        providerId: input.providerId ?? provider.id,
        state: 'active',
        subject: input.subject,
        scopes: input.scopes ?? [],
        roles: input.roles ?? [],
        claims: input.claims ?? {},
        issuedAt: now,
        expiresAt: input.expiresAt,
        traceparent: input.traceparent,
        tracestate: input.tracestate,
      };
      await store.putSession({
        session,
        tokens: { accessToken: session.id, expiresAt: input.expiresAt },
      });
      return session;
    },
    async refreshSession(sessionId: string): Promise<AuthSession> {
      const record = await store.getSession(sessionId);
      if (!record) {
        throw new Error(`Session ${sessionId} was not found.`);
      }
      const refreshed: AuthSession = {
        ...record.session,
        refreshedAt: new Date().toISOString(),
      };
      const rotated = await store.rotateSession(sessionId, { ...record, session: refreshed });
      if (!rotated) {
        throw new Error(`Session ${sessionId} could not be refreshed due to a concurrent update.`);
      }
      return refreshed;
    },
    async revokeSession(sessionId: string): Promise<AuthSession> {
      const record = await store.getSession(sessionId);
      if (!record) {
        throw new Error(`Session ${sessionId} was not found.`);
      }
      const revoked: AuthSession = {
        ...record.session,
        state: 'revoked',
        revokedAt: new Date().toISOString(),
      };
      await store.rotateSession(sessionId, { ...record, session: revoked });
      return revoked;
    },
  };
}

function createSessionCrypto(store: KvOAuthStore): AuthSessionCryptoPort {
  return {
    sealSessionToken: async (session: AuthSession): Promise<string> =>
      await store.crypto.seal({ sessionId: session.id }),
    openSessionToken: async (token: string): Promise<string> =>
      (await store.crypto.open<{ sessionId: string }>(token)).sessionId,
  };
}

function createPrincipalMapper(): AuthPrincipalMapperPort {
  return {
    mapSessionToPrincipal(session: AuthSession) {
      const principal: Principal & { readonly scheme: 'custom' } = {
        subject: session.subject,
        scopes: session.scopes,
        roles: session.roles,
        scheme: 'custom',
        claims: { ...session.claims, sessionId: session.id, providerId: session.providerId },
      };
      return { session, principal };
    },
  };
}

async function refreshRecord(
  provider: OAuthProviderConfig,
  store: KvOAuthStore,
  record: NonNullable<Awaited<ReturnType<KvOAuthStore['getSession']>>>,
  options: Pick<CreateKvOAuthBackendOptions, 'allowInsecureRequests' | 'fetch'>,
): Promise<{ session: AuthSession } | undefined> {
  const tokenSet = await store.openTokens(record.tokens);
  if (!tokenSet.refreshToken) {
    return undefined;
  }
  const tokenHash = await hashToken(tokenSet.refreshToken);
  if (record.refreshTokenHash && record.refreshTokenHash !== tokenHash) {
    await store.deleteSession(record.session.id);
    return undefined;
  }
  try {
    const authorizationServer: oauth.AuthorizationServer = provider.issuer
      ? await oauth.processDiscoveryResponse(
        new URL(provider.issuer),
        await oauth.discoveryRequest(new URL(provider.issuer), discoveryRequestOptions(options)),
      )
      : {
        issuer: provider.issuer ?? new URL(provider.authorizationEndpoint!).origin,
        authorization_endpoint: provider.authorizationEndpoint,
        token_endpoint: provider.tokenEndpoint,
        userinfo_endpoint: provider.userInfoEndpoint,
      };
    const response = await oauth.refreshTokenGrantRequest(
      authorizationServer,
      { client_id: provider.clientId, token_endpoint_auth_method: provider.clientAuthMethod },
      clientAuth(provider),
      tokenSet.refreshToken,
      requestOptions(options),
    );
    const refreshed = await oauth.processRefreshTokenResponse(
      authorizationServer,
      { client_id: provider.clientId, token_endpoint_auth_method: provider.clientAuthMethod },
      response,
    );
    const nextTokens: KvOAuthTokenSet = {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? tokenSet.refreshToken,
      idToken: refreshed.id_token ?? tokenSet.idToken,
      tokenType: refreshed.token_type,
      scope: refreshed.scope ?? tokenSet.scope,
      expiresAt: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : tokenSet.expiresAt,
      claims: tokenSet.claims,
    };
    const session: AuthSession = {
      ...record.session,
      expiresAt: nextTokens.expiresAt ?? record.session.expiresAt,
      refreshedAt: new Date().toISOString(),
    };
    const next = {
      session,
      tokens: await store.sealTokens(nextTokens),
      refreshTokenHash: nextTokens.refreshToken
        ? await hashToken(nextTokens.refreshToken)
        : undefined,
    };
    return await store.rotateSession(record.session.id, next) ? { session } : undefined;
  } catch {
    return undefined;
  }
}
