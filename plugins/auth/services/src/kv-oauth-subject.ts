/**
 * Declarative principal-subject configuration for the kv-oauth backend.
 *
 * `NETSCRIPT_AUTH_SUBJECT_SOURCE` (`id_token` | `userinfo`) and `NETSCRIPT_AUTH_SUBJECT_CLAIM`
 * select where the stable subject comes from. Unset keys fall back to the shipped preset named by
 * `NETSCRIPT_AUTH_PROVIDER_ID` (GitHub: userinfo `id`), then to the ID-token `sub`.
 *
 * @module
 */

import { type OAuthSubjectSource, presetSubjectSource } from '@netscript/auth-kv-oauth';

const SUBJECT_SOURCES = ['id_token', 'userinfo'] as const;

type SubjectSourceName = (typeof SUBJECT_SOURCES)[number];

/**
 * Resolve the kv-oauth subject source from the auth environment.
 *
 * Returns `undefined` only for the local-defaults stub, which keeps the per-sign-in session-id
 * subject. Every configured provider gets a source, so a provider without a stable identifier
 * refuses sign-in instead of minting a new subject on each one.
 */
export function resolveKvOAuthSubjectSource(
  env: Readonly<Record<string, string | undefined>>,
  usesLocalDefaults: boolean,
): OAuthSubjectSource | undefined {
  if (usesLocalDefaults) {
    return undefined;
  }
  const preset = presetSubjectSource(env.NETSCRIPT_AUTH_PROVIDER_ID ?? '');
  const source = parseSubjectSource(env.NETSCRIPT_AUTH_SUBJECT_SOURCE) ?? preset?.source ??
    'id_token';
  const claim = env.NETSCRIPT_AUTH_SUBJECT_CLAIM?.trim() ||
    (preset?.source === source ? preset.claim : 'sub');
  if (source === 'id_token') {
    return { source, claim };
  }
  return {
    source,
    claim,
    headers: preset?.source === 'userinfo' ? preset.headers : undefined,
  };
}

function parseSubjectSource(value: string | undefined): SubjectSourceName | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  if ((SUBJECT_SOURCES as readonly string[]).includes(trimmed)) {
    return trimmed as SubjectSourceName;
  }
  throw new Error(
    `NETSCRIPT_AUTH_SUBJECT_SOURCE must be one of ${SUBJECT_SOURCES.join(', ')}; got "${trimmed}".`,
  );
}
