/**
 * Server-side stream mirror exports for the auth plugin read model.
 *
 * @module
 */

export {
  emitOidcCompleted,
  emitSessionRevoked,
  emitSigninFailed,
  emitSigninStarted,
  emitTokenRefreshed,
  getAuthStreamProducer,
} from './producer.ts';
export type {
  AuthSessionRevokedInput,
  AuthSigninFailedInput,
  AuthSigninStartedInput,
  AuthStreamEmitOptions,
  AuthStreamEventSink,
  AuthStreamProducerPort,
} from './producer.ts';
export {
  AUTH_STREAM_EVENT_TYPES,
  AuthStreamEventSchema,
  authStreamSchema,
  AuthStreamSessionSchema,
} from './schema.ts';
export type {
  AuthSession,
  AuthSessionState,
  AuthStreamDefinition,
  AuthStreamEvent,
  AuthStreamSchema,
  AuthStreamSchemaResult,
  DurableStreamProducer,
  StateSchema,
  StreamProducerPort,
  StreamStateDefinition,
} from './producer.ts';
