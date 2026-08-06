/**
 * Auth domain entities and schemas shared by backend adapters and services.
 *
 * @example
 * ```ts
 * import { AUTH_SESSION_STATES } from "@netscript/plugin-auth-core/domain";
 *
 * console.log(AUTH_SESSION_STATES.active);
 * ```
 *
 * @module
 */

import { z } from 'zod';
import type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  Principal,
} from '@netscript/service/auth';

export type { AuthenticatorPort, AuthnRequest, AuthnResult, Principal };

/** Result returned by a public auth schema validation. */
export type AuthSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural validator shared by auth public surfaces. */
export interface AuthSchema<TOutput, TInput = unknown> {
  /** Standard Schema metadata used by framework consumers. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> | undefined },
    ) =>
      | { readonly value: TOutput; readonly issues?: undefined }
      | { readonly issues: ReadonlyArray<{ readonly message: string }> }
      | Promise<
        | { readonly value: TOutput; readonly issues?: undefined }
        | { readonly issues: ReadonlyArray<{ readonly message: string }> }
      >;
    readonly types?: { readonly input: TInput; readonly output: TOutput } | undefined;
  };
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value without throwing. */
  safeParse(input: TInput): AuthSchemaResult<TOutput>;
}

/** Auth session states shared by backend adapters and service contracts. */
export const AUTH_SESSION_STATES: Readonly<{
  active: 'active';
  expired: 'expired';
  revoked: 'revoked';
}> = {
  active: 'active',
  expired: 'expired',
  revoked: 'revoked',
};

/** Auth account states shared by backend adapters and service contracts. */
export const AUTH_ACCOUNT_STATES: Readonly<{
  active: 'active';
  disabled: 'disabled';
  pending: 'pending';
  deleted: 'deleted';
}> = {
  active: 'active',
  disabled: 'disabled',
  pending: 'pending',
  deleted: 'deleted',
};

/** Lifecycle state for a user session. */
export type AuthSessionState = (typeof AUTH_SESSION_STATES)[keyof typeof AUTH_SESSION_STATES];

/** Lifecycle state for an auth account. */
export type AccountState = (typeof AUTH_ACCOUNT_STATES)[keyof typeof AUTH_ACCOUNT_STATES];

/** User identity normalized across auth providers. */
export type AuthUser = Readonly<{
  id: string;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  imageUrl?: string;
  locale?: string;
  claims?: Readonly<Record<string, unknown>>;
}>;

/** Provider account linked to a normalized auth user. */
export type Account = Readonly<{
  id: string;
  userId: string;
  providerId: string;
  providerAccountId: string;
  state: AccountState;
  scopes: readonly string[];
  claims?: Readonly<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}>;

/** Auth session stored by backend adapters and mapped to service principals. */
export type AuthSession = Readonly<{
  id: string;
  userId: string;
  accountId?: string;
  providerId?: string;
  state: AuthSessionState;
  subject: string;
  scopes: readonly string[];
  roles: readonly string[];
  claims: Readonly<Record<string, unknown>>;
  issuedAt: string;
  expiresAt: string;
  refreshedAt?: string;
  revokedAt?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Mapping result that turns a backend session into a NetScript service principal. */
export type AuthSessionPrincipalMapping = Readonly<{
  session: AuthSession;
  principal: Principal & { readonly scheme: 'custom' };
}>;

const AuthUserZodSchema: z.ZodType<AuthUser> = z.object({
  id: z.string().min(1),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  locale: z.string().optional(),
  claims: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for normalized auth users. */
export const AuthUserSchema: AuthSchema<AuthUser> = AuthUserZodSchema;

const AccountZodSchema: z.ZodType<Account> = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  providerId: z.string().min(1),
  providerAccountId: z.string().min(1),
  state: z.enum([
    AUTH_ACCOUNT_STATES.active,
    AUTH_ACCOUNT_STATES.disabled,
    AUTH_ACCOUNT_STATES.pending,
    AUTH_ACCOUNT_STATES.deleted,
  ]),
  scopes: z.array(z.string()),
  claims: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Schema for provider accounts linked to auth users. */
export const AccountSchema: AuthSchema<Account> = AccountZodSchema;

/** Schema for normalized auth sessions. */
export const AuthSessionSchema: AuthSchema<AuthSession> = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  accountId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  state: z.enum([
    AUTH_SESSION_STATES.active,
    AUTH_SESSION_STATES.expired,
    AUTH_SESSION_STATES.revoked,
  ]),
  subject: z.string().min(1),
  scopes: z.array(z.string()),
  roles: z.array(z.string()),
  claims: z.record(z.string(), z.unknown()).default({}),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  refreshedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});
