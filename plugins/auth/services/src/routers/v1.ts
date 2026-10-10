/**
 * Auth router version 1.
 *
 * @module
 */

export { authV1, callback, me, revokeSession, session, signin, signout } from './v1-handlers.ts';
export type {
  AuthServiceContext,
  AuthServiceInitialContext,
  AuthServiceRequest,
  CallbackHandler,
  MeHandler,
  RevokeSessionHandler,
  SessionHandler,
  SigninHandler,
  SignoutHandler,
} from './v1-types.ts';
