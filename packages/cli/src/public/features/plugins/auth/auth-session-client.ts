import type { AuthSessionHttpPort, AuthSessionProjection } from './auth-types.ts';

/** Fetch-backed auth session projection and revocation adapter. */
export class FetchAuthSessionHttp implements AuthSessionHttpPort {
  constructor(private readonly request: typeof fetch = fetch) {}

  async list(streamUrl: string): Promise<readonly AuthSessionProjection[]> {
    const response = await this.request(streamUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Auth session stream returned HTTP ${response.status}.`);
    return parseSessionProjection(await response.json());
  }

  async revoke(authUrl: string, sessionId: string): Promise<string> {
    const response = await this.request(`${authUrl.replace(/\/$/, '')}/signout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) throw new Error(`Auth signout returned HTTP ${response.status}.`);
    const value = await response.json() as { sessionId?: unknown; signedOut?: unknown };
    if (value.signedOut !== true) throw new Error('Auth signout did not confirm revocation.');
    return typeof value.sessionId === 'string' ? value.sessionId : sessionId;
  }
}

/** Normalize supported durable-stream JSON projection envelopes. */
export function parseSessionProjection(value: unknown): readonly AuthSessionProjection[] {
  const rows = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.authSession)
    ? value.authSession
    : isRecord(value) && isRecord(value.collections) && Array.isArray(value.collections.authSession)
    ? value.collections.authSession
    : undefined;
  if (!rows) throw new Error('Auth session stream did not return a JSON session projection.');
  return rows.filter(isAuthSessionProjection);
}

function isAuthSessionProjection(value: unknown): value is AuthSessionProjection {
  return isRecord(value) && typeof value.id === 'string' &&
    (value.state === 'active' || value.state === 'expired' || value.state === 'revoked');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

