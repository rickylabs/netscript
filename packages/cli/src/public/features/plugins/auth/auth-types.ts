/** Finite auth configuration vocabulary exposed by the public CLI. */
export const AUTH_BACKENDS = ['kv-oauth', 'workos', 'better-auth'] as const;

/** Auth backend accepted by `plugin auth backend set`. */
export type AuthBackend = typeof AUTH_BACKENDS[number];

/** Provider presets accepted by `plugin auth provider set`. */
export const AUTH_PROVIDER_PRESETS = [
  'github',
  'google',
  'gitlab',
  'discord',
  'slack',
  'spotify',
  'facebook',
  'twitter',
  'okta',
  'auth0',
  'azure-ad',
  'aws-cognito',
  'logto',
  'clerk',
  'workos',
  'better-auth',
] as const;

/** Provider preset accepted by the auth CLI. */
export type AuthProviderPreset = typeof AUTH_PROVIDER_PRESETS[number];

/** Secret kinds emitted by `plugin auth secret generate`. */
export const AUTH_SECRET_KINDS = ['kv-oauth-key', 'better-auth', 'workos-cookie'] as const;

/** Secret kind accepted by the auth CLI. */
export type AuthSecretKind = typeof AUTH_SECRET_KINDS[number];

/** Durable auth-session projection printed by `session list`. */
export interface AuthSessionProjection {
  readonly id: string;
  readonly userId?: string;
  readonly providerId?: string;
  readonly subject?: string;
  readonly state: 'active' | 'expired' | 'revoked';
  readonly issuedAt?: string;
  readonly expiresAt?: string;
}

/** Narrow HTTP seam used by auth session CLI operations. */
export interface AuthSessionHttpPort {
  /** Read durable auth session projections. */
  list(streamUrl: string): Promise<readonly AuthSessionProjection[]>;
  /** Revoke a session through the auth signout procedure. */
  revoke(authUrl: string, sessionId: string): Promise<string>;
}

