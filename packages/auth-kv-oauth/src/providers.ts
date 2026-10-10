/**
 * OAuth/OIDC provider configuration helpers and presets.
 *
 * @example
 * ```ts
 * import { providers } from "@netscript/auth-kv-oauth/providers";
 *
 * const google = providers.google({
 *   clientId: "client_test",
 *   clientSecret: "secret_test",
 *   redirectUri: "https://app.example.test/auth/callback",
 * });
 * ```
 *
 * @module
 */

import type { AuthProviderDescriptor } from '@netscript/plugin-auth-core';
import { KvOAuthError } from './errors.ts';
import {
  normalizeSubjectSource,
  type OAuthSubjectSource,
  presetSubjectSource,
} from './subject-source.ts';

export type { AuthProviderCapability, AuthProviderDescriptor } from '@netscript/plugin-auth-core';
export type { OAuthSubjectSource } from './subject-source.ts';
export { presetProviderKind, presetSubjectSource } from './subject-source.ts';

/** Client authentication method used at the token endpoint. */
export type ClientAuthMethod = 'client_secret_basic' | 'client_secret_post' | 'none';

/** Shared fields present on every normalized OAuth provider. */
export type OAuthProviderBaseConfig = Readonly<{
  id: string;
  displayName: string;
  kind: 'oauth' | 'oidc';
  clientId: string;
  userInfoEndpoint?: string;
  /**
   * Stable subject source. {@link defineOAuthProvider} always sets it; when omitted on input it is
   * the ID-token `sub`, and a sign-in without one is refused with `subject_missing`.
   */
  subject?: OAuthSubjectSource;
  redirectUri: string;
  scopes: readonly string[];
  extraAuthParams: Readonly<Record<string, string>>;
}>;

/** Client-authentication shape for token endpoint requests. */
export type OAuthProviderClientAuthConfig =
  | Readonly<{
    clientAuthMethod: 'none';
    clientSecret?: string;
  }>
  | Readonly<{
    clientAuthMethod: 'client_secret_basic' | 'client_secret_post';
    clientSecret: string;
  }>;

/** Normalized OAuth/OIDC provider config resolved through issuer discovery. */
export type OAuthIssuerProviderConfig =
  & OAuthProviderBaseConfig
  & OAuthProviderClientAuthConfig
  & Readonly<{
    issuer: string;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
  }>;

/** Normalized OAuth/OIDC provider config with explicit static endpoints. */
export type OAuthEndpointProviderConfig =
  & OAuthProviderBaseConfig
  & OAuthProviderClientAuthConfig
  & Readonly<{
    issuer?: undefined;
    authorizationEndpoint: string;
    tokenEndpoint: string;
  }>;

/** Normalized OAuth/OIDC provider configuration consumed by the flow. */
export type OAuthProviderConfig = OAuthIssuerProviderConfig | OAuthEndpointProviderConfig;

/** Input accepted by {@link defineOAuthProvider}. */
export type OAuthProviderInput = Readonly<{
  id: string;
  displayName?: string;
  kind?: 'oauth' | 'oidc';
  clientId: string;
  clientSecret?: string;
  issuer?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  subject?: OAuthSubjectSource;
  redirectUri: string;
  scopes?: string | readonly string[];
  clientAuthMethod?: ClientAuthMethod;
  extraAuthParams?: Readonly<Record<string, string>>;
}>;

/** Options shared by static endpoint presets. */
export type PresetOAuthProviderOptions = Readonly<{
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string | readonly string[];
  clientAuthMethod?: ClientAuthMethod;
  extraAuthParams?: Readonly<Record<string, string>>;
  subject?: OAuthSubjectSource;
}>;

/** Options shared by issuer or tenant based presets. */
export type TenantOAuthProviderOptions =
  & PresetOAuthProviderOptions
  & Readonly<{
    issuer?: string;
    domain?: string;
    tenantId?: string;
    region?: string;
    userPoolId?: string;
  }>;

