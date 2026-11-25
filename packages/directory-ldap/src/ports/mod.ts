/**
 * Injectable LDAP transport seam allowing deterministic testing without network I/O while keeping
 * `npm:ldapts` types off the public `@netscript/directory-ldap` surface.
 *
 * @module
 */

/**
 * Structural view of a structured `ldapts` filter AST object.
 *
 * All queries construct `ldapts` filter class instances (`AndFilter`, `OrFilter`, `NotFilter`,
 * `EqualityFilter`, `SubstringFilter`, `PresenceFilter`, `ExtensibleFilter`); raw filter strings
 * are never accepted.
 */
export type LdapFilterNode = Readonly<{
  /** BER filter tag number from `ldapts`. */
  type: number;
  /** Escaped RFC 4515 string representation produced by the `ldapts` filter AST. */
  toString(): string;
}>;

/**
 * Raw LDAP search entry returned by {@link LdapClientPort.search} and
 * {@link LdapClientPort.searchBounded}.
 */
export type LdapRawEntry = Readonly<{
  /** Distinguished name of the matched LDAP entry. */
  dn: string;
  /** Returned attribute values (binary attributes are `Uint8Array` / `Buffer`). */
  [attribute: string]: string | readonly string[] | Uint8Array | readonly Uint8Array[] | undefined;
}>;

/**
 * LDAP search parameters passed to {@link LdapClientPort.search}.
 */
export type LdapSearchParams = Readonly<{
  /** Search scope (`'base'` for RootDSE/base-DN health probes, `'sub'` for directory queries). */
  scope: 'base' | 'one' | 'sub';
  /** Structured `ldapts` filter AST node (never a concatenated string). */
  filter: LdapFilterNode;
  /** Explicit allowlist of attributes to return. */
  attributes: readonly string[];
  /** Attributes that must always be decoded as raw binary buffers (for example `objectGUID`, `objectSid`). */
  explicitBufferAttributes?: readonly string[];
  /** Maximum entries requested from the server (`>= 0`). */
  sizeLimit: number;
  /** Server-side time limit in whole seconds (`>= 1`). */
  timeLimit: number;
  /** Optional RFC 2696 paging page size. */
  paged?: Readonly<{ pageSize: number }>;
}>;

/**
 * Client-bounded RFC 2696 paged search parameters passed to {@link LdapClientPort.searchBounded}.
 *
 * Implementations iterate pages via `searchPaginated` and stop immediately once `maxEntries`
 * entries have been collected so broad queries never pull the full directory over the wire.
 */
export type LdapBoundedSearchParams =
  & LdapSearchParams
  & Readonly<{
    /** Hard client-side upper bound on entries collected across pages (`>= 1`). */
    maxEntries: number;
  }>;

/**
 * Result returned by {@link LdapClientPort.search} and {@link LdapClientPort.searchBounded}.
 */
export type LdapSearchResult = Readonly<{
  /** Matched entries from the server. */
  searchEntries: readonly LdapRawEntry[];
}>;

/**
 * TLS options passed to {@link LdapClientFactory} (for `ldaps://`) and
 * {@link LdapClientPort.startTLS} (for `ldap://` StartTLS).
 */
export type LdapTransportTlsOptions = Readonly<{
  /** Always `true` for TLS connections. */
  rejectUnauthorized: true;
  /** Optional PEM CA certificate contents loaded from `tls.caFile`. */
  ca?: string;
  /** Expected TLS server hostname for SNI and certificate verification. */
  servername: string;
}>;

/**
 * Connection options passed to {@link LdapClientFactory}.
 */
export type LdapClientConnectOptions = Readonly<{
  /** Host URL (`ldaps://host:port` or `ldap://host:port`). */
  url: string;
  /** Per-operation socket timeout in milliseconds. */
  timeoutMs: number;
  /** Initial TCP/TLS connect timeout in milliseconds. */
  connectTimeoutMs: number;
  /** Defined only for direct `ldaps://` connections; omitted for TCP/StartTLS connections. */
  tlsOptions?: LdapTransportTlsOptions;
}>;

/**
 * Minimal LDAP client transport port implemented by `ldapts` and test fakes.
 */
export interface LdapClientPort {
  /** Upgrades a plain `ldap://` TCP connection to TLS before bind. */
  startTLS(options: LdapTransportTlsOptions): Promise<void>;
  /** Authenticates the connection with read-only service-account credentials. */
  bind(dn: string, password: string): Promise<void>;
  /** Executes a point or base-scope LDAP search using a structured filter AST. */
  search(baseDn: string, options: LdapSearchParams): Promise<LdapSearchResult>;
  /**
   * Executes a client-bounded RFC 2696 paged LDAP search that stops requesting pages the instant
   * `options.maxEntries` entries are collected.
   */
  searchBounded(baseDn: string, options: LdapBoundedSearchParams): Promise<LdapSearchResult>;
  /** Closes and cleans up the underlying LDAP connection. */
  unbind(): Promise<void>;
}

/**
 * Factory creating a fresh {@link LdapClientPort} for one directory host attempt.
 */
export type LdapClientFactory = (options: LdapClientConnectOptions) => LdapClientPort;
