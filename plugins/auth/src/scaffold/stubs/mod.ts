/**
 * Sample auth barrel emitted into a user workspace at `auth/mod.ts`.
 *
 * Unlike the worker/stream plugins, auth has no user-authored "leaf" sample: the active backend is
 * selected by environment (`NETSCRIPT_AUTH_BACKEND`) / appsettings — a CLI-owned config seam, not a
 * userland TypeScript file — and the auth service, routes, Prisma schema, and Aspire wiring all
 * resolve from the `@netscript/plugin-auth` dependency. The single thing a user owns and extends is
 * this barrel: a typed re-export of the published auth v1 API surface that their own application code
 * imports to build auth-aware handlers and UI.
 *
 * The file is shipped as a real, type-checked stub inside `@netscript/plugin-auth` and is copied
 * verbatim into the user's workspace by `plugin add auth`. The user owns and edits it; the scaffolder
 * never rewrites it after the first scaffold. It imports only the published runtime core
 * (`@netscript/plugin-auth-core/contracts/v1`) — never plugin internals — so it stays
 * dependency-direction clean and free of scaffold-time interpolation.
 *
 * @module
 */

export {
  AUTH_SESSION_STATES,
  AuthSessionResponseSchema,
  AuthUserResponseSchema,
} from '@netscript/plugin-auth-core/contracts/v1';
export type {
  AuthSessionResponse,
  AuthUserResponse,
  MeResponse,
  SessionResponse,
  SigninResponse,
  SignoutResponse,
} from '@netscript/plugin-auth-core/contracts/v1';
