/**
 * Browser-safe stream exports for the auth plugin.
 *
 * @module
 */

export { type AuthSession, type AuthStreamDB, createAuthStreamDB } from './factory.ts';
export {
  AUTH_STREAM_EVENT_TYPES,
  AuthStreamEventSchema,
  authStreamSchema,
  AuthStreamSessionSchema,
} from './schema.ts';
export type {
  AuthStreamDefinition,
  AuthStreamEvent,
  AuthStreamEventType,
  CollectionDefinition,
  CollectionEventHelpers,
  StateSchema,
  StreamStateDefinition,
} from './schema.ts';
