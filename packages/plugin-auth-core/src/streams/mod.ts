/**
 * Durable stream schemas for auth session projections and auth events.
 *
 * @module
 */

import {
  defineStreamSchema,
  type StateSchema,
  type StreamStateDefinition,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';
import type { AuthSession } from '../domain/mod.ts';
import { AUTH_SESSION_STATES } from '../domain/mod.ts';

export type { CollectionDefinition, CollectionEventHelpers } from '@netscript/plugin-streams-core';
export type { StateSchema, StreamStateDefinition };

/** Auth event names emitted by the auth plugin stream producer. */
export const AUTH_STREAM_EVENT_TYPES: readonly [
  'auth.signin.started',
  'auth.signin.failed',
  'auth.token.refreshed',
  'auth.session.revoked',
  'auth.oidc.completed',
] = [
  'auth.signin.started',
  'auth.signin.failed',
  'auth.token.refreshed',
  'auth.session.revoked',
  'auth.oidc.completed',
];

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

const AuthSessionZodSchema: z.ZodType<AuthSession> = z.object({
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

/** Schema for auth session stream entities. */
export const AuthStreamSessionSchema: AuthStreamSchema<AuthSession> = AuthSessionZodSchema;

const AuthStreamEventZodSchema: z.ZodType<AuthStreamEvent> = z.object({
  type: z.enum(AUTH_STREAM_EVENT_TYPES),
  timestamp: z.string().datetime(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  providerId: z.string().optional(),
  subject: z.string().optional(),
  reason: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for auth stream event payloads. */
export const AuthStreamEventSchema: AuthStreamSchema<AuthStreamEvent> = AuthStreamEventZodSchema;

/** Durable stream schema definition for auth session entities. */
export type AuthStreamDefinition = Readonly<{
  authSession: {
    readonly schema: typeof AuthStreamSessionSchema;
    readonly type: 'auth-session';
    readonly primaryKey: 'id';
  };
}>;

/** Entity-based durable stream schema for auth sessions. */
export const authStreamSchema: StateSchema<AuthStreamDefinition> = defineStreamSchema({
  authSession: {
    schema: AuthSessionZodSchema,
    type: 'auth-session',
    primaryKey: 'id',
  },
}) as unknown as StateSchema<AuthStreamDefinition>;
