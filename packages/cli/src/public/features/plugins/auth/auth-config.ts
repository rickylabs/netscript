import { join } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import {
  AUTH_BACKENDS,
  AUTH_PROVIDER_PRESETS,
  type AuthBackend,
  type AuthProviderPreset,
  type AuthSecretKind,
} from './auth-types.ts';

const AUTH_ENV_FILE = '.env';
const APPSETTINGS_FILE = 'appsettings.json';

const PRESET_ENV: Readonly<
  Partial<Record<AuthProviderPreset, Readonly<Record<string, string>>>>
> = {
  github: {
    NETSCRIPT_AUTH_ISSUER: 'https://github.com',
    NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://github.com/login/oauth/authorize',
    NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://github.com/login/oauth/access_token',
    NETSCRIPT_AUTH_USERINFO_ENDPOINT: 'https://api.github.com/user',
    NETSCRIPT_AUTH_SCOPES: 'read:user user:email',
  },
  google: {
    NETSCRIPT_AUTH_ISSUER: 'https://accounts.google.com',
    NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://accounts.google.com/o/oauth2/v2/auth',
    NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
    NETSCRIPT_AUTH_USERINFO_ENDPOINT: 'https://openidconnect.googleapis.com/v1/userinfo',
    NETSCRIPT_AUTH_SCOPES: 'openid email profile',
  },
  gitlab: {
    NETSCRIPT_AUTH_ISSUER: 'https://gitlab.com',
    NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://gitlab.com/oauth/authorize',
    NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://gitlab.com/oauth/token',
    NETSCRIPT_AUTH_USERINFO_ENDPOINT: 'https://gitlab.com/oauth/userinfo',
    NETSCRIPT_AUTH_SCOPES: 'openid email profile',
  },
};

/** Input for provider configuration reconciliation. */
export interface SetAuthProviderInput {
  readonly projectRoot: string;
  readonly preset: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly redirectUri?: string;
  readonly issuer?: string;
  readonly apiKey?: string;
  readonly cookiePassword?: string;
  readonly secret?: string;
  readonly kvOAuthKey?: string;
}

/** Set the active auth backend in the project environment seam. */
export async function setAuthBackend(
  projectRoot: string,
  backendValue: string,
  fs: FileSystemPort,
): Promise<AuthBackend> {
  const backend = parseAuthBackend(backendValue);
  await writeAuthConfig(projectRoot, { NETSCRIPT_AUTH_BACKEND: backend }, fs);
  return backend;
}

