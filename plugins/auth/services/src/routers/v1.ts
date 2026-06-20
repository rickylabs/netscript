/**
 * Auth router version 1.
 *
 * @module
 */

export { authV1, callback, me, session, signin, signout } from './v1-handlers.ts';
export type {
  AuthServiceContext,
  AuthServiceRequest,
  CallbackHandler,
  InteractiveAuthBackend,
  MeHandler,
  SessionHandler,
  SigninHandler,
  SignoutHandler,
} from './v1-types.ts';
