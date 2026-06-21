/**
 * Audit-safe auth principal redaction helpers.
 *
 * @example
 * ```ts
 * import { hashSubject } from "@netscript/plugin-auth-core/telemetry";
 *
 * const subjectHash = await hashSubject("user_123", "deployment-owned-salt");
 * console.log(subjectHash.length);
 * ```
 *
 * @module
 */

import type { Principal } from '../domain/mod.ts';

const TOKEN_FIELD_FRAGMENTS: readonly string[] = [
  'token',
  'secret',
  'credential',
  'password',
  'apikey',
  'api_key',
  'authorization',
  'sessionid',
  'accesstoken',
  'refreshtoken',
  'jwttoken',
];

const textEncoder = new TextEncoder();

/** Audit-safe principal projection with hashed subject and redacted claims. */
export type RedactedAuthPrincipal = Readonly<{
  subjectHash: string;
  scheme: Principal['scheme'];
  scopesCount: number;
  rolesCount: number;
  claims: Readonly<Record<string, unknown>>;
}>;

/**
 * Hash an auth subject with a deployment-owned salt using HMAC-SHA-256.
 *
 * @param subject - Raw subject identifier to protect.
 * @param salt - Deployment-owned salt or secret, never derived from the subject.
 * @returns Stable lowercase hex HMAC for same subject and salt.
 */
export async function hashSubject(subject: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(subject));
  return toHex(new Uint8Array(signature));
}

/**
 * Return an audit-safe projection of a service principal.
 *
 * @param principal - Auth principal returned by a backend.
 * @param salt - Deployment-owned hash salt.
 * @returns Principal metadata without a raw subject or token-bearing claims.
 */
export async function redactAuthPrincipal(
  principal: Principal,
  salt: string,
): Promise<RedactedAuthPrincipal> {
  return {
    subjectHash: await hashSubject(principal.subject, salt),
    scheme: principal.scheme,
    scopesCount: principal.scopes.length,
    rolesCount: principal.roles.length,
    claims: redactClaims(principal.claims),
  };
}

function redactClaims(
  claims: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(claims)) {
    if (isSensitiveClaimKey(key)) {
      continue;
    }
    redacted[key] = redactClaimValue(value);
  }
  return Object.freeze(redacted);
}

function redactClaimValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => redactClaimValue(entry)));
  }
  if (isPlainRecord(value)) {
    return redactClaims(value);
  }
  return value;
}

function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSensitiveClaimKey(key: string): boolean {
  const normalized = key.replaceAll(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return TOKEN_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
