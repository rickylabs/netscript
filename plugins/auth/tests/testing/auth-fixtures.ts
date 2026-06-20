/** Shared fixtures for auth plugin tests. */

export const AUTH_TEST_ORIGIN = 'https://app.example.test' as const;

/** Build an absolute auth test URL for service handler tests. */
export function authTestUrl(path: string): string {
  return new URL(path, AUTH_TEST_ORIGIN).toString();
}
