/**
 * Static credential authenticator for API-key and bearer-token services.
 *
 * @example
 * ```ts
 * import { createStaticCredentialAuthenticator } from "@netscript/service/auth";
 *
 * const authenticator = createStaticCredentialAuthenticator({
 *   credentials: {
 *     "secret-token": {
 *       subject: "service:billing",
 *       scopes: ["orders:read"],
 *       roles: ["service"],
 *     },
 *   },
 * });
 * ```
 *
 * @module
 */

import type { AuthenticatorPort, AuthnRequest, AuthnResult, Principal } from './types.ts';

/**
 * Recursively clones a plain claim record and deep-freezes the clone so
 * authenticators never share mutable claim references across requests.
 *
 * @internal
 */
export function deepCloneAndFreezeRecord(
  value: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const seen = new WeakMap<object, unknown>();
  return cloneAndFreezeRecord(value, seen);
}

/**
 * Clones and freezes a string array (scopes or roles) so authenticators never
 * share mutable grant arrays across requests.
 *
 * @internal
 */
export function deepCloneAndFreezeStringArray(values: readonly string[]): readonly string[] {
  return Object.freeze([...values]);
}

/**
 * Deep-freezes nested objects and arrays in place without replacing object references.
 *
 * @internal
 */
export function deepFreezeInPlace(value: unknown): void {
  const seen = new WeakSet<object>();
  freezeInPlace(value, seen);
}

function cloneAndFreezeRecord(
  value: Readonly<Record<string, unknown>>,
  seen: WeakMap<object, unknown>,
): Readonly<Record<string, unknown>> {
  const proto = Object.getPrototypeOf(value);
  const cloned: Record<string, unknown> = proto === null ? Object.create(null) : {};
  seen.set(value, cloned);
  for (const key of Object.keys(value)) {
    Object.defineProperty(cloned, key, {
      value: cloneAndFreezeValue(Reflect.get(value, key), seen),
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }
  return Object.freeze(cloned);
}

function cloneAndFreezeValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value);
  }
  if (Array.isArray(value)) {
    const cloned: unknown[] = [];
    seen.set(value, cloned);
    for (const item of value) {
      cloned.push(cloneAndFreezeValue(item, seen));
    }
    return Object.freeze(cloned);
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) {
    const cloned: Record<string, unknown> = proto === null ? Object.create(null) : {};
    seen.set(value, cloned);
    for (const key of Object.keys(value)) {
      Object.defineProperty(cloned, key, {
        value: cloneAndFreezeValue(Reflect.get(value, key), seen),
        enumerable: true,
        writable: false,
        configurable: false,
      });
    }
    return Object.freeze(cloned);
  }
  if (!Object.isFrozen(value)) {
    Object.freeze(value);
  }
  return value;
}

function freezeInPlace(value: unknown, seen: WeakSet<object>): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeInPlace(item, seen);
    }
  } else {
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && 'value' in descriptor) {
        freezeInPlace(descriptor.value, seen);
      }
    }
  }
  if (!Object.isFrozen(value)) {
    Object.freeze(value);
  }
}

/** Principal attributes attached to a configured static credential. */
export interface StaticCredentialPrincipal {
  /** Stable subject identifier represented by this credential. */
  readonly subject: string;
  /** Granted scopes. */
  readonly scopes?: readonly string[];
  /** Granted roles. */
  readonly roles?: readonly string[];
  /** Opaque verified claims. */
  readonly claims?: Readonly<Record<string, unknown>>;
}

/** Options for creating a static credential authenticator. */
export interface StaticCredentialAuthenticatorOptions {
  /** Token-to-principal mapping accepted by the authenticator. */
  readonly credentials: Readonly<Record<string, StaticCredentialPrincipal>>;
  /** Scheme assigned to matched principals. Defaults to the presented credential scheme. */
  readonly scheme?: Principal['scheme'];
}

/** Compares two credential strings using Web Crypto digest equality. */
async function constantTimeCredentialEquals(
  candidate: string,
  stored: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [candidateDigest, storedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(stored)),
  ]);

  const left = new Uint8Array(candidateDigest);
  const right = new Uint8Array(storedDigest);
  let diff = left.length ^ right.length;
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return diff === 0;
}

/** Creates an authenticator that accepts configured bearer tokens or API keys. */
export function createStaticCredentialAuthenticator(
  options: StaticCredentialAuthenticatorOptions,
): AuthenticatorPort {
  const entries = Object.entries(options.credentials);

  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      const presented = readPresentedCredential(request);
      if (!presented) {
        return { ok: false, reason: 'missing-credential' };
      }

      let matched: StaticCredentialPrincipal | undefined;
      for (const [token, principal] of entries) {
        if (await constantTimeCredentialEquals(presented.token, token)) {
          matched = principal;
        }
      }

      if (!matched) {
        return { ok: false, reason: 'invalid-credential' };
      }

      return {
        ok: true,
        principal: Object.freeze({
          subject: matched.subject,
          scopes: deepCloneAndFreezeStringArray(matched.scopes ?? []),
          roles: deepCloneAndFreezeStringArray(matched.roles ?? []),
          scheme: options.scheme ?? presented.scheme,
          claims: deepCloneAndFreezeRecord(matched.claims ?? {}),
        }),
      };
    },
  };
}

function readPresentedCredential(
  request: AuthnRequest,
): { readonly scheme: 'api-key' | 'bearer'; readonly token: string } | undefined {
  const authorization = request.header('authorization');
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    if (match?.[1]?.trim()) {
      return { scheme: 'bearer', token: match[1].trim() };
    }
    return undefined;
  }

  const apiKey = request.header('x-api-key')?.trim();
  if (apiKey) {
    return { scheme: 'api-key', token: apiKey };
  }

  return undefined;
}
