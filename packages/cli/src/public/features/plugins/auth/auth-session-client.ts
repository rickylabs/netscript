import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';

import type {
  AuthSessionClientContext,
  AuthSessionHttpPort,
  AuthSessionProjection,
  AuthSessionRequestOptions,
} from './auth-types.ts';

const bearer = createBearerSdkClientContribution<AuthSessionClientContext>({
  context: { auth: 'optional' },
  resolveCredential: ({ context }) => context.auth?.getAccessToken(),
  responseCache: { mode: 'direct-only' },
  unmarked: 'optional',
});

/** Fetch-backed auth session projection and revocation adapter. */
export class FetchAuthSessionHttp implements AuthSessionHttpPort {
  constructor(private readonly request: typeof fetch = fetch) {}

  async list(
    streamUrl: string,
    options?: AuthSessionRequestOptions,
  ): Promise<readonly AuthSessionProjection[]> {
    const endpoint = new URL(streamUrl);
    const headers = await prepareHeaders(
      endpoint,
      ['session-projection', 'list'],
      undefined,
      options,
      { accept: 'application/json' },
    );
    const response = await this.request(endpoint, { headers });
    if (!response.ok) throw new Error(`Auth session stream returned HTTP ${response.status}.`);
    return parseSessionProjection(await response.json());
  }

  async revoke(
    authUrl: string,
    sessionId: string,
    options?: AuthSessionRequestOptions,
  ): Promise<string> {
    const input = { sessionId };
    const endpoint = new URL(`${authUrl.replace(/\/$/, '')}/signout`);
    const headers = await prepareHeaders(
      endpoint,
      ['signout'],
      input,
      options,
      { 'content-type': 'application/json' },
    );
    const response = await this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`Auth signout returned HTTP ${response.status}.`);
    const value = await response.json() as { sessionId?: unknown; signedOut?: unknown };
    if (value.signedOut !== true) throw new Error('Auth signout did not confirm revocation.');
    return typeof value.sessionId === 'string' ? value.sessionId : sessionId;
  }
}

async function prepareHeaders(
  endpoint: URL,
  path: readonly string[],
  input: unknown,
  options: AuthSessionRequestOptions | undefined,
  initialHeaders: HeadersInit,
): Promise<Headers> {
  const patch = await bearer.prepare({
    context: options?.context ?? {},
    procedure: { path, meta: {} },
    transport: {
      kind: 'http',
      origin: new URL(endpoint.origin),
      rpcPath: `${endpoint.pathname}${endpoint.search}`,
      secure: endpoint.protocol === 'https:',
    },
    input,
  });
  const headers = new Headers(initialHeaders);
  for (const [name, value] of Object.entries(patch.headers ?? {})) headers.set(name, value);
  return headers;
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
