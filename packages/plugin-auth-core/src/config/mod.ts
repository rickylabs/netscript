/**
 * Auth plugin configuration schemas.
 *
 * @module
 */

import { z } from 'zod';
import type { AuthSchema } from '../domain/mod.ts';
export type { AuthSchema, AuthSchemaResult } from '../domain/mod.ts';

/** Cookie and session policy knobs consumed by the auth plugin service. */
export type AuthSessionPolicy = Readonly<{
  cookieName: string;
  cookieDomain?: string;
  cookiePath: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  httpOnly: boolean;
  ttlSeconds: number;
  refreshWindowSeconds: number;
}>;

/** Provider configuration shape shared by backend adapters. */
export type AuthProviderConfig = Readonly<{
  id: string;
  backend?: string;
  displayName?: string;
  clientId?: string;
  issuer?: string;
  scopes?: readonly string[];
  redirectUri?: string;
  enabled: boolean;
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Data-only endpoint quota using the provider's native window/max vocabulary. */
export type AuthRateLimitRule = Readonly<{
  /** Window length in seconds; must be a positive integer. */
  window: number;
  /** Requests allowed per client IP and path in the window; a positive integer. */
  max: number;
}>;

/** Optional provider endpoint overrides; omission preserves provider defaults. */
export type AuthRateLimitConfig = Readonly<{
  /** Slash-prefixed paths or wildcard patterns relative to the provider's auth base path. */
  customRules: Readonly<Record<string, AuthRateLimitRule>>;
}>;

/** Auth plugin configuration accepted from NetScript app settings. */
export type AuthConfig = Readonly<{
  backend: string;
  session: AuthSessionPolicy;
  providers: readonly AuthProviderConfig[];
  /** Endpoint quotas forwarded to better-auth without changing production enablement. */
  rateLimit?: AuthRateLimitConfig;
}>;

/** Loose auth plugin configuration input accepted before defaults are applied. */
export type AuthConfigInput = Readonly<{
  backend?: string;
  session?: Partial<AuthSessionPolicy>;
  providers?: readonly AuthProviderConfig[];
  /** Optional native endpoint quota overrides. */
  rateLimit?: AuthRateLimitConfig;
}>;

const AuthSessionPolicyZodSchema = z.object({
  cookieName: z.string().min(1).default('__Host-netscript-auth'),
  cookieDomain: z.string().min(1).optional(),
  cookiePath: z.string().min(1).default('/'),
  secure: z.boolean().default(true),
  sameSite: z.enum(['lax', 'strict', 'none']).default('lax'),
  httpOnly: z.boolean().default(true),
  ttlSeconds: z.number().int().positive().default(60 * 60 * 24 * 7),
  refreshWindowSeconds: z.number().int().nonnegative().default(60 * 15),
});

/** Schema for auth cookie and session policy knobs. */
export const AuthSessionPolicySchema: AuthSchema<AuthSessionPolicy> = AuthSessionPolicyZodSchema;

const AuthProviderConfigZodSchema: z.ZodType<AuthProviderConfig> = z.object({
  id: z.string().min(1),
  backend: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
  issuer: z.string().url().optional(),
  scopes: z.array(z.string()).optional(),
  redirectUri: z.string().url().optional(),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for one auth provider configuration entry. */
export const AuthProviderConfigSchema: AuthSchema<AuthProviderConfig> = AuthProviderConfigZodSchema;

const AuthRateLimitConfigZodSchema = z.object({
  customRules: z.record(
    z.string().startsWith('/'),
    z.object({ window: z.number().int().positive(), max: z.number().int().positive() }),
  ),
});

const AuthConfigInputZodSchema = z.object({
  backend: z.string().min(1).default('default'),
  session: z.record(z.string(), z.unknown()).optional(),
  providers: z.array(AuthProviderConfigZodSchema).default([]),
  rateLimit: AuthRateLimitConfigZodSchema.optional(),
});

/** Schema for auth plugin configuration. */
export const AuthConfigSchema: AuthSchema<AuthConfig> = AuthConfigInputZodSchema
  .transform((raw): AuthConfig => ({
    backend: raw.backend,
    session: AuthSessionPolicyZodSchema.parse(raw.session ?? {}),
    providers: raw.providers,
    ...(raw.rateLimit === undefined ? {} : { rateLimit: raw.rateLimit }),
  }));