/** Builds a normalized provider config from generic input. */
export function defineOAuthProvider(input: OAuthProviderInput): OAuthProviderConfig {
  if (input.clientId.trim() === '') {
    throw new KvOAuthError('configuration_error', 'OAuth provider clientId is required.');
  }
  if (input.redirectUri.trim() === '') {
    throw new KvOAuthError('configuration_error', 'OAuth provider redirectUri is required.');
  }
  if (
    input.issuer === undefined &&
    (input.authorizationEndpoint === undefined || input.tokenEndpoint === undefined)
  ) {
    throw new KvOAuthError(
      'configuration_error',
      'OAuth provider requires either an issuer or explicit authorization and token endpoints.',
    );
  }

  const scopes = typeof input.scopes === 'string'
    ? input.scopes.split(/\s+/).filter(Boolean)
    : [...(input.scopes ?? ['openid', 'profile', 'email'])];

  const clientAuthMethod = input.clientAuthMethod ??
    (input.clientSecret ? 'client_secret_basic' : 'none');
  if (clientAuthMethod !== 'none' && !input.clientSecret) {
    throw new KvOAuthError(
      'configuration_error',
      `Provider ${input.id} requires clientSecret for ${clientAuthMethod}.`,
    );
  }

  const base = {
    id: input.id,
    displayName: input.displayName ?? title(input.id),
    kind: input.kind ?? (input.issuer ? 'oidc' : 'oauth'),
    clientId: input.clientId,
    userInfoEndpoint: input.userInfoEndpoint,
    subject: normalizeSubjectSource(input.id, input.subject, input.userInfoEndpoint),
    redirectUri: input.redirectUri,
    scopes,
    clientAuthMethod,
    extraAuthParams: Object.freeze({ ...(input.extraAuthParams ?? {}) }),
  };
  if (input.issuer !== undefined) {
    if (clientAuthMethod === 'none') {
      return Object.freeze({
        ...base,
        clientAuthMethod,
        clientSecret: input.clientSecret,
        issuer: input.issuer,
        authorizationEndpoint: input.authorizationEndpoint,
        tokenEndpoint: input.tokenEndpoint,
      });
    }
    const clientSecret = input.clientSecret;
    if (clientSecret === undefined) {
      throw new KvOAuthError(
        'configuration_error',
        `Provider ${input.id} requires clientSecret for ${clientAuthMethod}.`,
      );
    }
    return Object.freeze({
      ...base,
      clientAuthMethod,
      clientSecret,
      issuer: input.issuer,
      authorizationEndpoint: input.authorizationEndpoint,
      tokenEndpoint: input.tokenEndpoint,
    });
  }

  const authorizationEndpoint = input.authorizationEndpoint;
  const tokenEndpoint = input.tokenEndpoint;
  if (authorizationEndpoint === undefined || tokenEndpoint === undefined) {
    throw new KvOAuthError(
      'configuration_error',
      'OAuth provider requires explicit authorization and token endpoints without an issuer.',
    );
  }
  if (clientAuthMethod === 'none') {
    return Object.freeze({
      ...base,
      clientAuthMethod,
      clientSecret: input.clientSecret,
      authorizationEndpoint,
      tokenEndpoint,
    });
  }
  const clientSecret = input.clientSecret;
  if (clientSecret === undefined) {
    throw new KvOAuthError(
      'configuration_error',
      `Provider ${input.id} requires clientSecret for ${clientAuthMethod}.`,
    );
  }
  return Object.freeze({
    ...base,
    clientAuthMethod,
    clientSecret,
    authorizationEndpoint,
    tokenEndpoint,
  });
}

/** Returns true when a provider is resolved through issuer discovery. */
export function hasIssuerDiscovery(
  provider: OAuthProviderConfig,
): provider is OAuthIssuerProviderConfig {
  return provider.issuer !== undefined;
}

/** Converts a provider config into the AS1 descriptor shape. */
export function describeProvider(provider: OAuthProviderConfig): AuthProviderDescriptor {
  return {
    id: provider.id,
    displayName: provider.displayName,
    kind: provider.kind,
    capabilities: provider.scopes.includes('offline_access')
      ? ['signin', 'callback', 'refresh', 'signout', 'session']
      : ['signin', 'callback', 'signout', 'session'],
  };
}

const withSubject = (
  options: PresetOAuthProviderOptions,
  providerId: string,
): OAuthSubjectSource | undefined => options.subject ?? presetSubjectSource(providerId);

const withScopes = (
  options: PresetOAuthProviderOptions,
  defaults: readonly string[],
): readonly string[] | string => options.scopes ?? defaults;

const withDomain = (domain: string): string =>
  domain.startsWith('https://') ? domain : `https://${domain}`;

const title = (id: string): string =>
  id.split(/[-_]/).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');

