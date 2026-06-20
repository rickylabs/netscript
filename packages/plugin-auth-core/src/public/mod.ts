/**
 * Curated root exports for `@netscript/plugin-auth-core`.
 *
 * @module
 */

export {
  AccountSchema,
  AUTH_ACCOUNT_STATES,
  AUTH_SESSION_STATES,
  AuthSessionSchema,
  AuthUserSchema,
} from '../domain/mod.ts';
export type {
  Account,
  AccountState,
  AuthDomainSchema,
  AuthDomainSchemaResult,
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthSession,
  AuthSessionPrincipalMapping,
  AuthSessionState,
  AuthUser,
  Principal,
} from '../domain/mod.ts';
export { DEFAULT_AUTH_BACKEND_NAME, resolveBackend } from '../ports/mod.ts';
export type {
  AuthBackendPort,
  AuthBackendRegistry,
  AuthPrincipalMapperPort,
  AuthProviderCapability,
  AuthProviderDescriptor,
  AuthProviderRegistryPort,
  AuthSessionCreateInput,
  AuthSessionCryptoPort,
  AuthSessionLookup,
  AuthSessionStorePort,
  ResolvedAuthBackendRegistry,
} from '../ports/mod.ts';
export {
  AuthConfigSchema,
  AuthProviderConfigSchema,
  AuthSessionPolicySchema,
} from '../config/mod.ts';
export type {
  AuthConfig,
  AuthConfigInput,
  AuthConfigSchemaLike,
  AuthConfigSchemaResult,
  AuthProviderConfig,
  AuthSessionPolicy,
} from '../config/mod.ts';
export { authContract, authContractV1 } from '../contracts/v1/mod.ts';
export type {
  AuthContractDefinition,
  AuthContractProcedureLike,
  AuthContractSchema,
  AuthContractSchemaResult,
  AuthSessionResponse,
  AuthUserResponse,
  CallbackInput,
  CallbackResponse,
  MeResponse,
  SessionInput,
  SessionResponse,
  SigninInput,
  SigninResponse,
  SignoutInput,
  SignoutResponse,
  StandardSchemaLike,
} from '../contracts/v1/mod.ts';
export { AUTH_PRESET_KINDS, createAuthPresetRegistry } from '../presets/mod.ts';
export type {
  AuthBackendPreset,
  AuthPresetDefinition,
  AuthPresetKind,
  AuthPresetRegistry,
  AuthProviderPreset,
} from '../presets/mod.ts';
export {
  AUTH_STREAM_EVENT_TYPES,
  AuthStreamEventSchema,
  authStreamSchema,
  AuthStreamSessionSchema,
} from '../streams/mod.ts';
export type {
  AuthStreamDefinition,
  AuthStreamEvent,
  AuthStreamEventType,
  AuthStreamSchema,
  AuthStreamSchemaResult,
  CollectionDefinition,
  CollectionEventHelpers,
  StateSchema,
  StreamStateDefinition,
} from '../streams/mod.ts';
