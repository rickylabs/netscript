/**
 * Subject-source policy: validation, the default, and the shipped preset table.
 *
 * @module
 */

import { KvOAuthError } from './errors.ts';

/**
 * Where the flow reads a stable principal subject from after a successful callback.
 *
 * - `id_token`: the named claim of the validated ID token, used verbatim (OIDC `sub`).
 * - `userinfo`: the named field of the provider's userinfo response, namespaced by provider id
 *   (`github:<id>`). `claim` may be a dot path (`data.id`). `headers` are sent with the request.
 *
 * Sign-in is refused with `subject_missing` when the configured value is absent. There is no
 * session-id fallback: a subject must be the same on every sign-in.
 */
export type OAuthSubjectSource =
  | Readonly<{ source: 'id_token'; claim: string }>
  | Readonly<{
    source: 'userinfo';
    claim: string;
    headers?: Readonly<Record<string, string>>;
  }>;

/** Subject source used when a provider declares none: the validated ID-token `sub`. */
export const DEFAULT_SUBJECT_SOURCE: OAuthSubjectSource = Object.freeze({
  source: 'id_token',
  claim: 'sub',
});

const userInfoId = (
  claim = 'id',
  headers: Readonly<Record<string, string>> = {},
): OAuthSubjectSource =>
  Object.freeze({ source: 'userinfo', claim, headers: Object.freeze(headers) });

const PRESET_PROVIDER_POLICIES: Readonly<
  Record<string, Readonly<{ kind: 'oauth' | 'oidc'; subject: OAuthSubjectSource }>>
> = Object.freeze({
  // GitHub has no `sub`: the numeric `id` is immutable, `login` is renamable. The REST API
  // rejects requests without a User-Agent.
  github: { kind: 'oauth', subject: userInfoId('id', { 'user-agent': 'netscript-auth-kv-oauth' }) },
  google: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  gitlab: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  discord: { kind: 'oauth', subject: userInfoId() },
  slack: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  spotify: { kind: 'oauth', subject: userInfoId() },
  facebook: { kind: 'oauth', subject: userInfoId() },
  twitter: { kind: 'oauth', subject: userInfoId('data.id') },
  auth0: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  okta: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  'aws-cognito': { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  'azure-ad': { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  logto: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
  clerk: { kind: 'oidc', subject: DEFAULT_SUBJECT_SOURCE },
});
/**
 * Returns the stable subject source a shipped preset uses, keyed by preset provider id.
 *
 * @example
 * ```ts
 * import { presetSubjectSource } from "@netscript/auth-kv-oauth/providers";
 *
 * presetSubjectSource("github"); // { source: "userinfo", claim: "id", headers: { ... } }
 * ```
 */
export function presetSubjectSource(providerId: string): OAuthSubjectSource | undefined {
  return Object.hasOwn(PRESET_PROVIDER_POLICIES, providerId)
    ? PRESET_PROVIDER_POLICIES[providerId]?.subject
    : undefined;
}

/**
 * Return the protocol kind declared by a shipped preset, or undefined for a custom provider.
 *
 * OAuth presets use explicit endpoints: their issuer must not trigger OIDC discovery.
 *
 * @example
 * ```ts
 * import { presetProviderKind } from "@netscript/auth-kv-oauth/providers";
 *
 * const kind = presetProviderKind("github"); // "oauth"
 * ```
 */
export function presetProviderKind(providerId: string): 'oauth' | 'oidc' | undefined {
  return Object.hasOwn(PRESET_PROVIDER_POLICIES, providerId)
    ? PRESET_PROVIDER_POLICIES[providerId]?.kind
    : undefined;
}

/**
 * Validates a provider's subject source and applies {@link DEFAULT_SUBJECT_SOURCE} when absent.
 *
 * Invalid sources fail at definition time with `configuration_error`, never at sign-in.
 */
export function normalizeSubjectSource(
  providerId: string,
  subject: OAuthSubjectSource | undefined,
  userInfoEndpoint: string | undefined,
): OAuthSubjectSource {
  if (subject === undefined) {
    return DEFAULT_SUBJECT_SOURCE;
  }
  if (subject.claim.trim() === '') {
    throw new KvOAuthError(
      'configuration_error',
      `Provider ${providerId} subject source requires a claim name.`,
    );
  }
  if (subject.source === 'id_token') {
    return Object.freeze({ source: subject.source, claim: subject.claim });
  }
  if (subject.source !== 'userinfo') {
    throw new KvOAuthError(
      'configuration_error',
      `Provider ${providerId} subject source must be "id_token" or "userinfo".`,
    );
  }
  if (userInfoEndpoint === undefined) {
    throw new KvOAuthError(
      'configuration_error',
      `Provider ${providerId} reads its subject from userinfo but has no userInfoEndpoint.`,
    );
  }
  return Object.freeze({
    source: subject.source,
    claim: subject.claim,
    headers: Object.freeze({ ...(subject.headers ?? {}) }),
  });
}
