/**
 * Auth router version 1.
 *
 * @module
 */

export { authV1, callback, me, session, signin, signout } from './v1-handlers.ts';
export type {
  AuthServiceContext,
  AuthServiceInitialContext,
  AuthServiceRequest,
  CallbackHandler,
  MeHandler,
  SessionHandler,
  SigninHandler,
  SignoutHandler,
} from './v1-types.ts';
