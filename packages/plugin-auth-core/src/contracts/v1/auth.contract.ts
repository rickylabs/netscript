import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractProcedureBuilderWithInputOutput,
  ErrorMap,
  MergedErrorMap,
} from '@orpc/contract';
import { implement } from '@orpc/server';
import { z } from 'zod';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  BASE_PLUGIN_ERRORS,
  type BasePluginContract,
  type BasePluginDescribeRoute,
} from '@netscript/plugin/contract-base';
import { AUTH_SESSION_STATES } from '../../domain/mod.ts';

export { AUTH_SESSION_STATES } from '../../domain/mod.ts';

/** Input accepted by the signin endpoint. */
export type SigninInput = Readonly<{
  providerId?: string;
  redirectTo?: string;
  loginHint?: string;
  scopes?: string[];
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
  scopes: string[];
  roles: string[];
  claims: Record<string, unknown>;
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
  claims?: Record<string, unknown>;
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

/**
 * Public, capability-document shape returned by the mandatory `describe` route.
 */
export interface AuthCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-auth`. */
  readonly pluginName: string;
  /** Contract version identifiers served by the plugin. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin. */
  readonly routeGroups: readonly string[];
  /** Capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}

// --- Auth-specific error vocabulary ------------------------------------------
// Auth converges onto the shared plugin error vocabulary (NOT_FOUND,
// VALIDATION_ERROR, INTERNAL) AND keeps its plugin-specific errors
// (UNAUTHORIZED, AUTH_PROVIDER_ERROR). The auth-specific VALIDATION_ERROR
// carries the same form/field shape as the base entry; spelling it last means
// the merged map keeps auth's 422 spelling. Like `BASE_PLUGIN_ERRORS`, each
// `data` field is a plain Zod schema (a value, not a builder fragment), so the
// merged map crosses into the oRPC contract builder via the single sanctioned
// centralized-contract boundary cast.

const validationErrorDataSchema: z.ZodObject<{
  formErrors: z.ZodArray<z.ZodString>;
  fieldErrors: z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodArray<z.ZodString>>>;
}> = z.object({
  formErrors: z.array(z.string()),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
});

/** Auth-specific oRPC error entries merged onto the base plugin vocabulary. */
const AUTH_SPECIFIC_ERRORS: Readonly<{
  UNAUTHORIZED: { status: number; message: string; data: z.ZodType<{ reason: string }> };
  AUTH_PROVIDER_ERROR: {
    status: number;
    message: string;
    data: z.ZodType<{ providerId?: string; reason: string }>;
  };
  VALIDATION_ERROR: { status: number; message: string; data: typeof validationErrorDataSchema };
}> = {
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
    data: validationErrorDataSchema,
  },
};

const baseContract: ReturnType<typeof oc.errors> = oc.errors(
  { ...BASE_PLUGIN_ERRORS, ...AUTH_SPECIFIC_ERRORS } as unknown as Parameters<typeof oc.errors>[0],
);

/**
 * Error map carried by every route built from {@link baseContract}.
 *
 * `baseContract` applies `.errors(...)`, so each route's error map is the merged
 * vocabulary onto an empty map.
 */
type BaseErrors = MergedErrorMap<Record<never, never>, ErrorMap>;

/**
 * Precise type of a route built via `baseContract.route(...).input(...).output(...)`.
 *
 * Parameterized on the input and output schemas so `typeof <inputConst>` and
 * `typeof <outputConst>` (each an explicitly-annotated Zod schema) flow through
 * to {@link implement}, keeping every handler's input/output precisely typed.
 */
type Route<TIn extends AnySchema, TOut extends AnySchema> = ContractProcedureBuilderWithInputOutput<
  TIn,
  TOut,
  BaseErrors,
  Record<never, never>
>;

// --- Route input/output schemas ----------------------------------------------
// Every inline `z.object(...)` is named and explicitly annotated with concrete
// Zod constructor types so its `typeof` can feed the `Route<...>` alias under
// `--isolatedDeclarations` and never upcasts to `z.ZodType<T>` (which erases
// `_output` and reopens the soundness hole).

const SigninInputZodSchema: z.ZodObject<{
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
export const SigninInputSchema: z.ZodType<SigninInput> = SigninInputZodSchema;

const SigninResponseZodSchema: z.ZodObject<{
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
export const SigninResponseSchema: z.ZodType<SigninResponse> = SigninResponseZodSchema;

const CallbackInputZodSchema: z.ZodObject<{
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
export const CallbackInputSchema: z.ZodType<CallbackInput> = CallbackInputZodSchema;

const CallbackResponseZodSchema: z.ZodObject<{
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
export const CallbackResponseSchema: z.ZodType<CallbackResponse> = CallbackResponseZodSchema;

const SignoutInputZodSchema: z.ZodObject<{
  sessionId: z.ZodOptional<z.ZodString>;
  everywhere: z.ZodOptional<z.ZodBoolean>;
  redirectTo: z.ZodOptional<z.ZodString>;
}> = z.object({
  sessionId: z.string().optional(),
  everywhere: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint input. */
export const SignoutInputSchema: z.ZodType<SignoutInput> = SignoutInputZodSchema;

const SignoutResponseZodSchema: z.ZodObject<{
  signedOut: z.ZodBoolean;
  sessionId: z.ZodOptional<z.ZodString>;
  redirectTo: z.ZodOptional<z.ZodString>;
}> = z.object({
  signedOut: z.boolean(),
  sessionId: z.string().optional(),
  redirectTo: z.string().optional(),
});

/** Schema for signout endpoint responses. */
export const SignoutResponseSchema: z.ZodType<SignoutResponse> = SignoutResponseZodSchema;

const SessionInputZodSchema: z.ZodObject<{
  sessionId: z.ZodOptional<z.ZodString>;
}> = z.object({
  sessionId: z.string().optional(),
});

/** Schema for session endpoint input. */
export const SessionInputSchema: z.ZodType<SessionInput> = SessionInputZodSchema;

const sessionRouteInput: z.ZodOptional<typeof SessionInputZodSchema> = SessionInputZodSchema
  .optional();

const meRouteInput: z.ZodOptional<z.ZodUndefined> = z.undefined().optional();

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
export const AuthSessionResponseSchema: z.ZodType<AuthSessionResponse> =
  AuthSessionResponseZodSchema;

const SessionResponseZodSchema: z.ZodObject<{
  authenticated: z.ZodBoolean;
  session: z.ZodOptional<typeof AuthSessionResponseZodSchema>;
}> = z.object({
  authenticated: z.boolean(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for session endpoint responses. */
export const SessionResponseSchema: z.ZodType<SessionResponse> = SessionResponseZodSchema;

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
export const AuthUserResponseSchema: z.ZodType<AuthUserResponse> = AuthUserResponseZodSchema;

const MeResponseZodSchema: z.ZodObject<{
  authenticated: z.ZodBoolean;
  user: z.ZodOptional<typeof AuthUserResponseZodSchema>;
  session: z.ZodOptional<typeof AuthSessionResponseZodSchema>;
}> = z.object({
  authenticated: z.boolean(),
  user: AuthUserResponseZodSchema.optional(),
  session: AuthSessionResponseZodSchema.optional(),
});

/** Schema for me endpoint responses. */
export const MeResponseSchema: z.ZodType<MeResponse> = MeResponseZodSchema;

/**
 * Explicit, precise type of the auth v1 contract definition.
 *
 * Every member is a real oRPC contract procedure typed against its input and
 * output Zod schemas. The interface `extends BasePluginContract`, so the
 * mandatory `describe` route is enforced by the seam and any additional route
 * must be a real contract router (the `[route: string]: AnyContractRouter`
 * constraint inherited from {@link BasePluginContract}). Spelling the type
 * explicitly is required by `--isolatedDeclarations` (the JSR slow-types bar);
 * because each member derives from a named, annotated schema via `typeof`, the
 * contract type can never silently drift from the schemas.
 */
interface AuthContractDefinitionShape extends BasePluginContract {
  readonly describe: BasePluginDescribeRoute;
  readonly signin: Route<typeof SigninInputZodSchema, typeof SigninResponseZodSchema>;
  readonly callback: Route<typeof CallbackInputZodSchema, typeof CallbackResponseZodSchema>;
  readonly signout: Route<typeof SignoutInputZodSchema, typeof SignoutResponseZodSchema>;
  readonly session: Route<typeof sessionRouteInput, typeof SessionResponseZodSchema>;
  readonly me: Route<typeof meRouteInput, typeof MeResponseZodSchema>;
}

/**
 * The auth v1 contract definition object.
 *
 * Spreads the mandatory base seam `describe` route and layers the 5
 * plugin-specific routes. The explicit {@link AuthContractDefinitionShape}
 * annotation makes the precise contract type available to
 * `--isolatedDeclarations` without erasing it; because the base seam `describe`
 * is a real oRPC `ContractProcedure` (no phantom marker) and every route is
 * precisely typed, this object is handed to `implement()` WITHOUT any erasure
 * cast and every `router.<route>.handler(...)` is checked against the
 * contract's IO.
 */
const authContractDefinition: AuthContractDefinitionShape = {
  // Mandatory base seam route: every feature plugin contract carries the typed
  // `describe` route (GET /describe) returning a `PluginCapabilities` document.
  ...BASE_PLUGIN_CONTRACT_ROUTES,

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
    .input(sessionRouteInput)
    .output(SessionResponseZodSchema),

  me: baseContract
    .route({ method: 'GET', path: '/me' })
    .input(meRouteInput)
    .output(MeResponseZodSchema),
};

/**
 * The fully-typed auth v1 contract definition type.
 *
 * Re-exported so {@link AuthContract} and {@link AuthContractV1} derive from it
 * instead of hand-authoring a parallel structural shape.
 */
export type AuthContractDefinition = AuthContractDefinitionShape;

/**
 * Auth service contract definition for client generation.
 *
 * Carries the real, precise oRPC contract router type — no erasure cast.
 */
export const authContract: AuthContractDefinition = authContractDefinition;

/**
 * The implemented (context-bindable) auth v1 contract.
 *
 * `implement(definition)` precisely types the implementer against the contract,
 * so every `router.<route>.handler(...)` is checked for input/output/error
 * conformance. The type is the real `implement` return type — no erasure cast.
 */
export const authContractV1: ReturnType<typeof implement<AuthContractDefinition>> = implement(
  authContractDefinition,
);

/**
 * Public contract shape for auth service clients.
 *
 * Derived directly from {@link AuthContractDefinition} — the real,
 * fully-inferred oRPC contract router. Carries the precise per-route
 * input/output/error types, so client generation and `implement(...)` stay
 * sound and can never drift from the Zod schemas.
 */
export type AuthContract = AuthContractDefinition;

/**
 * Context-binding implementer for the v1 auth contract.
 *
 * Derived from the {@link authContractV1} value (`implement(definition)`), so
 * `AuthContractV1['$context']<Ctx>()` returns the precisely-typed router
 * implementer whose `<route>.handler(...)` calls are checked against the
 * contract IO.
 */
export type AuthContractV1 = typeof authContractV1;

/**
 * The context-bound auth router implementer.
 *
 * Derived from {@link AuthContractV1} by binding an opaque request context, so
 * each `AuthRouter[route]` is the real oRPC procedure implementer. Connectors
 * bind their own concrete context via `authContractV1.$context<TheirContext>()`.
 */
export type AuthRouter = ReturnType<
  typeof authContractV1.$context<Record<never, never>>
>;
