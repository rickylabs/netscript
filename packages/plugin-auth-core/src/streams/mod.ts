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
import { AuthSessionSchema } from '../domain/mod.ts';

export type { CollectionDefinition, CollectionEventHelpers } from '@netscript/plugin-streams-core';
export { AUTH_SESSION_STATES, AuthSessionSchema } from '../domain/mod.ts';
export type { AuthSession, AuthSessionState } from '../domain/mod.ts';
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

/** Auth stream event payload shared by the plugin service and subscribers. */
export type AuthStreamEvent = Readonly<{
  type: AuthStreamEventType;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  providerId?: string;
  subject?: string;
  reason?: string;
  traceparent?: string;
  tracestate?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Schema for auth session stream entities. */
export const AuthStreamSessionSchema: typeof AuthSessionSchema = AuthSessionSchema;

const AuthStreamEventZodSchema: z.ZodType<AuthStreamEvent> = z.object({
  type: z.enum(AUTH_STREAM_EVENT_TYPES),
  timestamp: z.string().datetime(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  providerId: z.string().optional(),
  subject: z.string().optional(),
  reason: z.string().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for auth stream event payloads. */
export const AuthStreamEventSchema: z.ZodType<AuthStreamEvent> = AuthStreamEventZodSchema;

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
    schema: AuthStreamSessionSchema,
    type: 'auth-session',
    primaryKey: 'id',
  },
});
