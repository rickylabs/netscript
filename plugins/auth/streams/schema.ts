/**
 * Durable stream schemas for auth session projections and typed lifecycle payloads.
 *
 * @module
 */

import type { StateSchema, StreamStateDefinition } from '@netscript/plugin-streams-core';
import {
  AUTH_STREAM_EVENT_TYPES as CORE_AUTH_STREAM_EVENT_TYPES,
  AuthStreamEventSchema as CoreAuthStreamEventSchema,
  authStreamSchema as coreAuthStreamSchema,
  AuthStreamSessionSchema as CoreAuthStreamSessionSchema,
} from '@netscript/plugin-auth-core/streams';

export type { CollectionDefinition, CollectionEventHelpers } from '@netscript/plugin-streams-core';
export type { StateSchema, StreamStateDefinition };

/** Auth session states projected into the `authSession` stream entity. */
export type AuthSessionState = 'active' | 'expired' | 'revoked';

/** Auth session entity projected into the durable stream read model. */
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

/** Auth event names emitted by the auth plugin stream producer. */
export const AUTH_STREAM_EVENT_TYPES: readonly [
  'auth.signin.started',
  'auth.signin.failed',
  'auth.token.refreshed',
  'auth.session.revoked',
  'auth.oidc.completed',
] = CORE_AUTH_STREAM_EVENT_TYPES;

/** Auth event name emitted by the auth plugin stream producer. */
export type AuthStreamEventType = (typeof AUTH_STREAM_EVENT_TYPES)[number];

/** Result returned by stream schema validation. */
export type AuthStreamSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for auth stream validation. */
export interface AuthStreamSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): AuthStreamSchemaResult<TOutput>;
}

/** Auth stream event payload shared by the plugin service and subscribers. */
export type AuthStreamEvent = Readonly<{
  type: AuthStreamEventType;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  providerId?: string;
  subject?: string;
  reason?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Schema for auth session stream entities. */
export const AuthStreamSessionSchema: AuthStreamSchema<AuthSession> =
  CoreAuthStreamSessionSchema as unknown as AuthStreamSchema<AuthSession>;

/** Schema for auth stream event payloads. */
export const AuthStreamEventSchema: AuthStreamSchema<AuthStreamEvent> =
  CoreAuthStreamEventSchema as unknown as AuthStreamSchema<AuthStreamEvent>;

/** Durable stream schema definition for auth session entities. */
export type AuthStreamDefinition = Readonly<{
  authSession: {
    readonly schema: typeof AuthStreamSessionSchema;
    readonly type: 'auth-session';
    readonly primaryKey: 'id';
  };
}>;

/** Entity-based durable stream schema for auth sessions. */
export const authStreamSchema: StateSchema<AuthStreamDefinition> =
  coreAuthStreamSchema as unknown as StateSchema<AuthStreamDefinition>;
