/**
 * Named, explicitly-annotated Zod schemas for the auth v1 contract routes.
 *
 * Each `*ZodSchema` keeps its concrete Zod constructor type so its `typeof` feeds the contract
 * definition under `--isolatedDeclarations`; each public `*Schema` is additionally annotated
 * `AuthSchema<T>`, so this module fails to compile if a schema drifts from its contract type.
 *
 * @module
 */

import { z } from 'zod';
import { AUTH_SESSION_STATES, type AuthSchema } from '../../domain/mod.ts';
import type {
  AuthSessionResponse,
  AuthUserResponse,
  CallbackInput,
  CallbackResponse,
  MeResponse,
  RevokeSessionInput,
  RevokeSessionResponse,
  SessionInput,
  SessionResponse,
  SigninInput,
  SigninResponse,
  SignoutInput,
  SignoutResponse,
} from './auth.contract-types.ts';

// --- Route input/output schemas ----------------------------------------------
// Every inline `z.object(...)` is named and explicitly annotated with concrete
// Zod constructor types so its `typeof` can feed the `Route<...>` alias under
// `--isolatedDeclarations` and never upcasts to `z.ZodType<T>` (which erases
// `_output` and reopens the soundness hole).

export const SigninInputZodSchema: z.ZodObject<{
  providerId: z.ZodOptional<z.ZodString>;
  redirectTo: z.ZodOptional<z.ZodString>;
  loginHint: z.ZodOptional<z.ZodString>;
  scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
  state: z.ZodOptional<z.ZodString>;
}> = z.object({
  providerId: z.string().min(1).optional(),
  redirectTo: z.string().optional(),
  loginHint: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  state: z.string().optional(),
});

/** Schema for signin endpoint input. */
export const SigninInputSchema: AuthSchema<SigninInput> = SigninInputZodSchema;

export const SigninResponseZodSchema: z.ZodObject<{
  started: z.ZodBoolean;
  providerId: z.ZodOptional<z.ZodString>;
  redirectUrl: z.ZodOptional<z.ZodString>;
  state: z.ZodOptional<z.ZodString>;
}> = z.object({
  started: z.boolean(),
  providerId: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  state: z.string().optional(),
});

/** Schema for signin endpoint responses. */
export const SigninResponseSchema: AuthSchema<SigninResponse> = SigninResponseZodSchema;

