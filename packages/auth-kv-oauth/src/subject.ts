/**
 * Stable principal-subject resolution for the KV OAuth callback.
 *
 * The provider's {@link OAuthSubjectSource} decides where the subject comes from: a validated
 * ID-token claim, or a field of the provider's userinfo response namespaced by provider id
 * (`github:<id>`). A configured source that yields no identifier refuses the sign-in with
 * `subject_missing` instead of falling back to the per-sign-in session id.
 *
 * @example
 * ```ts
 * import { resolvePrincipalSubject } from "@netscript/auth-kv-oauth/subject";
 * import { providers } from "@netscript/auth-kv-oauth/providers";
 *
 * const subject = await resolvePrincipalSubject({
 *   provider: providers.github({
 *     clientId: "client_test",
 *     clientSecret: "secret_test",
 *     redirectUri: "https://app.example.test/auth/callback",
 *   }),
 *   sessionId: "sess_test",
 *   tokenSet: { accessToken: "access_test" },
 *   claims: {},
 *   fetch: () => Promise.resolve(Response.json({ id: 42, login: "octocat" })),
 * });
 * // subject === "github:42"
 * ```
 *
 * @module
 */

import * as oauth from '@panva/oauth4webapi';
import { KvOAuthError } from './errors.ts';
import type { OAuthProviderConfig, OAuthSubjectSource } from './providers.ts';
import type { KvOAuthTokenSet } from './store.ts';

export type {
  OAuthEndpointProviderConfig,
  OAuthIssuerProviderConfig,
  OAuthProviderBaseConfig,
  OAuthProviderClientAuthConfig,
  OAuthProviderConfig,
  OAuthSubjectSource,
} from './providers.ts';
export type { KvOAuthTokenSet } from './store.ts';

/** Fetch replacement compatible with oauth4webapi userinfo requests. */
export type KvOAuthUserInfoFetch = NonNullable<
  oauth.UserInfoRequestOptions[typeof oauth.customFetch]
>;

/** Input accepted by {@link resolvePrincipalSubject}; a `NormalizePrincipalContext` satisfies it. */
export type PrincipalSubjectContext = Readonly<{
  provider: OAuthProviderConfig;
  sessionId: string;
  tokenSet: Pick<KvOAuthTokenSet, 'accessToken'>;
  claims: Readonly<Record<string, unknown>>;
  /** Fetch used for the userinfo request. Defaults to the global `fetch`. */
  fetch?: KvOAuthUserInfoFetch;
  /** Permits a non-HTTPS userinfo endpoint (tests and local stubs only). */
  allowInsecureRequests?: boolean;
}>;

const MAX_USERINFO_BYTES = 64 * 1024;

/**
 * Resolves the principal subject for a completed callback.
 *
 * Without a configured `provider.subject`, the ID-token `sub` is used and the per-sign-in session
 * id is the fallback. That fallback is unstable across sign-ins and only suits local stubs.
 */
export async function resolvePrincipalSubject(context: PrincipalSubjectContext): Promise<string> {
  const source = context.provider.subject;
  if (source === undefined) {
    return typeof context.claims.sub === 'string' ? context.claims.sub : context.sessionId;
  }
  if (source.source === 'id_token') {
    return requireSubject(context.claims[source.claim], context.provider, source);
  }
  const userInfo = await requestUserInfo(context, source);
  const value = requireSubject(readPath(userInfo, source.claim), context.provider, source);
  return `${context.provider.id}:${value}`;
}

async function requestUserInfo(
  context: PrincipalSubjectContext,
  source: Extract<OAuthSubjectSource, { source: 'userinfo' }>,
): Promise<unknown> {
  const endpoint = context.provider.userInfoEndpoint;
  if (endpoint === undefined) {
    throw new KvOAuthError(
      'configuration_error',
      `Provider ${context.provider.id} reads its subject from userinfo but has no userInfoEndpoint.`,
    );
  }
  let response: Response;
  try {
    response = await oauth.userInfoRequest(
      { issuer: new URL(endpoint).origin, userinfo_endpoint: endpoint },
      { client_id: context.provider.clientId },
      context.tokenSet.accessToken,
      {
        headers: { ...source.headers },
        [oauth.customFetch]: context.fetch,
        [oauth.allowInsecureRequests]: context.allowInsecureRequests === true,
      },
    );
  } catch (cause) {
    throw new KvOAuthError(
      'userinfo_failed',
      `Userinfo request to provider ${context.provider.id} failed.`,
      { cause },
    );
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new KvOAuthError(
      'userinfo_failed',
      `Userinfo request to provider ${context.provider.id} returned HTTP ${response.status}.`,
    );
  }
  return await readJsonBounded(response, context.provider.id);
}

async function readJsonBounded(response: Response, providerId: string): Promise<unknown> {
  const tooLarge = () =>
    new KvOAuthError(
      'userinfo_failed',
      `Userinfo response from provider ${providerId} exceeds ${MAX_USERINFO_BYTES} bytes.`,
    );
  if (Number(response.headers.get('content-length') ?? 0) > MAX_USERINFO_BYTES) {
    await response.body?.cancel();
    throw tooLarge();
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (response.body) {
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > MAX_USERINFO_BYTES) {
        throw tooLarge();
      }
      chunks.push(chunk);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (cause) {
    throw new KvOAuthError(
      'userinfo_failed',
      `Userinfo response from provider ${providerId} is not JSON.`,
      { cause },
    );
  }
}

function readPath(value: unknown, path: string): unknown {
  let current = value;
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null || !Object.hasOwn(current, segment)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function requireSubject(
  value: unknown,
  provider: OAuthProviderConfig,
  source: OAuthSubjectSource,
): string {
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return String(value);
  }
  throw new KvOAuthError(
    'subject_missing',
    `Provider ${provider.id} returned no stable subject in ${source.source} field "${source.claim}"; sign-in refused.`,
  );
}
