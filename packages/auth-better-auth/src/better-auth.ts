import type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  Principal,
} from '@netscript/service/auth';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

/** Prisma providers supported by better-auth's first-party Prisma adapter. */
export type BetterAuthPrismaProvider =
  | 'sqlite'
  | 'cockroachdb'
  | 'mysql'
  | 'postgresql'
  | 'sqlserver'
  | 'mongodb';

/** Structural Prisma client accepted by better-auth's first-party Prisma adapter. */
export type BetterAuthPrismaClient = object;

/** Options for constructing a better-auth instance backed by consumer-owned Prisma. */
export type NetscriptBetterAuthOptions =
  & {
    /** Consumer-owned Prisma client. */
    readonly prisma: BetterAuthPrismaClient;
    /** Prisma provider name passed to better-auth's first-party Prisma adapter. */
    readonly provider: BetterAuthPrismaProvider;
    /** Enable better-auth Prisma adapter debug logs. */
    readonly debugLogs?: boolean;
    /** Use plural better-auth table names. */
    readonly usePlural?: boolean;
    /** Enable better-auth adapter transactions when supported by the provider. */
    readonly transaction?: boolean;
  }
  & Record<string, unknown>;

/** Session shape returned by `auth.api.getSession`. */
export interface BetterAuthSessionPayload {
  /** better-auth session record. */
  readonly session: {
    readonly id: string;
    readonly userId?: string;
    readonly activeOrganizationId?: string | null;
    readonly activeOrganizationRole?: string | null;
    readonly activeOrganizationRoles?: readonly string[] | null;
    readonly activeOrganizationPermissions?: readonly string[] | null;
    readonly [key: string]: unknown;
  };
  /** better-auth user record. */
  readonly user: {
    readonly id: string;
    readonly role?: string | null;
    readonly roles?: readonly string[] | null;
    readonly [key: string]: unknown;
  };
}

/** Minimal better-auth server instance consumed by this package. */
export interface BetterAuthInstance {
  /** better-auth Fetch handler for `/api/auth/**` routes. */
  readonly handler: (request: Request) => Promise<Response>;
  /** better-auth server API. */
  readonly api: {
    readonly getSession: (input: {
      readonly headers: Headers;
      readonly returnHeaders?: boolean;
    }) => Promise<
      | BetterAuthSessionPayload
      | null
      | {
        readonly headers?: Headers;
        readonly response: BetterAuthSessionPayload | null;
      }
    >;
  };
}

/** Options for creating a better-auth-backed NetScript authenticator. */
export interface BetterAuthAuthenticatorOptions {
  /** Configured better-auth server instance. */
  readonly auth: BetterAuthInstance;
}

/** Creates a better-auth server instance backed by better-auth's Prisma adapter.
 *
 * @param options - Consumer Prisma client, provider, and better-auth options.
 * @returns A better-auth instance suitable for `createBetterAuthAuthenticator`.
 *
 * @example
 * ```ts
 * const auth = createNetscriptBetterAuth({
 *   prisma,
 *   provider: 'postgresql',
 *   secret: Deno.env.get('BETTER_AUTH_SECRET')!,
 * });
 * ```
 */
export function createNetscriptBetterAuth(
  options: NetscriptBetterAuthOptions,
): BetterAuthInstance {
  const { prisma, provider, debugLogs, usePlural, transaction, ...betterAuthOptions } = options;
  return betterAuth(
    {
      ...betterAuthOptions,
      database: prismaAdapter(prisma, {
        provider,
        debugLogs,
        usePlural,
        transaction,
      }),
    } as Parameters<typeof betterAuth>[0],
  ) as BetterAuthInstance;
}

/** Creates a NetScript authenticator backed by `auth.api.getSession`.
 *
 * @param options - better-auth server instance.
 * @returns An `AuthenticatorPort` that maps better-auth sessions to NetScript principals.
 *
 * @example
 * ```ts
 * const authenticator = createBetterAuthAuthenticator({ auth });
 * ```
 */
export function createBetterAuthAuthenticator(
  options: BetterAuthAuthenticatorOptions,
): AuthenticatorPort {
  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      let resolved: Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>;
      try {
        resolved = await options.auth.api.getSession({
          headers: request.headers(),
          returnHeaders: true,
        });
      } catch (error) {
        return {
          ok: false,
          reason: normalizeProviderError(error, 'better_auth_session_lookup_failed'),
        };
      }

      const { session, headers } = unwrapSessionResponse(resolved);
      if (!session) {
        return { ok: false, reason: 'better_auth_session_missing' };
      }

      return {
        ok: true,
        principal: principalFromBetterAuthSession(session),
        ...headersFromBetterAuth(headers),
      };
    },
  };
}

export function unwrapSessionResponse(
  value: Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>,
): { readonly session: BetterAuthSessionPayload | null; readonly headers?: Headers } {
  if (value && 'response' in value) {
    return { session: value.response, headers: value.headers };
  }
  return { session: value };
}

export function principalFromBetterAuthSession(payload: BetterAuthSessionPayload): Principal {
  const organizationId = stringValue(
    payload.session.activeOrganizationId ?? payload.session.organizationId,
  );
  const sessionId = payload.session.id;

  return {
    subject: payload.user.id,
    scopes: collectScopes(payload),
    roles: collectRoles(payload),
    scheme: 'custom',
    claims: {
      organizationId,
      sessionId,
      activeOrganizationId: organizationId,
      session: payload.session,
      user: payload.user,
    },
  };
}

function collectScopes(payload: BetterAuthSessionPayload): readonly string[] {
  return [
    ...stringArray(payload.session.activeOrganizationPermissions),
    ...stringArray(payload.session.permissions),
    ...stringArray(payload.user.permissions),
  ];
}

function collectRoles(payload: BetterAuthSessionPayload): readonly string[] {
  const roles = new Set<string>();
  for (
    const value of [
      payload.user.role,
      payload.session.activeOrganizationRole,
      ...stringArray(payload.user.roles),
      ...stringArray(payload.session.activeOrganizationRoles),
      ...stringArray(payload.session.roles),
    ]
  ) {
    if (typeof value === 'string' && value.length > 0) {
      roles.add(value);
    }
  }
  return [...roles];
}

function headersFromBetterAuth(
  headers: Headers | undefined,
): Pick<AuthnResult & { ok: true }, 'responseHeaders' | 'setCookies'> {
  if (!headers) {
    return {};
  }

  const setCookies = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : splitSetCookie(headers.get('set-cookie'));
  const responseHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      responseHeaders[key] = value;
    }
  });

  return {
    ...(Object.keys(responseHeaders).length > 0 ? { responseHeaders } : {}),
    ...(setCookies.length > 0 ? { setCookies } : {}),
  };
}

function splitSetCookie(header: string | null): readonly string[] {
  if (!header) {
    return [];
  }
  return header.split(/,(?=\s*[^;,]+=)/).map((value) => value.trim()).filter(Boolean);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function normalizeProviderError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return `${fallback}: ${error.message}`;
  }
  return fallback;
}
