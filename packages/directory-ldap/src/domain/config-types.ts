/**
 * Configuration contract types and constants for `@netscript/directory-ldap`.
 *
 * @module
 */

/** Active Directory matching rule OID for transitive membership (`LDAP_MATCHING_RULE_IN_CHAIN`). */
export const LDAP_MATCHING_RULE_IN_CHAIN_OID: string = '1.2.840.113556.1.4.1941';

/** Default per-operation LDAP timeout in milliseconds when `CallContext.timeoutMs` is omitted. */
export const DEFAULT_LDAP_TIMEOUT_MS: number = 5_000;

/** Default LDAP search page size used for RFC 2696 paged searches. */
export const DEFAULT_LDAP_PAGE_SIZE: number = 100;

/** Default maximum number of candidate group IDs evaluated per bounded LDAP query batch. */
export const DEFAULT_LDAP_CANDIDATE_BATCH_SIZE: number = 50;

/**
 * Transport security mode for LDAP connections.
 *
 * - `'ldaps'` (default for `ldaps://`): direct TLS on connection.
 * - `'starttls'`: opens TCP on `ldap://` and immediately upgrades with RFC 4511 StartTLS before bind.
 * - `'insecure-plaintext-dev'`: plaintext `ldap://`; refused unless `allowInsecurePlaintextDev: true`.
 */
export type LdapTlsMode = 'ldaps' | 'starttls' | 'insecure-plaintext-dev';

/**
 * TLS verification configuration for LDAP/LDAPS connections.
 *
 * Certificate verification (`rejectUnauthorized: true`) is always enforced for TLS connections;
 * pass `caFile` to trust an internal enterprise or test CA certificate.
 */
export type LdapTlsOptions = Readonly<{
  /** Transport security mode (`'ldaps'` by default; `'starttls'` for `ldap://` with StartTLS). */
  mode?: LdapTlsMode;
  /** Optional path to a PEM CA certificate bundle read once at adapter startup. */
  caFile?: string;
  /** Must remain `true` (default); setting `false` is rejected fail-closed. */
  rejectUnauthorized?: true;
  /** Optional explicit TLS SNI `servername` override when connecting by IP or alias. */
  servername?: string;
  /**
   * Explicit development-only opt-in permitting plaintext `ldap://` without StartTLS.
   *
   * Must never be enabled in production. Defaults to `false`.
   */
  allowInsecurePlaintextDev?: boolean;
}>;

/** Configurable LDAP attribute names and object classes (defaults target Active Directory). */
export type LdapAttributeMap = Readonly<{
  /** Object class matched for user searches and lookups (default `'user'`). */
  userObjectClass?: string;
  /** Object classes excluded from user searches and lookups (default `['computer']` for AD `'user'`). */
  excludeUserObjectClasses?: readonly string[];
  /** Object class matched for group searches and membership queries (default `'group'`). */
  groupObjectClass?: string;
  /** Immutable object identifier attribute (default `'objectGUID'`). */
  immutableId?: string;
  /** Binary SID attribute used to resolve AD primary group RIDs (default `'objectSid'`). */
  objectSid?: string;
  /** Primary group RID attribute on user entries (default `'primaryGroupID'`). */
  primaryGroupId?: string;
  /** Account-control bitmask attribute on user entries (default `'userAccountControl'`). */
  userAccountControl?: string;
  /** Account expiration Windows FILETIME attribute on user entries (default `'accountExpires'`). */
  accountExpires?: string;
  /** User display name attribute (default `'displayName'`). */
  displayName?: string;
  /** User principal name attribute (default `'userPrincipalName'`). */
  userPrincipalName?: string;
  /** Primary email attribute (default `'mail'`). */
  mail?: string;
  /** Short account login attribute (default `'sAMAccountName'`). */
  username?: string;
  /** Group display name attribute (default `'cn'`). */
  groupDisplayName?: string;
  /** Group description attribute (default `'description'`). */
  groupDescription?: string;
  /** Group membership DN attribute (default `'member'`). */
  member?: string;
}>;

