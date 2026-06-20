/**
 * Auth backend registry composition for the plugin service.
 *
 * @module
 */

import { createBetterAuthBackend, createNetscriptBetterAuth } from '@netscript/auth-better-auth';
import {
  createKvOAuthBackend,
  createKvOAuthStore,
  defineOAuthProvider,
} from '@netscript/auth-kv-oauth';
import { createWorkosBackend, type WorkosSessionClient } from '@netscript/auth-workos';
import { MemoryKvAdapter, type WatchableKv } from '@netscript/kv';
import { AuthConfigSchema } from '@netscript/plugin-auth-core/config';
import {
  AuthBackendNotFoundError,
  type AuthBackendPort,
  createAuthBackendRegistry,
  type ResolvedAuthBackendRegistry,
} from '@netscript/plugin-auth-core/ports';

/** Backend names supported by the auth plugin v1 service. */
export type AuthPluginBackendName = 'kv-oauth' | 'workos' | 'better-auth';

/** Appsettings shape inspected by the auth service composition root. */
export type AuthServiceAppsettings = Readonly<{
  auth?: { backend?: string };
  Auth?: { Backend?: string };
}>;

/** Options accepted by auth backend registry construction. */
export type CreateAuthServiceBackendRegistryOptions = Readonly<{
  env?: Readonly<Record<string, string | undefined>>;
  appsettings?: AuthServiceAppsettings;
  dbClient?: unknown;
  kv?: WatchableKv;
  fetch?: typeof fetch;
}>;

/** Creates a single-active auth backend registry for the plugin service. */
export async function createAuthServiceBackendRegistry(
  options: CreateAuthServiceBackendRegistryOptions = {},
): Promise<ResolvedAuthBackendRegistry> {
  const env = options.env ?? Deno.env.toObject();
  const activeName = resolveActiveBackendName(env, options.appsettings);
  const backend = await createActiveBackend(activeName, options);
  return createAuthBackendRegistry(
    new Map<string, AuthBackendPort>([[activeName, backend]]),
    activeName,
  );
}

/** Resolve the active backend name from appsettings and `NETSCRIPT_AUTH_BACKEND`. */
export function resolveActiveBackendName(
  env: Readonly<Record<string, string | undefined>>,
  appsettings?: AuthServiceAppsettings,
): AuthPluginBackendName {
  const configured = env.NETSCRIPT_AUTH_BACKEND ?? appsettings?.auth?.backend ??
    appsettings?.Auth?.Backend ?? 'kv-oauth';
  const parsed = AuthConfigSchema.parse({ backend: configured });
  if (
    parsed.backend === 'kv-oauth' || parsed.backend === 'workos' || parsed.backend === 'better-auth'
  ) {
    return parsed.backend;
  }
  throw new AuthBackendNotFoundError(parsed.backend, ['kv-oauth', 'workos', 'better-auth']);
}

async function createActiveBackend(
  backendName: AuthPluginBackendName,
  options: CreateAuthServiceBackendRegistryOptions,
): Promise<AuthBackendPort> {
  const env = options.env ?? Deno.env.toObject();
  if (backendName === 'kv-oauth') {
    const provider = resolveKvOAuthProviderEnv(env);
    return await createKvOAuthBackend({
      provider: defineOAuthProvider({
        id: env.NETSCRIPT_AUTH_PROVIDER_ID ?? 'default',
        displayName: env.NETSCRIPT_AUTH_PROVIDER_DISPLAY_NAME,
        clientId: provider.clientId,
        clientSecret: env.NETSCRIPT_AUTH_CLIENT_SECRET,
        issuer: env.NETSCRIPT_AUTH_ISSUER,
        authorizationEndpoint: provider.authorizationEndpoint,
        tokenEndpoint: provider.tokenEndpoint,
        userInfoEndpoint: env.NETSCRIPT_AUTH_USERINFO_ENDPOINT,
        redirectUri: provider.redirectUri,
        scopes: env.NETSCRIPT_AUTH_SCOPES?.split(/\s+/).filter(Boolean),
      }),
      store: options.kv
        ? await createKvOAuthStore({
          kv: options.kv,
          encryptionKey: resolveKvOAuthKey(env),
        })
        : undefined,
      fetch: options.fetch,
      allowInsecureRequests: env.NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS === 'true' ||
        provider.usesLocalDefaults,
      cookie: {
        name: env.NETSCRIPT_AUTH_COOKIE_NAME,
        allowInsecureDev: env.NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS === 'true' ||
          provider.usesLocalDefaults,
      },
    });
  }
  if (backendName === 'workos') {
    const { WorkOS } = await import('@workos-inc/node');
    return createWorkosBackend({
      workos: new WorkOS(requiredEnv(env, 'WORKOS_API_KEY'), {
        clientId: requiredEnv(env, 'WORKOS_CLIENT_ID'),
      }) as unknown as WorkosSessionClient,
      cookiePassword: requiredEnv(env, 'WORKOS_COOKIE_PASSWORD'),
      providers: [{ id: 'workos', displayName: 'WorkOS' }],
    });
  }

  return createBetterAuthBackend({
    auth: createNetscriptBetterAuth({
      prisma: options.dbClient ?? {},
      provider: betterAuthPrismaProvider(env.DB_PROVIDER),
      secret: requiredEnv(env, 'BETTER_AUTH_SECRET'),
    }),
    sessionTokenSecret: requiredEnv(env, 'BETTER_AUTH_SECRET'),
    providers: [{ id: 'better-auth', displayName: 'better-auth' }],
  });
}

