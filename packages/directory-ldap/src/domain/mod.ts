/**
 * Domain codecs, strict TLS/secret configuration validation, and redacted error mapping
 * for `@netscript/directory-ldap`.
 *
 * @module
 */

export {
  decodeAdObjectGuid,
  derivePrimaryGroupSid,
  encodeAdObjectGuid,
  readObjectSidRid,
  tryEncodeAdObjectGuid,
} from './ad-binary.ts';

export {
  AD_ACCOUNT_DISABLE_FLAG,
  decodeAdAccountEnabled,
  decodeAdAccountExpires,
  encodeAdAccountExpires,
  parseAdPrimaryGroupId,
} from './ad-account.ts';

export {
  DEFAULT_LDAP_CANDIDATE_BATCH_SIZE,
  DEFAULT_LDAP_PAGE_SIZE,
  DEFAULT_LDAP_TIMEOUT_MS,
  LDAP_CAP_ACTIVE_DIRECTORY_OID,
  LDAP_MATCHING_RULE_IN_CHAIN_OID,
  type LdapAttributeMap,
  type LdapStaticConfigOptions,
  type LdapTlsMode,
  type LdapTlsOptions,
  type ResolvedLdapAttributeMap,
  type ResolvedLdapConfig,
  type ResolvedLdapHost,
} from './config-types.ts';

export { resolveLdapConfig } from './config.ts';
export {
  isLdapBaseDnMisconfigurationError,
  isNonLdapProgramError,
  mapLdapError,
} from './errors.ts';