export const CallbackInputZodSchema: z.ZodObject<{
  providerId: z.ZodOptional<z.ZodString>;
  code: z.ZodOptional<z.ZodString>;
  state: z.ZodOptional<z.ZodString>;
  error: z.ZodOptional<z.ZodString>;
  errorDescription: z.ZodOptional<z.ZodString>;
  redirectTo: z.ZodOptional<z.ZodString>;
}> = z.object({
  providerId: z.string().min(1).optional(),
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  errorDescription: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for callback endpoint input. */
export const CallbackInputSchema: AuthSchema<CallbackInput> = CallbackInputZodSchema;

export const CallbackResponseZodSchema: z.ZodObject<{
  completed: z.ZodBoolean;
  sessionId: z.ZodOptional<z.ZodString>;
  redirectTo: z.ZodOptional<z.ZodString>;
  subject: z.ZodOptional<z.ZodString>;
}> = z.object({
  completed: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
  subject: z.string().optional(),
});

/** Schema for callback endpoint responses. */
export const CallbackResponseSchema: AuthSchema<CallbackResponse> = CallbackResponseZodSchema;

export const SignoutInputZodSchema: z.ZodObject<{
  sessionId: z.ZodOptional<z.ZodString>;
  everywhere: z.ZodOptional<z.ZodBoolean>;
  redirectTo: z.ZodOptional<z.ZodString>;
}> = z.object({
  sessionId: z.string().optional(),
  everywhere: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint input. */
export const SignoutInputSchema: AuthSchema<SignoutInput> = SignoutInputZodSchema;

export const SignoutResponseZodSchema: z.ZodObject<{
  signedOut: z.ZodBoolean;
  sessionId: z.ZodOptional<z.ZodString>;
  redirectTo: z.ZodOptional<z.ZodString>;
}> = z.object({
  signedOut: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint responses. */
export const SignoutResponseSchema: AuthSchema<SignoutResponse> = SignoutResponseZodSchema;

export const RevokeSessionInputZodSchema: z.ZodObject<{
  sessionId: z.ZodString;
}> = z.object({
  sessionId: z.string().min(1),
});

/** Schema for operator `revokeSession` endpoint input. */
export const RevokeSessionInputSchema: AuthSchema<RevokeSessionInput> = RevokeSessionInputZodSchema;

export const RevokeSessionResponseZodSchema: z.ZodObject<{
  revoked: z.ZodBoolean;
  sessionId: z.ZodString;
}> = z.object({
  revoked: z.boolean(),
  sessionId: z.string(),
});

/** Schema for operator `revokeSession` endpoint responses. */
export const RevokeSessionResponseSchema: AuthSchema<RevokeSessionResponse> =
  RevokeSessionResponseZodSchema;

const SessionInputZodSchema: z.ZodObject<{
  sessionId: z.ZodOptional<z.ZodString>;
}> = z.object({
  sessionId: z.string().optional(),
});

/** Schema for session endpoint input. */
export const SessionInputSchema: AuthSchema<SessionInput> = SessionInputZodSchema;

export const sessionRouteInput: z.ZodOptional<typeof SessionInputZodSchema> = SessionInputZodSchema
  .optional();

// OpenAPI GET decodes an empty query as `{}`, so a no-input route takes an optional empty object.
export const meRouteInput: z.ZodOptional<z.ZodObject<Record<never, never>>> = z.object({})
  .optional();

const AuthSessionResponseZodSchema: z.ZodObject<{
  id: z.ZodString;
  userId: z.ZodString;
  providerId: z.ZodOptional<z.ZodString>;
  state: z.ZodEnum<{ active: 'active'; expired: 'expired'; revoked: 'revoked' }>;
  subject: z.ZodString;
  scopes: z.ZodArray<z.ZodString>;
  roles: z.ZodArray<z.ZodString>;
  claims: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  issuedAt: z.ZodString;
  expiresAt: z.ZodString;
  refreshedAt: z.ZodOptional<z.ZodString>;
  revokedAt: z.ZodOptional<z.ZodString>;
}> = z.object({
  id: z.string(),
  userId: z.string(),
  providerId: z.string().optional(),
  state: z.enum([
    AUTH_SESSION_STATES.active,
    AUTH_SESSION_STATES.expired,
    AUTH_SESSION_STATES.revoked,
  ]),
  subject: z.string(),
  scopes: z.array(z.string()),
  roles: z.array(z.string()),
  claims: z.record(z.string(), z.unknown()).default({}),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  refreshedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
});

/** Schema for public auth session responses. */
export const AuthSessionResponseSchema: AuthSchema<AuthSessionResponse> =
  AuthSessionResponseZodSchema;

export const SessionResponseZodSchema: z.ZodObject<{
  authenticated: z.ZodBoolean;
  session: z.ZodOptional<typeof AuthSessionResponseZodSchema>;
}> = z.object({
  authenticated: z.boolean(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for session endpoint responses. */
export const SessionResponseSchema: AuthSchema<SessionResponse> = SessionResponseZodSchema;

const AuthUserResponseZodSchema: z.ZodObject<{
  id: z.ZodString;
  displayName: z.ZodOptional<z.ZodString>;
  email: z.ZodOptional<z.ZodString>;
  emailVerified: z.ZodOptional<z.ZodBoolean>;
  imageUrl: z.ZodOptional<z.ZodString>;
  claims: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}> = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  claims: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for public auth user responses. */
export const AuthUserResponseSchema: AuthSchema<AuthUserResponse> = AuthUserResponseZodSchema;

export const MeResponseZodSchema: z.ZodObject<{
  authenticated: z.ZodBoolean;
  user: z.ZodOptional<typeof AuthUserResponseZodSchema>;
  session: z.ZodOptional<typeof AuthSessionResponseZodSchema>;
}> = z.object({
  authenticated: z.boolean(),
  user: AuthUserResponseZodSchema.optional(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for me endpoint responses. */
export const MeResponseSchema: AuthSchema<MeResponse> = MeResponseZodSchema;
