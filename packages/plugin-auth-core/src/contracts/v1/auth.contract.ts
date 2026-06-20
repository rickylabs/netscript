import { oc } from '@orpc/contract';
import { z } from 'zod';
import { AUTH_SESSION_STATES } from '../../domain/mod.ts';

/** Result returned by auth contract schema validation. */
export type AuthContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for auth contracts. */
export interface AuthContractSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): AuthContractSchemaResult<TOutput>;
}

/** Structural Standard Schema reference used by contract metadata. */
export type StandardSchemaLike<TInput = unknown, TOutput = TInput> = Readonly<{
  '~standard': Readonly<{
    types?: Readonly<{
      input: TInput;
      output: TOutput;
    }>;
  }>;
}>;

/** Structural oRPC procedure reference used by auth contracts. */
export type AuthContractProcedureLike<TInput = unknown, TOutput = unknown> = Readonly<{
  '~orpc': Readonly<{
    inputSchema?: StandardSchemaLike<TInput>;
    outputSchema?: StandardSchemaLike<unknown, TOutput>;
  }>;
}>;

/** Input accepted by the signin endpoint. */
export type SigninInput = Readonly<{
  providerId?: string;
  redirectTo?: string;
  loginHint?: string;
  scopes?: readonly string[];
  state?: string;
}>;

/** Response returned by the signin endpoint. */
export type SigninResponse = Readonly<{
  started: boolean;
  providerId?: string;
  redirectUrl?: string;
  state?: string;
}>;

/** Input accepted by the callback endpoint. */
export type CallbackInput = Readonly<{
  providerId?: string;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
  redirectTo?: string;
}>;

/** Response returned by the callback endpoint. */
export type CallbackResponse = Readonly<{
  completed: boolean;
  sessionId?: string;
  redirectTo?: string;
  subject?: string;
}>;

/** Input accepted by the signout endpoint. */
export type SignoutInput = Readonly<{
  sessionId?: string;
  everywhere?: boolean;
  redirectTo?: string;
}>;

/** Response returned by the signout endpoint. */
export type SignoutResponse = Readonly<{
  signedOut: boolean;
  sessionId?: string;
  redirectTo?: string;
}>;

/** Input accepted by the session endpoint. */
export type SessionInput = Readonly<{
  sessionId?: string;
}>;

/** Public auth session response returned by v1 endpoints. */
export type AuthSessionResponse = Readonly<{
  id: string;
  userId: string;
  providerId?: string;
  state: (typeof AUTH_SESSION_STATES)[keyof typeof AUTH_SESSION_STATES];
  subject: string;
  scopes: readonly string[];
  roles: readonly string[];
  claims: Readonly<Record<string, unknown>>;
  issuedAt: string;
  expiresAt: string;
  refreshedAt?: string;
  revokedAt?: string;
}>;

/** Response returned by the session endpoint. */
export type SessionResponse = Readonly<{
  authenticated: boolean;
  session?: AuthSessionResponse;
}>;

/** Public user response returned by the me endpoint. */
export type AuthUserResponse = Readonly<{
  id: string;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  imageUrl?: string;
  claims?: Readonly<Record<string, unknown>>;
}>;

/** Response returned by the me endpoint. */
export type MeResponse = Readonly<{
  authenticated: boolean;
  user?: AuthUserResponse;
  session?: AuthSessionResponse;
}>;

const baseContract: ReturnType<typeof oc.errors> = oc.errors({
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: z.object({ reason: z.string() }),
  },
  AUTH_PROVIDER_ERROR: {
    status: 502,
    message: 'Auth provider failed',
    data: z.object({
      providerId: z.string().optional(),
      reason: z.string(),
    }),
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: z.object({
      formErrors: z.array(z.string()),
      fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
    }),
  },
});

const SigninInputZodSchema: z.ZodType<SigninInput> = z.object({
  providerId: z.string().min(1).optional(),
  redirectTo: z.string().optional(),
  loginHint: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  state: z.string().optional(),
});

/** Schema for signin endpoint input. */
export const SigninInputSchema: AuthContractSchema<SigninInput> = SigninInputZodSchema;

const SigninResponseZodSchema: z.ZodType<SigninResponse> = z.object({
  started: z.boolean(),
  providerId: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  state: z.string().optional(),
});