/** Preset provider registry built on {@link defineOAuthProvider}. */
export const providers: Readonly<{
  github(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  google(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  gitlab(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  discord(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  slack(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  spotify(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  facebook(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  twitter(options: PresetOAuthProviderOptions): OAuthProviderConfig;
  auth0(options: TenantOAuthProviderOptions): OAuthProviderConfig;
  okta(options: TenantOAuthProviderOptions): OAuthProviderConfig;
  awsCognito(options: TenantOAuthProviderOptions): OAuthProviderConfig;
  azureAd(options: TenantOAuthProviderOptions): OAuthProviderConfig;
  logto(options: TenantOAuthProviderOptions): OAuthProviderConfig;
  clerk(options: TenantOAuthProviderOptions): OAuthProviderConfig;
}> = Object.freeze({
  github: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'github',
      subject: withSubject(options, 'github'),
      displayName: 'GitHub',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      userInfoEndpoint: 'https://api.github.com/user',
      scopes: withScopes(options, ['read:user', 'user:email']),
    }),
  google: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'google',
      subject: withSubject(options, 'google'),
      displayName: 'Google',
      issuer: 'https://accounts.google.com',
      scopes: withScopes(options, ['openid', 'profile', 'email']),
    }),
  gitlab: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'gitlab',
      subject: withSubject(options, 'gitlab'),
      displayName: 'GitLab',
      issuer: 'https://gitlab.com',
      scopes: withScopes(options, ['openid', 'profile', 'email']),
    }),
  discord: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'discord',
      subject: withSubject(options, 'discord'),
      displayName: 'Discord',
      authorizationEndpoint: 'https://discord.com/oauth2/authorize',
      tokenEndpoint: 'https://discord.com/api/oauth2/token',
      userInfoEndpoint: 'https://discord.com/api/users/@me',
      scopes: withScopes(options, ['identify', 'email']),
    }),
  slack: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'slack',
      subject: withSubject(options, 'slack'),
      displayName: 'Slack',
      authorizationEndpoint: 'https://slack.com/openid/connect/authorize',
      tokenEndpoint: 'https://slack.com/api/openid.connect.token',
      userInfoEndpoint: 'https://slack.com/api/openid.connect.userInfo',
      scopes: withScopes(options, ['openid', 'profile', 'email']),
    }),
  spotify: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'spotify',
      subject: withSubject(options, 'spotify'),
      displayName: 'Spotify',
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
      userInfoEndpoint: 'https://api.spotify.com/v1/me',
      scopes: withScopes(options, ['user-read-email']),
    }),
  facebook: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'facebook',
      subject: withSubject(options, 'facebook'),
      displayName: 'Facebook',
      authorizationEndpoint: 'https://www.facebook.com/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/oauth/access_token',
      userInfoEndpoint: 'https://graph.facebook.com/me',
      scopes: withScopes(options, ['email', 'public_profile']),
    }),
  twitter: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'twitter',
      subject: withSubject(options, 'twitter'),
      displayName: 'X',
      authorizationEndpoint: 'https://x.com/i/oauth2/authorize',
      tokenEndpoint: 'https://api.x.com/2/oauth2/token',
      userInfoEndpoint: 'https://api.x.com/2/users/me',
      scopes: withScopes(options, ['users.read', 'tweet.read']),
    }),
  auth0: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'auth0',
      subject: withSubject(options, 'auth0'),
      displayName: 'Auth0',
      issuer: options.issuer ?? (options.domain ? withDomain(options.domain) : undefined),
    }),
  okta: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'okta',
      subject: withSubject(options, 'okta'),
      displayName: 'Okta',
      issuer: options.issuer ?? (options.domain ? withDomain(options.domain) : undefined),
    }),
  awsCognito: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'aws-cognito',
      subject: withSubject(options, 'aws-cognito'),
      displayName: 'AWS Cognito',
      issuer: options.issuer ??
        (options.region && options.userPoolId
          ? `https://cognito-idp.${options.region}.amazonaws.com/${options.userPoolId}`
          : undefined),
    }),
  azureAd: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'azure-ad',
      subject: withSubject(options, 'azure-ad'),
      displayName: 'Azure AD',
      issuer: options.issuer ??
        `https://login.microsoftonline.com/${options.tenantId ?? 'common'}/v2.0`,
    }),
  logto: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'logto',
      subject: withSubject(options, 'logto'),
      displayName: 'Logto',
      issuer: options.issuer ?? (options.domain ? withDomain(options.domain) : undefined),
    }),
  clerk: (options) =>
    defineOAuthProvider({
      ...options,
      id: 'clerk',
      subject: withSubject(options, 'clerk'),
      displayName: 'Clerk',
      issuer: options.issuer ?? (options.domain ? withDomain(options.domain) : undefined),
    }),
});
