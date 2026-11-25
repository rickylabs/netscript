/**
 * Active Directory and Samba AD adapter implementing NetScript's `DirectoryPort`.
 *
 * Connects over strict TLS (`ldaps://` or StartTLS with `rejectUnauthorized: true` and optional
 * `tls.caFile`), loads service-account bind passwords strictly from a `*_FILE` path at startup,
 * builds every LDAP filter from `ldapts` filter AST classes with zero string concatenation,
 * bounds paged searches on the wire via `searchPaginated`, and evaluates bounded transitive
 * membership including Active Directory `primaryGroupID` resolution.
 *
 * @example
 * ```ts
 * import { createLdapDirectoryPort } from '@netscript/directory-ldap';
 *
 * const connectDirectory = () =>
 *   createLdapDirectoryPort({
 *     directoryInstance: 'corp-example',
 *     urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
 *     baseDn: 'DC=example,DC=test',
 *     bindDn: 'CN=svc-directory,OU=ServiceAccounts,DC=example,DC=test',
 *     bindPasswordFile: '/run/secrets/ldap_bind_password',
 *     tls: { caFile: '/etc/ssl/certs/corp-root-ca.pem' },
 *   });
 * console.log(typeof connectDirectory);
 * ```
 *
 * @module
 */

export {
  createLdapDirectoryPort,
  createLdaptsClient,
  defaultLdapClientFactory,
  type LdapDirectoryOptions,
} from './src/adapters/mod.ts';

export {
  AD_ACCOUNT_DISABLE_FLAG,
  decodeAdAccountEnabled,
  decodeAdAccountExpires,
  decodeAdObjectGuid,
  DEFAULT_LDAP_CANDIDATE_BATCH_SIZE,
  DEFAULT_LDAP_PAGE_SIZE,
  DEFAULT_LDAP_TIMEOUT_MS,
  derivePrimaryGroupSid,
  encodeAdAccountExpires,
  encodeAdObjectGuid,
  isLdapBaseDnMisconfigurationError,
  isNonLdapProgramError,
  LDAP_CAP_ACTIVE_DIRECTORY_OID,
  LDAP_MATCHING_RULE_IN_CHAIN_OID,
  type LdapAttributeMap,
  type LdapStaticConfigOptions,
  type LdapTlsMode,
  type LdapTlsOptions,
  mapLdapError,
  parseAdPrimaryGroupId,
  readObjectSidRid,
  type ResolvedLdapAttributeMap,
  type ResolvedLdapConfig,
  type ResolvedLdapHost,
  resolveLdapConfig,
  tryEncodeAdObjectGuid,
} from './src/domain/mod.ts';

export type {
  LdapBoundedSearchParams,
  LdapClientConnectOptions,
  LdapClientFactory,
  LdapClientPort,
  LdapFilterNode,
  LdapRawEntry,
  LdapSearchParams,
  LdapSearchResult,
  LdapTransportTlsOptions,
} from './src/ports/mod.ts';

// Re-export referenced core port and domain types so `deno doc --lint` stays self-contained.
export type {
  CallContext,
  ConsistencyInfo,
  ConsistencySource,
  DIRECTORY_ERROR_CODES,
  DirectoryCapability,
  DirectoryClock,
  DirectoryError,
  DirectoryErrorCode,
  DirectoryGroup,
  DirectoryHealth,
  DirectoryHealthProbe,
  DirectoryHealthProbeStatus,
  DirectoryHealthStatus,
  DirectoryPort,
  DirectoryRef,
  DirectoryTimeout,
  DirectoryTimeoutOptions,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  DirectoryUser,
  MemberOfAnyQuery,
  MemberOfAnyResult,
  Page,
  SearchGroupsQuery,
  SearchUsersQuery,
  UserLookup,
} from '@netscript/plugin-directory-core';
