/**
 * Auth telemetry names and finite audit-safe values.
 *
 * @example
 * ```ts
 * import { AuthAttributes, AuthSpanNames } from "@netscript/plugin-auth-core/telemetry";
 *
 * const spanName = AuthSpanNames.SIGNIN;
 * const backendAttribute = AuthAttributes.BACKEND;
 * console.log(spanName, backendAttribute);
 * ```
 *
 * @module
 */

/** Auth span names emitted by auth service operations. */
export type AuthSpanNamesMap = Readonly<{
  SIGNIN: 'auth.signin';
  CALLBACK: 'auth.callback';
  SIGNOUT: 'auth.signout';
  SESSION: 'auth.session';
  ME: 'auth.me';
}>;

/** Canonical auth span names. */
export const AuthSpanNames: AuthSpanNamesMap = Object.freeze({
  SIGNIN: 'auth.signin',
  CALLBACK: 'auth.callback',
  SIGNOUT: 'auth.signout',
  SESSION: 'auth.session',
  ME: 'auth.me',
});

/** Auth attribute keys emitted on spans and audit events. */
export type AuthAttributesMap = Readonly<{
  PROVIDER: 'auth.provider';
  BACKEND: 'auth.backend';
  METHOD: 'auth.method';
  SUBJECT_HASH: 'auth.subject_hash';
  SESSION_ID: 'auth.session_id';
  OUTCOME: 'auth.outcome';
  ERROR_CODE: 'auth.error_code';
  PRINCIPAL_SCOPES_COUNT: 'auth.principal.scopes_count';
  PRINCIPAL_ROLES_COUNT: 'auth.principal.roles_count';
  PROVIDER_ISSUER: 'auth.provider.iss';
  MFA_STATE: 'auth.mfa.state';
}>;

/** Canonical auth attribute keys. */
export const AuthAttributes: AuthAttributesMap = Object.freeze({
  PROVIDER: 'auth.provider',
  BACKEND: 'auth.backend',
  METHOD: 'auth.method',
  SUBJECT_HASH: 'auth.subject_hash',
  SESSION_ID: 'auth.session_id',
  OUTCOME: 'auth.outcome',
  ERROR_CODE: 'auth.error_code',
  PRINCIPAL_SCOPES_COUNT: 'auth.principal.scopes_count',
  PRINCIPAL_ROLES_COUNT: 'auth.principal.roles_count',
  PROVIDER_ISSUER: 'auth.provider.iss',
  MFA_STATE: 'auth.mfa.state',
});

/** Auth span event names used for audit breadcrumbs. */
export type AuthSpanEventsMap = Readonly<{
  AUDIT_LOG: 'auth.audit.log';
  PRINCIPAL_RESOLVED: 'auth.principal.resolved';
  SESSION_ISSUED: 'auth.session.issued';
  SESSION_REVOKED: 'auth.session.revoked';
}>;

/** Canonical auth span event names. */
export const AuthSpanEvents: AuthSpanEventsMap = Object.freeze({
  AUDIT_LOG: 'auth.audit.log',
  PRINCIPAL_RESOLVED: 'auth.principal.resolved',
  SESSION_ISSUED: 'auth.session.issued',
  SESSION_REVOKED: 'auth.session.revoked',
});

/** Canonical auth operation outcomes. */
export type AuthOutcomeMap = Readonly<{
  SUCCESS: 'success';
  UNAUTHENTICATED: 'unauthenticated';
  FAILED_BAD_CREDENTIALS: 'failed_bad_credentials';
  FAILED_SESSION_EXPIRED: 'failed_session_expired';
  FAILED_PROVIDER_ERROR: 'failed_provider_error';
  FAILED_CALLBACK_INVALID: 'failed_callback_invalid';
}>;

/** Canonical auth operation outcome values. */
export const AuthOutcome: AuthOutcomeMap = Object.freeze({
  SUCCESS: 'success',
  UNAUTHENTICATED: 'unauthenticated',
  FAILED_BAD_CREDENTIALS: 'failed_bad_credentials',
  FAILED_SESSION_EXPIRED: 'failed_session_expired',
  FAILED_PROVIDER_ERROR: 'failed_provider_error',
  FAILED_CALLBACK_INVALID: 'failed_callback_invalid',
});

/** Canonical auth error codes attached at the service seam. */
export type AuthErrorCodeMap = Readonly<{
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS';
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED';
  PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR';
  CALLBACK_INVALID: 'AUTH_CALLBACK_INVALID';
}>;

/** Machine-readable auth error codes. */
export const AuthErrorCode: AuthErrorCodeMap = Object.freeze({
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
  CALLBACK_INVALID: 'AUTH_CALLBACK_INVALID',
});

/** Literal union of supported auth span names. */
export type AuthSpanName = (typeof AuthSpanNames)[keyof typeof AuthSpanNames];
/** Literal union of supported auth telemetry attribute keys. */
export type AuthAttributeName = (typeof AuthAttributes)[keyof typeof AuthAttributes];
/** Literal union of supported auth span event names. */
export type AuthSpanEventName = (typeof AuthSpanEvents)[keyof typeof AuthSpanEvents];
/** Literal union of supported auth operation outcomes. */
export type AuthOutcomeValue = (typeof AuthOutcome)[keyof typeof AuthOutcome];
/** Literal union of supported auth error codes. */
export type AuthErrorCodeValue = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];
