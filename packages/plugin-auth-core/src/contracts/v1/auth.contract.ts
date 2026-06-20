import { oc } from '@orpc/contract';
import { implement } from '@orpc/server';
import { z } from 'zod';
import { AUTH_SESSION_STATES } from '../../domain/mod.ts';

export { AUTH_SESSION_STATES } from '../../domain/mod.ts';

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

/** Validation error payload returned by auth contract errors. */
export type ValidationErrorData = Readonly<{
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
}>;

type AuthErrorDefinition<TData> = Readonly<{
  status: number;
  message: string;
  data: z.ZodType<TData>;
}>;

type AuthErrorMapDefinition = Readonly<{
  UNAUTHORIZED: AuthErrorDefinition<{ reason: string }>;
  AUTH_PROVIDER_ERROR: AuthErrorDefinition<{ providerId?: string; reason: string }>;
  VALIDATION_ERROR: AuthErrorDefinition<ValidationErrorData>;
}>;

const authErrorMap: AuthErrorMapDefinition = {
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
};

const baseContract: ReturnType<typeof oc.errors<typeof authErrorMap>> = oc.errors(authErrorMap);

const SigninInputZodSchema: z.ZodType<SigninInput> = z.object({
  providerId: z.string().min(1).optional(),
  redirectTo: z.string().optional(),
  loginHint: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  state: z.string().optional(),
});

/** Schema for signin endpoint input. */
export const SigninInputSchema: z.ZodType<SigninInput> = SigninInputZodSchema;

const SigninResponseZodSchema: z.ZodType<SigninResponse> = z.object({
  started: z.boolean(),
  providerId: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  state: z.string().optional(),
});

/** Schema for signin endpoint responses. */
export const SigninResponseSchema: z.ZodType<SigninResponse> = SigninResponseZodSchema;

const CallbackInputZodSchema: z.ZodType<CallbackInput> = z.object({
  providerId: z.string().min(1).optional(),
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  errorDescription: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for callback endpoint input. */
export const CallbackInputSchema: z.ZodType<CallbackInput> = CallbackInputZodSchema;

const CallbackResponseZodSchema: z.ZodType<CallbackResponse> = z.object({
  completed: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
  subject: z.string().optional(),
});

/** Schema for callback endpoint responses. */
export const CallbackResponseSchema: z.ZodType<CallbackResponse> = CallbackResponseZodSchema;

const SignoutInputZodSchema: z.ZodType<SignoutInput> = z.object({
  sessionId: z.string().optional(),
  everywhere: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint input. */
export const SignoutInputSchema: z.ZodType<SignoutInput> = SignoutInputZodSchema;

const SignoutResponseZodSchema: z.ZodType<SignoutResponse> = z.object({
  signedOut: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint responses. */
export const SignoutResponseSchema: z.ZodType<SignoutResponse> = SignoutResponseZodSchema;

const SessionInputZodSchema: z.ZodType<SessionInput> = z.object({
  sessionId: z.string().optional(),
});

/** Schema for session endpoint input. */
export const SessionInputSchema: z.ZodType<SessionInput> = SessionInputZodSchema;

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
export const AuthSessionResponseSchema: z.ZodType<AuthSessionResponse> =
  AuthSessionResponseZodSchema;

const SessionResponseZodSchema: z.ZodType<SessionResponse> = z.object({
  authenticated: z.boolean(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for session endpoint responses. */
export const SessionResponseSchema: z.ZodType<SessionResponse> = SessionResponseZodSchema;

const AuthUserResponseZodSchema: z.ZodType<AuthUserResponse> = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  claims: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for public auth user responses. */
export const AuthUserResponseSchema: z.ZodType<AuthUserResponse> = AuthUserResponseZodSchema;

const MeResponseZodSchema: z.ZodType<MeResponse> = z.object({
  authenticated: z.boolean(),
  user: AuthUserResponseZodSchema.optional(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for me endpoint responses. */
export const MeResponseSchema: z.ZodType<MeResponse> = MeResponseZodSchema;

const authContractDefinition: Parameters<typeof implement>[0] = {
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
};

/** oRPC contract definition for the auth service API. */
export const authContract: Record<string, unknown> = authContractDefinition;

/** Factory exposed by oRPC for a defined auth contract error. */
export type AuthContractErrorFactory<TData> = (
  input: Readonly<{ message?: string; data: TData }>,
) => Error;

/** Defined oRPC errors shared by all v1 auth procedures. */
export type AuthContractErrors = Readonly<{
  UNAUTHORIZED: AuthContractErrorFactory<{ reason: string }>;
  AUTH_PROVIDER_ERROR: AuthContractErrorFactory<{ providerId?: string; reason: string }>;
  VALIDATION_ERROR: AuthContractErrorFactory<ValidationErrorData>;
}>;

/** Handler options supplied by a context-bound auth route. */
export type AuthRouteHandlerOptions<TContext, TInput> = Readonly<{
  input: TInput;
  errors: AuthContractErrors;
  context: TContext;
  path: readonly string[] | undefined;
  lastEventId?: string;
  signal?: AbortSignal;
}>;

/** Structural oRPC route handler exposed after binding an auth handler context. */
export type AuthRouteHandler<TContext, TInput, TOutput> = Readonly<{
  handler<THandlerOutput extends TOutput | Promise<TOutput>>(
    handler: (options: AuthRouteHandlerOptions<TContext, TInput>) => THandlerOutput,
  ): THandlerOutput;
}>;

/** Real inferred auth router returned after binding a service context. */
export type AuthRouter<TContext extends Record<PropertyKey, unknown> = Record<never, never>> =
  Readonly<{
    signin: AuthRouteHandler<TContext, SigninInput, SigninResponse>;
    callback: AuthRouteHandler<TContext, CallbackInput, CallbackResponse>;
    signout: AuthRouteHandler<TContext, SignoutInput, SignoutResponse>;
    session: AuthRouteHandler<TContext, SessionInput | undefined, SessionResponse>;
    me: AuthRouteHandler<TContext, undefined, MeResponse>;
  }>;

/** Context-binding contract wrapper for the v1 auth contract. */
export type AuthContractV1 = Readonly<
  { $context: <TContext extends Record<PropertyKey, unknown>>() => AuthRouter<TContext> }
>;

/** Versioned alias for the auth service API contract. */
export const authContractV1: AuthContractV1 = implement(
  authContractDefinition,
) as unknown as AuthContractV1;