/** Resolved, non-optional attribute names used internally by the LDAP adapter. */
export type ResolvedLdapAttributeMap = Readonly<{
  userObjectClass: string;
  excludeUserObjectClasses: readonly string[];
  groupObjectClass: string;
  immutableId: string;
  objectSid: string;
  primaryGroupId: string;
  userAccountControl: string;
  accountExpires: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  username: string;
  groupDisplayName: string;
  groupDescription: string;
  member: string;
}>;

/** Validated per-host connection target derived from a configured LDAP URL. */
export type ResolvedLdapHost = Readonly<{
  /** Normalized `ldaps://host:port` or `ldap://host:port` URL. */
  url: string;
  /** Hostname used for TLS SNI `servername` validation. */
  hostname: string;
  /** Whether the host uses direct LDAPS (`true`) or TCP (`false`). */
  directTls: boolean;
  /** Whether StartTLS must be negotiated immediately before bind. */
  useStartTls: boolean;
  /** Redacted probe label (`host-1`, `host-2`, ...) containing no credentials or DNs. */
  probeName: string;
}>;

/** Resolved, validated LDAP adapter configuration (never holds the bind password). */
export type ResolvedLdapConfig = Readonly<{
  name: string;
  directoryInstance: string;
  hosts: readonly ResolvedLdapHost[];
  baseDn: string;
  usersBaseDn: string;
  groupsBaseDn: string;
  bindDn: string;
  bindPasswordFile: string;
  tlsMode: LdapTlsMode;
  caFile?: string;
  servername?: string;
  supportsInChainMatching: boolean;
  maxSearchLimit: number;
  pageSize: number;
  defaultTimeoutMs: number;
  connectTimeoutMs: number;
  candidateBatchSize: number;
  attributes: ResolvedLdapAttributeMap;
}>;

/** Options required to validate static LDAP configuration (excluding runtime hooks). */
export type LdapStaticConfigOptions = Readonly<{
  /** Adapter name reported on `DirectoryPort.name` (default `'ldap'`). */
  name?: string;
  /** Logical directory instance identifier bound to every `DirectoryRef`. */
  directoryInstance: string;
  /** Ordered list of directory controller URLs (`ldaps://...` or `ldap://...`) tried for failover. */
  urls: readonly string[];
  /** Default LDAP search base DN (used when `usersBaseDn`/`groupsBaseDn` are omitted). */
  baseDn: string;
  /** Optional narrower search base DN for user lookups and searches. */
  usersBaseDn?: string;
  /** Optional narrower search base DN for group searches and membership queries. */
  groupsBaseDn?: string;
  /** Service-account distinguished name or UPN used for read-only bind. */
  bindDn: string;
  /**
   * File path (`*_FILE` convention) containing the read-only service-account bind password.
   *
   * Inline bind passwords are never accepted.
   */
  bindPasswordFile: string;
  /** Strict TLS configuration (defaults to LDAPS with `rejectUnauthorized: true`). */
  tls?: LdapTlsOptions;
  /**
   * Whether the target LDAP server supports AD `LDAP_MATCHING_RULE_IN_CHAIN`
   * (`1.2.840.113556.1.4.1941`). Defaults to `true` and controls whether `'transitive-membership'`
   * is declared in `DirectoryPort.capabilities`.
   */
  supportsInChainMatching?: boolean;
  /** Maximum records returned per bounded search (default `100`, integer >= 1). */
  maxSearchLimit?: number;
  /** RFC 2696 paged search page size (default `100`, integer >= 1). */
  pageSize?: number;
  /** Default operation timeout budget in milliseconds (default `5000`). */
  defaultTimeoutMs?: number;
  /** TCP/TLS connect timeout in milliseconds (default `Math.min(defaultTimeoutMs, 3000)`). */
  connectTimeoutMs?: number;
  /** Maximum candidate group IDs queried per LDAP batch (default `50`, integer >= 1). */
  candidateBatchSize?: number;
  /** Optional LDAP schema attribute overrides. */
  attributes?: LdapAttributeMap;
}>;
