/**
 * Core directory identity, query context, pagination, and consistency value types.
 *
 * @module
 */

/**
 * Stable provider-neutral reference to a directory object.
 *
 * Principals and groups are always keyed by `(directoryInstance, immutableId)`
 * (such as `objectGUID` on Active Directory or `objectId` on Microsoft Entra ID).
 * Display names, emails, and user principal names are attributes, never keys.
 *
 * @example
 * ```ts
 * import type { DirectoryRef } from '@netscript/plugin-directory-core/domain';
 *
 * const userRef: DirectoryRef = {
 *   directoryInstance: 'corp-example',
 *   immutableId: '20000000-0000-4000-8000-000000000001',
 * };
 * console.log(userRef.directoryInstance, userRef.immutableId);
 * ```
 */
export type DirectoryRef = Readonly<{
  /** Logical identifier of the configured directory instance. */
  directoryInstance: string;
  /** Immutable provider object identifier (for example AD `objectGUID` or Entra `objectId`). */
  immutableId: string;
}>;

/**
 * Capability declared by a `DirectoryPort` adapter.
 *
 * - `'search'`: `searchUsers` and `searchGroups` execute bounded queries. When absent, both
 *   methods MUST reject with `DirectoryUnsupported` instead of returning empty pages.
 * - `'transitive-membership'`: `memberOfAny` resolves nested groups and groups nesting the user's
 *   primary group transitively (cycle-safe). When absent, `memberOfAny` evaluates direct and
 *   direct primary-group membership only; callers that require transitive semantics must inspect
 *   `capabilities.has('transitive-membership')` and fail closed with `DirectoryUnsupported`.
 * - `'change-events'`: Reserved capability indicating the adapter can emit directory change
 *   events in future extensions.
 *
 * @example
 * ```ts
 * import type { DirectoryCapability } from '@netscript/plugin-directory-core/domain';
 *
 * const caps: ReadonlySet<DirectoryCapability> = new Set(['search', 'transitive-membership']);
 * console.log(caps.has('transitive-membership'));
 * ```
 */
export type DirectoryCapability = 'search' | 'transitive-membership' | 'change-events';

/**
 * Per-call execution context passed to every directory operation (including `health`).
 *
 * Deadline and cancellation contract:
 * - `timeoutMs`: optional finite number in `(0, 2_147_483_647]` (`DIRECTORY_MAX_TIMEOUT_MS`).
 *   Non-finite values (`NaN`, `±Infinity`) or values above `2_147_483_647` throw `RangeError`.
 *   Values `<= 0` fail closed with `DirectoryTimeout`.
 * - `signal`: when aborted with a timeout reason (`DirectoryTimeout` or an `Error`/`DOMException`
 *   whose `name === 'TimeoutError'`), operations reject with `DirectoryTimeout`. When aborted for
 *   any other caller cancellation reason, operations reject with `DirectoryUnavailable`.
 *
 * @example
 * ```ts
 * import type { CallContext } from '@netscript/plugin-directory-core/domain';
 *
 * const controller = new AbortController();
 * const ctx: CallContext = { signal: controller.signal, timeoutMs: 5_000 };
 * console.log(ctx.timeoutMs);
 * ```
 */
export type CallContext = Readonly<{
  /** Optional abort signal propagated to outbound directory IO. */
  signal?: AbortSignal;
  /** Optional per-call timeout budget in milliseconds (`(0, 2_147_483_647]`). */
  timeoutMs?: number;
  /** Optional caller correlation identifier for diagnostics. */
  requestId?: string;
  /** Optional W3C `traceparent` header value for distributed tracing. */
  traceparent?: string;
  /** Optional W3C `tracestate` header value for distributed tracing. */
  tracestate?: string;
}>;

/**
 * Bounded page returned by directory search operations.
 *
 * Every search page carries `truncated` and `evaluatedAt` so callers can detect
 * capped results and enforce freshness budgets.
 *
 * @example
 * ```ts
 * import type { DirectoryGroup, Page } from '@netscript/plugin-directory-core/domain';
 *
 * const page: Page<DirectoryGroup> = {
 *   items: [],
 *   truncated: false,
 *   evaluatedAt: '2026-06-01T12:00:00.000Z',
 * };
 * console.log(page.truncated, page.evaluatedAt);
 * ```
 */
export type Page<T> = Readonly<{
  /** Matched records for this bounded query, never exceeding the capped limit. */
  items: readonly T[];
  /** True when additional matches exist beyond the applied search limit. */
  truncated: boolean;
  /** ISO-8601 UTC timestamp recording when the directory evaluated this page. */
  evaluatedAt: string;
}>;

/**
 * Normalized directory user record returned by search and point lookups.
 *
 * @example
 * ```ts
 * import type { DirectoryUser } from '@netscript/plugin-directory-core/domain';
 *
 * const user: DirectoryUser = {
 *   ref: { directoryInstance: 'corp-example', immutableId: '20000000-0000-4000-8000-000000000001' },
 *   immutableId: '20000000-0000-4000-8000-000000000001',
 *   enabled: true,
 *   expiresAt: '2027-01-01T00:00:00.000Z',
 *   displayName: 'Alice Example',
 *   userPrincipalName: 'alice@example.test',
 * };
 * console.log(user.immutableId, user.enabled);
 * ```
 */