/** Schema for signin endpoint responses. */
export const SigninResponseSchema: AuthContractSchema<SigninResponse> = SigninResponseZodSchema;

const CallbackInputZodSchema: z.ZodType<CallbackInput> = z.object({
  providerId: z.string().min(1).optional(),
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  errorDescription: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for callback endpoint input. */
export const CallbackInputSchema: AuthContractSchema<CallbackInput> = CallbackInputZodSchema;

const CallbackResponseZodSchema: z.ZodType<CallbackResponse> = z.object({
  completed: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
  subject: z.string().optional(),
});

/** Schema for callback endpoint responses. */
export const CallbackResponseSchema: AuthContractSchema<CallbackResponse> =
  CallbackResponseZodSchema;

const SignoutInputZodSchema: z.ZodType<SignoutInput> = z.object({
  sessionId: z.string().optional(),
  everywhere: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint input. */
export const SignoutInputSchema: AuthContractSchema<SignoutInput> = SignoutInputZodSchema;

const SignoutResponseZodSchema: z.ZodType<SignoutResponse> = z.object({
  signedOut: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint responses. */
export const SignoutResponseSchema: AuthContractSchema<SignoutResponse> = SignoutResponseZodSchema;

const SessionInputZodSchema: z.ZodType<SessionInput> = z.object({
  sessionId: z.string().optional(),
});

/** Schema for session endpoint input. */
export const SessionInputSchema: AuthContractSchema<SessionInput> = SessionInputZodSchema;

const AuthSessionResponseZodSchema: z.ZodType<AuthSessionResponse> = z.object({
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
export const AuthSessionResponseSchema: AuthContractSchema<AuthSessionResponse> =
  AuthSessionResponseZodSchema;

const SessionResponseZodSchema: z.ZodType<SessionResponse> = z.object({
  authenticated: z.boolean(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for session endpoint responses. */
export const SessionResponseSchema: AuthContractSchema<SessionResponse> = SessionResponseZodSchema;

const AuthUserResponseZodSchema: z.ZodType<AuthUserResponse> = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  claims: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for public auth user responses. */
export const AuthUserResponseSchema: AuthContractSchema<AuthUserResponse> =
  AuthUserResponseZodSchema;

const MeResponseZodSchema: z.ZodType<MeResponse> = z.object({
  authenticated: z.boolean(),
  user: AuthUserResponseZodSchema.optional(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for me endpoint responses. */
export const MeResponseSchema: AuthContractSchema<MeResponse> = MeResponseZodSchema;

/** Explicit public contract shape for auth service clients. */
export type AuthContractDefinition = Readonly<{
  signin: AuthContractProcedureLike<SigninInput, SigninResponse>;
  callback: AuthContractProcedureLike<CallbackInput, CallbackResponse>;
  signout: AuthContractProcedureLike<SignoutInput, SignoutResponse>;
  session: AuthContractProcedureLike<SessionInput, SessionResponse>;
  me: AuthContractProcedureLike<undefined, MeResponse>;
}>;

function createAuthContractDefinition(): AuthContractDefinition {
  return {
    signin: baseContract
      .route({ method: 'POST', path: '/signin' })
      .input(SigninInputZodSchema)
      .output(SigninResponseZodSchema),
    callback: baseContract
      .route({ method: 'POST', path: '/callback' })
      .input(CallbackInputZodSchema)
      .output(CallbackResponseZodSchema),
    signout: baseContract
      .route({ method: 'POST', path: '/signout' })
      .input(SignoutInputZodSchema)
      .output(SignoutResponseZodSchema),
    session: baseContract
      .route({ method: 'GET', path: '/session' })
      .input(SessionInputZodSchema.optional())
      .output(SessionResponseZodSchema),
    me: baseContract
      .route({ method: 'GET', path: '/me' })
      .input(z.undefined().optional())
      .output(MeResponseZodSchema),
  } as unknown as AuthContractDefinition;
}

/** oRPC contract definition for the auth service API. */
export const authContract: AuthContractDefinition = createAuthContractDefinition();

/** Versioned alias for the auth service API contract. */
export const authContractV1: AuthContractDefinition = authContract;
