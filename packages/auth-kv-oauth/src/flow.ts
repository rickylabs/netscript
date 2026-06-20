/**
 * OAuth/OIDC sign-in, callback, session-cookie, and sign-out flow primitives.
 *
 * @example
 * ```ts
 * import { createKvOAuthFlow } from "@netscript/auth-kv-oauth/flow";
 *
 * const flow = createKvOAuthFlow({ provider, store, allowInsecureRequests: true });
 * const response = await flow.signIn(new Request("https://app.example.test/auth/signin"));
 * ```
 *
 * @module
 */

import * as oauth from '@panva/oauth4webapi';
import type { Principal } from '@netscript/service/auth';
import { buildCookieHeader, clearCookieHeader, parseCookieHeader } from './cookies.ts';
import type { KvOAuthCookieOptions } from './cookies.ts';
import { KvOAuthError } from './errors.ts';
import { hasIssuerDiscovery, type OAuthProviderConfig } from './providers.ts';
import type { KvOAuthStore, KvOAuthTokenSet } from './store.ts';

export type { Principal } from '@netscript/service/auth';
export type { KvOAuthJsonValidator } from './crypto.ts';
export type {
  OAuthEndpointProviderConfig,
  OAuthIssuerProviderConfig,
  OAuthProviderBaseConfig,
  OAuthProviderClientAuthConfig,
  OAuthProviderConfig,
} from './providers.ts';
export type { KvOAuthCookieOptions } from './cookies.ts';
export type {
  KvOAuthCrypto,
  KvOAuthEncryptedTokens,
  KvOAuthSessionRecord,
  KvOAuthStore,
  KvOAuthTokenSet,
  KvOAuthTxn,
} from './store.ts';
export type { AuthSession } from '@netscript/plugin-auth-core';
export type { AuthSessionState } from '@netscript/plugin-auth-core';
export { AUTH_SESSION_STATES } from '@netscript/plugin-auth-core';

/** Fetch replacement compatible with oauth4webapi discovery requests. */
export type OAuthCustomFetch = NonNullable<oauth.DiscoveryRequestOptions[typeof oauth.customFetch]>;

/** Fetch replacement compatible with oauth4webapi token endpoint requests. */
export type OAuthTokenCustomFetch = NonNullable<
  oauth.TokenEndpointRequestOptions[typeof oauth.customFetch]
>;

/** Fetch replacement compatible with oauth4webapi discovery and token requests. */
export type KvOAuthFetch = OAuthCustomFetch & OAuthTokenCustomFetch;

/** Principal shape emitted by the KV OAuth backend after a successful callback. */
export type KvOAuthPrincipal = Principal & { readonly scheme: 'custom' };

/** Result returned after a successful OAuth callback. */
export type KvOAuthCallbackResult = Readonly<{
  response: Response;
  sessionId: string;
  principal: KvOAuthPrincipal;
}>;

/** Plain OAuth redirect dance primitives consumed by the future auth plugin HTTP surface. */
export interface KvOAuthFlow {
  /** Starts an OAuth authorization request and returns a redirect response. */
  signIn(request: Request, options?: { returnTo?: string }): Promise<Response>;
  /** Handles an OAuth callback, creates a session, and returns the redirect response. */
  handleCallback(request: Request): Promise<KvOAuthCallbackResult>;
  /** Reads the backend session id from the request cookie. */
  getSessionId(request: Request): Promise<string | undefined>;
  /** Deletes the backend session and returns a cookie-clearing redirect response. */
  signOut(request: Request, options?: { revoke?: boolean }): Promise<Response>;
}

/** Options for {@link createKvOAuthFlow}. */
export type CreateKvOAuthFlowOptions = Readonly<{
  provider: OAuthProviderConfig;
  store: KvOAuthStore;
  cookie?: KvOAuthCookieOptions;
  allowedReturnTo?: readonly string[] | ((url: URL) => boolean);
  defaultReturnTo?: string;
  allowInsecureRequests?: boolean;
  fetch?: KvOAuthFetch;
  normalizePrincipal?: (
    context: NormalizePrincipalContext,
  ) => KvOAuthPrincipal | Promise<KvOAuthPrincipal>;
}>;

/** Context passed to custom principal mappers. */
export type NormalizePrincipalContext = Readonly<{
  provider: OAuthProviderConfig;
  sessionId: string;
  tokenSet: KvOAuthTokenSet;
  claims: Readonly<Record<string, unknown>>;
}>;

