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
  startAuthStreamMirror,
} from './producer.ts';
export type {
  AuthSessionRevokedInput,
  AuthSigninFailedInput,
  AuthSigninStartedInput,
  AuthStreamEmitOptions,
  AuthStreamEventSink,
  AuthStreamMirrorOptions,
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
  AuthStreamDefinition,
  AuthStreamEvent,
  DurableStreamProducer,
  StateSchema,
  StreamProducerPort,
  StreamStateDefinition,
} from './producer.ts';
