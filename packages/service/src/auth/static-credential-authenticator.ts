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
export async function constantTimeCredentialEquals(
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
        principal: {
          subject: matched.subject,
          scopes: matched.scopes ?? [],
          roles: matched.roles ?? [],
          scheme: options.scheme ?? presented.scheme,
          claims: matched.claims ?? {},
        },
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