/** Creates pure OAuth/OIDC flow primitives without mounting HTTP routes. */
export function createKvOAuthFlow(options: CreateKvOAuthFlowOptions): KvOAuthFlow {
  const cookieName = options.cookie?.name ?? '__Host-ns_session';
  const defaultReturnTo = options.defaultReturnTo ?? new URL(options.provider.redirectUri).origin;

  return {
    async signIn(request, signInOptions): Promise<Response> {
      assertHttps(request, options);
      const authorizationServer = await resolveAuthorizationServer(options);
      const codeVerifier = oauth.generateRandomCodeVerifier();
      const state = oauth.generateRandomState();
      const nonce = options.provider.kind === 'oidc' ? oauth.generateRandomNonce() : undefined;
      const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
      const returnTo = validateReturnTo(
        signInOptions?.returnTo ?? new URL(request.url).searchParams.get('returnTo') ??
          defaultReturnTo,
        options,
      );
      const txn = await options.store.putTxn({
        providerId: options.provider.id,
        state,
        nonce,
        codeVerifier,
        returnTo: returnTo.href,
        issuer: authorizationServer.issuer,
      });
      const url = new URL(
        requiredEndpoint(authorizationServer.authorization_endpoint, 'authorization'),
      );
      url.searchParams.set('client_id', options.provider.clientId);
      url.searchParams.set('redirect_uri', options.provider.redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', options.provider.scopes.join(' '));
      url.searchParams.set('state', state);
      url.searchParams.set('code_challenge', codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('txn', txn.id);
      if (nonce) {
        url.searchParams.set('nonce', nonce);
      }
      for (const [key, value] of Object.entries(options.provider.extraAuthParams)) {
        url.searchParams.set(key, value);
      }
      return redirect(url, buildCookieHeader(txn.id, request, options.cookie));
    },
    async handleCallback(request): Promise<KvOAuthCallbackResult> {
      assertHttps(request, options);
      const requestUrl = new URL(request.url);
      if (requestUrl.searchParams.has('error')) {
        throw new KvOAuthError(
          'token_exchange_failed',
          requestUrl.searchParams.get('error_description') ??
            requestUrl.searchParams.get('error') ??
            'OAuth provider returned an error.',
        );
      }
      const txnId = requestUrl.searchParams.get('txn') ??
        parseCookieHeader(request.headers.get('cookie') ?? undefined).get(cookieName);
      if (!txnId) {
        throw new KvOAuthError('oauth_cookie_missing', 'OAuth transaction cookie is missing.');
      }
      const txn = await options.store.takeTxn(txnId);
      if (!txn) {
        throw new KvOAuthError(
          'oauth_txn_not_found',
          'OAuth transaction was not found or already used.',
        );
      }
      const authorizationServer = await resolveAuthorizationServer(options);
      const client = oauthClient(options.provider);
      const callbackParameters = oauth.validateAuthResponse(
        authorizationServer,
        client,
        requestUrl,
        txn.state,
      );
      const response = await oauth.authorizationCodeGrantRequest(
        authorizationServer,
        client,
        clientAuth(options.provider),
        callbackParameters,
        options.provider.redirectUri,
        txn.codeVerifier,
        requestOptions(options),
      );
      const tokenResponse = await oauth.processAuthorizationCodeResponse(
        authorizationServer,
        client,
        response,
        {
          expectedNonce: txn.nonce,
          requireIdToken: options.provider.kind === 'oidc',
        },
      );
      const claims = oauth.getValidatedIdTokenClaims(tokenResponse) ?? {};
      const tokenSet = toTokenSet(tokenResponse, claims);
      const sessionId = `sess_${crypto.randomUUID().replaceAll('-', '')}`;
      const principal = await (options.normalizePrincipal ?? defaultPrincipal)({
        provider: options.provider,
        sessionId,
        tokenSet,
        claims,
      });
      const now = new Date();
      await options.store.putSession({
        session: {
          id: sessionId,
          userId: principal.subject,
          providerId: options.provider.id,
          state: 'active',
          subject: principal.subject,
          scopes: principal.scopes,
          roles: principal.roles,
          claims: { ...principal.claims, providerId: options.provider.id },
          issuedAt: now.toISOString(),
          expiresAt: tokenSet.expiresAt ?? new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        },
        tokens: tokenSet,
      });
      return {
        response: redirect(
          new URL(txn.returnTo),
          buildCookieHeader(sessionId, request, options.cookie),
        ),
        sessionId,
        principal,
      };
    },
    getSessionId(request): Promise<string | undefined> {
      return Promise.resolve(
        parseCookieHeader(request.headers.get('cookie') ?? undefined).get(cookieName),
      );
    },
    async signOut(request): Promise<Response> {
      const sessionId = await this.getSessionId(request);
      if (sessionId) {
        await options.store.deleteSession(sessionId);
      }
      return redirect(new URL(defaultReturnTo), clearCookieHeader(request, options.cookie));
    },
  };
}

function toTokenSet(
  response: oauth.TokenEndpointResponse,
  claims: Readonly<Record<string, unknown>>,
): KvOAuthTokenSet {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    idToken: response.id_token,
    tokenType: response.token_type,
    scope: response.scope,
    expiresAt: response.expires_in === undefined
      ? undefined
      : new Date(Date.now() + response.expires_in * 1000).toISOString(),
    claims,
  };
}

async function resolveAuthorizationServer(
  options: CreateKvOAuthFlowOptions,
): Promise<oauth.AuthorizationServer> {
  const provider = options.provider;
  if (hasIssuerDiscovery(provider)) {
    const issuer = new URL(provider.issuer);
    const response = await oauth.discoveryRequest(issuer, discoveryRequestOptions(options));
    const discovered = await oauth.processDiscoveryResponse(issuer, response);
    return {
      ...discovered,
      authorization_endpoint: provider.authorizationEndpoint ?? discovered.authorization_endpoint,
      token_endpoint: provider.tokenEndpoint ?? discovered.token_endpoint,
      userinfo_endpoint: provider.userInfoEndpoint ?? discovered.userinfo_endpoint,
    };
  }
  return {
    issuer: new URL(provider.authorizationEndpoint).origin,
    authorization_endpoint: provider.authorizationEndpoint,
    token_endpoint: provider.tokenEndpoint,
    userinfo_endpoint: provider.userInfoEndpoint,
  };
}

function oauthClient(provider: OAuthProviderConfig): oauth.Client {
  return {
    client_id: provider.clientId,
    token_endpoint_auth_method: provider.clientAuthMethod,
  };
}

/** Builds oauth4webapi client authentication for a provider. */
export function clientAuth(provider: OAuthProviderConfig): oauth.ClientAuth {
  if (provider.clientAuthMethod === 'none') {
    return oauth.None();
  }
  if (provider.clientAuthMethod === 'client_secret_post') {
    return oauth.ClientSecretPost(provider.clientSecret);
  }
  return oauth.ClientSecretBasic(provider.clientSecret);
}

/** Builds oauth4webapi token request options. */
export function requestOptions(
  options: Pick<CreateKvOAuthFlowOptions, 'allowInsecureRequests' | 'fetch'>,
): oauth.TokenEndpointRequestOptions {
  return {
    [oauth.allowInsecureRequests]: options.allowInsecureRequests === true,
    [oauth.customFetch]: options.fetch,
  };
}

/** Builds oauth4webapi discovery request options. */
export function discoveryRequestOptions(
  options: Pick<CreateKvOAuthFlowOptions, 'allowInsecureRequests' | 'fetch'>,
): oauth.DiscoveryRequestOptions {
  return {
    [oauth.allowInsecureRequests]: options.allowInsecureRequests === true,
    [oauth.customFetch]: options.fetch,
  };
}

function validateReturnTo(value: string, options: CreateKvOAuthFlowOptions): URL {
  const redirectUri = new URL(options.provider.redirectUri);
  const url = new URL(value, redirectUri.origin);
  const allowed = options.allowedReturnTo;
  const isAllowed = allowed === undefined
    ? url.origin === redirectUri.origin
    : typeof allowed === 'function'
    ? allowed(url)
    : allowed.some((entry) => url.href.startsWith(entry));
  if (!isAllowed) {
    throw new KvOAuthError('return_to_not_allowed', `Return URL ${url.href} is not allowed.`);
  }
  return url;
}

function assertHttps(request: Request, options: CreateKvOAuthFlowOptions): void {
  if (!options.allowInsecureRequests && new URL(request.url).protocol !== 'https:') {
    throw new KvOAuthError(
      'https_required',
      'OAuth flow requires HTTPS unless allowInsecureRequests is enabled for tests.',
    );
  }
}

function redirect(url: URL, setCookie: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: url.href,
      'set-cookie': setCookie,
    },
  });
}

function defaultPrincipal(
  context: NormalizePrincipalContext,
): KvOAuthPrincipal {
  const subject = typeof context.claims.sub === 'string' ? context.claims.sub : context.sessionId;
  const scopes = context.tokenSet.scope?.split(/\s+/).filter(Boolean) ?? context.provider.scopes;
  return {
    subject,
    scopes,
    roles: ['user'],
    scheme: 'custom',
    claims: {
      ...context.claims,
      sessionId: context.sessionId,
      providerId: context.provider.id,
    },
  };
}

function requiredEndpoint(value: string | undefined, endpoint: string): string {
  if (value === undefined) {
    throw new KvOAuthError(
      'configuration_error',
      `OAuth provider did not resolve an ${endpoint} endpoint.`,
    );
  }
  return value;
}
