/**
 * Trusted-header authenticator for identity established by an upstream gateway.
 *
 * @example
 * ```ts
 * import { createTrustedHeaderAuthenticator } from "@netscript/service/auth";
 *
 * const authenticator = createTrustedHeaderAuthenticator({
 *   subjectHeader: "x-authenticated-user",
 *   scopesHeader: "x-authenticated-scopes",
 *   rolesHeader: "x-authenticated-roles",
 * });
 * ```
 *
 * @module
 */

import type { AuthenticatorPort, AuthnRequest, AuthnResult } from './types.ts';

/** Options for creating a trusted-header authenticator. */
export interface TrustedHeaderAuthenticatorOptions {
  /** Header containing the authenticated subject. */
  readonly subjectHeader: string;
  /** Header containing comma- or space-delimited scopes. */
  readonly scopesHeader?: string;
  /** Header containing comma- or space-delimited roles. */
  readonly rolesHeader?: string;
  /** Header containing JSON claims. */
  readonly claimsHeader?: string;
}

/** Creates an authenticator that trusts identity headers from an upstream verifier. */
export function createTrustedHeaderAuthenticator(
  options: TrustedHeaderAuthenticatorOptions,
): AuthenticatorPort {
  return {
    authenticate(request: AuthnRequest): AuthnResult {
      const subject = request.header(options.subjectHeader)?.trim();
      if (!subject) {
        return { ok: false, reason: 'missing-identity-header' };
      }

      return {
        ok: true,
        principal: {
          subject,
          scopes: parseListHeader(readOptionalHeader(request, options.scopesHeader)),
          roles: parseListHeader(readOptionalHeader(request, options.rolesHeader)),
          scheme: 'trusted-header',
          claims: parseClaimsHeader(readOptionalHeader(request, options.claimsHeader)),
        },
      };
    },
  };
}

function readOptionalHeader(request: AuthnRequest, name: string | undefined): string | undefined {
  return name ? request.header(name) : undefined;
}

function parseListHeader(value: string | undefined): readonly string[] {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseClaimsHeader(value: string | undefined): Readonly<Record<string, unknown>> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Readonly<Record<string, unknown>>;
    }
  } catch {
    return {};
  }
  return {};
}