/** Resolve the active auth backend from `.env`, appsettings, or the service default. */
export async function showAuthBackend(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<AuthBackend> {
  const env = await readEnv(join(projectRoot, AUTH_ENV_FILE), fs);
  if (env.NETSCRIPT_AUTH_BACKEND) return parseAuthBackend(env.NETSCRIPT_AUTH_BACKEND);

  const appsettingsPath = join(projectRoot, APPSETTINGS_FILE);
  if (await fs.exists(appsettingsPath)) {
    const value = JSON.parse(await fs.readFile(appsettingsPath)) as {
      auth?: { backend?: unknown };
      Auth?: { Backend?: unknown };
    };
    const configured = value.auth?.backend ?? value.Auth?.Backend;
    if (typeof configured === 'string') return parseAuthBackend(configured);
  }
  return 'kv-oauth';
}

/** Reconcile one provider preset into the project auth environment seam. */
export async function setAuthProvider(
  input: SetAuthProviderInput,
  fs: FileSystemPort,
): Promise<AuthProviderPreset> {
  const preset = parseProviderPreset(input.preset);
  const values = providerEnv(preset, input);
  await writeAuthConfig(input.projectRoot, values, fs);
  return preset;
}

/** Generate cryptographically random auth secret material. */
export function generateAuthSecret(kind: AuthSecretKind): string {
  const size = kind === 'kv-oauth-key' ? 32 : 48;
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function providerEnv(
  preset: AuthProviderPreset,
  input: SetAuthProviderInput,
): Record<string, string> {
  if (preset === 'workos') {
    return {
      NETSCRIPT_AUTH_BACKEND: 'workos',
      WORKOS_API_KEY: required('--api-key', input.apiKey),
      WORKOS_CLIENT_ID: required('--client-id', input.clientId),
      WORKOS_COOKIE_PASSWORD: required('--cookie-password', input.cookiePassword),
    };
  }
  if (preset === 'better-auth') {
    return {
      NETSCRIPT_AUTH_BACKEND: 'better-auth',
      BETTER_AUTH_SECRET: required('--secret', input.secret),
    };
  }

  const values: Record<string, string> = {
    NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
    NETSCRIPT_AUTH_PROVIDER_ID: preset,
    NETSCRIPT_AUTH_CLIENT_ID: required('--client-id', input.clientId),
    NETSCRIPT_AUTH_CLIENT_SECRET: required('--client-secret', input.clientSecret),
    NETSCRIPT_AUTH_REDIRECT_URI: required('--redirect-uri', input.redirectUri),
    ...(PRESET_ENV[preset] ?? {}),
  };
  if (input.issuer) values.NETSCRIPT_AUTH_ISSUER = input.issuer;
  if (input.kvOAuthKey) values.NETSCRIPT_AUTH_KV_OAUTH_KEY = input.kvOAuthKey;
  if (!values.NETSCRIPT_AUTH_ISSUER && !values.NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT) {
    throw new Error(`Provider preset "${preset}" requires --issuer.`);
  }
  return values;
}

function parseAuthBackend(value: string): AuthBackend {
  if (AUTH_BACKENDS.includes(value as AuthBackend)) return value as AuthBackend;
  throw new Error(`Invalid auth backend "${value}". Expected ${AUTH_BACKENDS.join(', ')}.`);
}

function parseProviderPreset(value: string): AuthProviderPreset {
  if (AUTH_PROVIDER_PRESETS.includes(value as AuthProviderPreset)) {
    return value as AuthProviderPreset;
  }
  throw new Error(`Invalid auth provider preset "${value}".`);
}

function required(flag: string, value: string | undefined): string {
  if (value?.trim()) return value;
  throw new Error(`${flag} is required for this provider preset.`);
}

async function writeAuthEnv(
  projectRoot: string,
  values: Readonly<Record<string, string>>,
  fs: FileSystemPort,
): Promise<void> {
  const path = join(projectRoot, AUTH_ENV_FILE);
  const current = await fs.exists(path) ? await fs.readFile(path) : '';
  const pending = new Map(Object.entries(values));
  const lines = current.split(/\r?\n/).filter((line, index, all) =>
    !(index === all.length - 1 && line === '')
  ).map((line) => {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
    if (!match || !pending.has(match[1])) return line;
    const next = `${match[1]}=${pending.get(match[1])}`;
    pending.delete(match[1]);
    return next;
  });
  for (const [key, value] of pending) lines.push(`${key}=${value}`);
  await fs.writeFile(path, `${lines.join('\n')}\n`);
}

async function writeAuthConfig(
  projectRoot: string,
  values: Readonly<Record<string, string>>,
  fs: FileSystemPort,
): Promise<void> {
  await writeAuthEnv(projectRoot, values, fs);
  const path = join(projectRoot, APPSETTINGS_FILE);
  const current = await fs.exists(path)
    ? JSON.parse(await fs.readFile(path)) as Record<string, unknown>
    : {};
  const auth = isRecord(current.Auth) ? current.Auth : {};
  const environment = isStringRecord(auth.Environment) ? auth.Environment : {};
  current.Auth = {
    ...auth,
    ...(values.NETSCRIPT_AUTH_BACKEND ? { Backend: values.NETSCRIPT_AUTH_BACKEND } : {}),
    Environment: { ...environment, ...values },
  };
  const netScript = isRecord(current.NetScript) ? current.NetScript : {};
  const plugins = isRecord(netScript.Plugins) ? netScript.Plugins : {};
  const authPlugin = isRecord(plugins.auth) ? plugins.auth : {};
  const pluginEnvironment = isStringRecord(authPlugin.Environment) ? authPlugin.Environment : {};
  current.NetScript = {
    ...netScript,
    Plugins: {
      ...plugins,
      auth: {
        ...authPlugin,
        Environment: { ...pluginEnvironment, ...values },
      },
    },
  };
  await fs.writeFile(path, `${JSON.stringify(current, null, 2)}\n`);
}

async function readEnv(path: string, fs: FileSystemPort): Promise<Record<string, string>> {
  if (!await fs.exists(path)) return {};
  const result: Record<string, string> = {};
  for (const line of (await fs.readFile(path)).split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