export type DirectoryUser = Readonly<{
  /** Stable `(directoryInstance, immutableId)` reference for this user. */
  ref: DirectoryRef;
  /** Immutable provider user identifier (matches `ref.immutableId`). */
  immutableId: string;
  /** Whether the directory account is currently enabled. */
  enabled: boolean;
  /** Optional ISO-8601 UTC timestamp after which the account is expired. */
  expiresAt?: string;
  /** Human-readable display name (attribute only, never a primary key). */
  displayName?: string;
  /** User principal name (attribute only, never a primary key). */
  userPrincipalName?: string;
  /** Primary email address (attribute only, never a primary key). */
  mail?: string;
  /** Short account login name such as `sAMAccountName` (attribute only, never a primary key). */
  username?: string;
}>;

/**
 * Normalized directory group record returned by group searches.
 *
 * @example
 * ```ts
 * import type { DirectoryGroup } from '@netscript/plugin-directory-core/domain';
 *
 * const group: DirectoryGroup = {
 *   ref: { directoryInstance: 'corp-example', immutableId: '10000000-0000-4000-8000-000000000002' },
 *   immutableId: '10000000-0000-4000-8000-000000000002',
 *   displayName: 'Engineering',
 * };
 * console.log(group.immutableId, group.displayName);
 * ```
 */
export type DirectoryGroup = Readonly<{
  /** Stable `(directoryInstance, immutableId)` reference for this group. */
  ref: DirectoryRef;
  /** Immutable provider group identifier (matches `ref.immutableId`). */
  immutableId: string;
  /** Human-readable group name (attribute only, never a primary key). */
  displayName: string;
  /** Optional human-readable description. */
  description?: string;
  /** Optional email address for mail-enabled groups. */
  mail?: string;
}>;

/**
 * Selector accepted by `DirectoryPort.getUser`.
 *
 * Exactly one lookup key (`immutableId`, `userPrincipalName`, `mail`, or `username`) may be
 * provided alongside `directoryInstance`. Prefer {@link DirectoryRef} whenever an immutable
 * identifier is known.
 *
 * Contract semantics for all adapters:
 * - Selectors match literally; adapters MUST escape all protocol metacharacters (LDAP, OData,
 *   SCIM, URL).
 * - Empty or whitespace-only selector values return `undefined`.
 * - Secondary attribute lookups (`userPrincipalName`, `mail`, `username`) that match more than one
 *   account MUST fail closed by returning `undefined` rather than returning an arbitrary account.
 *
 * @example
 * ```ts
 * import type { UserLookup } from '@netscript/plugin-directory-core/domain';
 *
 * const byRef: UserLookup = {
 *   directoryInstance: 'corp-example',
 *   immutableId: '20000000-0000-4000-8000-000000000001',
 * };
 * const byUpn: UserLookup = {
 *   directoryInstance: 'corp-example',
 *   userPrincipalName: 'alice@example.test',
 * };
 * console.log(byRef.directoryInstance, byUpn.directoryInstance);
 * ```
 */
export type UserLookup =
  | (
    & DirectoryRef
    & Readonly<{
      /** Disallowed when looking up by `immutableId`. */
      userPrincipalName?: undefined;
      /** Disallowed when looking up by `immutableId`. */
      mail?: undefined;
      /** Disallowed when looking up by `immutableId`. */
      username?: undefined;
    }>
  )
  | Readonly<{
    /** Logical identifier of the configured directory instance. */
    directoryInstance: string;
    /** Secondary lookup by user principal name. */
    userPrincipalName: string;
    /** Disallowed when looking up by `userPrincipalName`. */
    immutableId?: undefined;
    /** Disallowed when looking up by `userPrincipalName`. */
    mail?: undefined;
    /** Disallowed when looking up by `userPrincipalName`. */
    username?: undefined;
  }>
  | Readonly<{
    /** Logical identifier of the configured directory instance. */
    directoryInstance: string;
    /** Secondary lookup by primary email address. */
    mail: string;
    /** Disallowed when looking up by `mail`. */
    immutableId?: undefined;
    /** Disallowed when looking up by `mail`. */
    userPrincipalName?: undefined;
    /** Disallowed when looking up by `mail`. */
    username?: undefined;
  }>
  | Readonly<{
    /** Logical identifier of the configured directory instance. */
    directoryInstance: string;
    /** Secondary lookup by short account login name. */
    username: string;
    /** Disallowed when looking up by `username`. */
    immutableId?: undefined;
    /** Disallowed when looking up by `username`. */
    userPrincipalName?: undefined;
    /** Disallowed when looking up by `username`. */
    mail?: undefined;
  }>;