function requiredEnv(env: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required for the selected auth backend.`);
  }
  return value;
}

function betterAuthPrismaProvider(value: string | undefined) {
  if (value === 'postgres') return 'postgresql';
  if (
    value === 'sqlite' || value === 'mysql' || value === 'mongodb' || value === 'sqlserver' ||
    value === 'cockroachdb' || value === 'postgresql'
  ) {
    return value;
  }
  return 'postgresql';
}

function resolveKvOAuthProviderEnv(
  env: Readonly<Record<string, string | undefined>>,
): Readonly<{
  clientId: string;
  redirectUri: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  usesLocalDefaults: boolean;
}> {
  const usesLocalDefaults = !env.NETSCRIPT_AUTH_CLIENT_ID || !env.NETSCRIPT_AUTH_REDIRECT_URI ||
    (!env.NETSCRIPT_AUTH_ISSUER &&
      (!env.NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT || !env.NETSCRIPT_AUTH_TOKEN_ENDPOINT));
  const port = env.PORT ?? '8094';
  const origin = `http://localhost:${port}`;
  return {
    clientId: env.NETSCRIPT_AUTH_CLIENT_ID ?? 'netscript-auth-local',
    redirectUri: env.NETSCRIPT_AUTH_REDIRECT_URI ?? `${origin}/api/v1/auth/callback`,
    authorizationEndpoint: env.NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT ??
      (env.NETSCRIPT_AUTH_ISSUER ? undefined : `${origin}/v1/auth/signin/not-configured`),
    tokenEndpoint: env.NETSCRIPT_AUTH_TOKEN_ENDPOINT ??
      (env.NETSCRIPT_AUTH_ISSUER ? undefined : `${origin}/v1/auth/token/not-configured`),
    usesLocalDefaults,
  };
}

function resolveKvOAuthKey(env: Readonly<Record<string, string | undefined>>): ArrayBuffer {
  const configured = env.NETSCRIPT_AUTH_KV_OAUTH_TEST_KEY;
  if (configured) {
    const bytes = Uint8Array.from(atob(configured), (char) => char.charCodeAt(0));
    return bytes.buffer as ArrayBuffer;
  }
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return key.buffer as ArrayBuffer;
}

/** Creates a test-friendly kv-oauth registry using an in-memory KV adapter. */
export async function createInMemoryKvOAuthRegistry(
  options: Omit<CreateAuthServiceBackendRegistryOptions, 'kv'> = {},
): Promise<ResolvedAuthBackendRegistry> {
  return await createAuthServiceBackendRegistry({
    ...options,
    kv: new MemoryKvAdapter(),
    env: {
      NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
      NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
      NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
      NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/oauth/authorize',
      NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
      NETSCRIPT_AUTH_REDIRECT_URI: 'https://app.example.test/api/v1/auth/callback',
      NETSCRIPT_AUTH_KV_OAUTH_TEST_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
      NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true',
      ...(options.env ?? {}),
    },
  });
}
