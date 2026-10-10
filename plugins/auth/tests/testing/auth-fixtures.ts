/** Shared fixtures for auth plugin tests. */

export const AUTH_TEST_ORIGIN = 'https://app.example.test' as const;

/** Build an absolute auth test URL for service handler tests. */
export function authTestUrl(path: string): string {
  return new URL(path, AUTH_TEST_ORIGIN).toString();
}

/** Userinfo endpoint served by {@link syntheticProviderFetch}. */
export const AUTH_TEST_USERINFO_ENDPOINT = 'https://issuer.example.test/oauth/userinfo' as const;

/** Stable provider user id returned by {@link syntheticProviderFetch}'s userinfo response. */
export const AUTH_TEST_PROVIDER_USER_ID = 4242 as const;

/** Environment that derives the kv-oauth subject from the synthetic userinfo `id`. */
export const AUTH_TEST_USERINFO_SUBJECT_ENV: Readonly<Record<string, string>> = {
  NETSCRIPT_AUTH_USERINFO_ENDPOINT: AUTH_TEST_USERINFO_ENDPOINT,
  NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
  NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
};

/**
 * Synthetic non-OIDC provider: the userinfo endpoint answers with a stable numeric `id`, every
 * other request is a token-endpoint response carrying `scope`.
 */
export function syntheticProviderFetch(
  scope: () => string = () => 'profile email',
): typeof fetch {
  return (input) =>
    Promise.resolve(
      (input instanceof Request ? input.url : String(input)) === AUTH_TEST_USERINFO_ENDPOINT
        ? Response.json({ id: AUTH_TEST_PROVIDER_USER_ID, login: 'synthetic' })
        : Response.json({
          access_token: 'access_test',
          refresh_token: 'refresh_test',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: scope(),
        }),
    );
}
