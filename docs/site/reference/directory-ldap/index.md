---
layout: layouts/base.vto
title: "@netscript/directory-ldap"
description: Active Directory and Samba AD adapter implementing NetScript's DirectoryPort.
templateEngine: [vento, md]
---

# `@netscript/directory-ldap`

Active Directory and Samba AD adapter implementing `@netscript/plugin-directory-core`'s
`DirectoryPort` over strict TLS with `ldapts` filter ASTs, bounded `searchPaginated` wire reads,
`*_FILE`-only bind secrets, and hung-host-resilient multi-host failover.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/directory-ldap` | `./mod.ts` | Composition factory (`createLdapDirectoryPort`), strict config validator, AD codecs, error mapper, injectable client port, and re-exported core port types |

## Root surface (`.`)

### Adapter factory & transport

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `createLdapDirectoryPort` | function | Async factory loading `bindPasswordFile` (and optional PEM `tls.caFile`) and returning a `DirectoryPort` |
| `createLdaptsClient` | function | Default `LdapClientPort` implementation wrapping `npm:ldapts` (`search` and client-bounded `searchBounded`) |
| `defaultLdapClientFactory` | const | Default `LdapClientFactory` backed by `createLdaptsClient` |
| `LdapDirectoryOptions` | type | Full options accepted by `createLdapDirectoryPort` |

### Strict configuration & constants

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `resolveLdapConfig` | function | Validates URLs, strict TLS mode, `bindPasswordFile`, and search/timeout bounds |
| `LDAP_MATCHING_RULE_IN_CHAIN_OID` | const | Active Directory transitive-membership OID (`1.2.840.113556.1.4.1941`) |
| `LDAP_CAP_ACTIVE_DIRECTORY_OID` | const | Active Directory / Samba AD RootDSE capability OID (`1.2.840.113556.1.4.800`) |
| `DEFAULT_LDAP_TIMEOUT_MS` | const | Default operation timeout budget (`5000` ms) |
| `DEFAULT_LDAP_PAGE_SIZE` | const | Default RFC 2696 page size (`100`) |
| `DEFAULT_LDAP_CANDIDATE_BATCH_SIZE` | const | Default bounded candidate-group batch size (`50`) |
| `LdapStaticConfigOptions` | type | Static host, base DN, bind file, TLS, and attribute options |
| `LdapTlsMode` | type | `'ldaps' \| 'starttls' \| 'insecure-plaintext-dev'` |
| `LdapTlsOptions` | type | Strict TLS options (`caFile`, `rejectUnauthorized: true`, `servername`, `allowInsecurePlaintextDev`) |
| `LdapAttributeMap` | type | Optional Active Directory attribute and objectClass overrides |
| `ResolvedLdapAttributeMap` | type | Resolved attribute map with AD defaults applied |
| `ResolvedLdapConfig` | type | Normalized immutable adapter configuration (never holds passwords) |
| `ResolvedLdapHost` | type | Validated host URL, SNI hostname, transport flags, and redacted probe label |

### Active Directory codecs & error mapping

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `AD_ACCOUNT_DISABLE_FLAG` | const | `userAccountControl` `ACCOUNTDISABLE` flag (`0x0002`) |
| `decodeAdObjectGuid` | function | Decodes 16-byte mixed-endian AD `objectGUID` to canonical lowercase UUID |
| `encodeAdObjectGuid` | function | Encodes canonical UUID string into 16-byte AD `objectGUID` bytes |
| `tryEncodeAdObjectGuid` | function | Non-throwing UUID-to-`objectGUID` encoder returning `undefined` on invalid input |
| `derivePrimaryGroupSid` | function | Substitutes a user `objectSid` RID with `primaryGroupID` to compute primary group `objectSid` |
| `readObjectSidRid` | function | Reads trailing unsigned 32-bit RID from a binary `objectSid` |
| `decodeAdAccountEnabled` | function | Fail-closed `userAccountControl` account-enabled decoder |
| `decodeAdAccountExpires` | function | BigInt Windows FILETIME `accountExpires` to ISO-8601 UTC decoder (fail-closed above `Int64.Max`) |
| `encodeAdAccountExpires` | function | ISO-8601 UTC to Windows FILETIME decimal string encoder |
| `parseAdPrimaryGroupId` | function | Parses `primaryGroupID` attribute into a uint32 RID |
| `mapLdapError` | function | Maps LDAP/TLS/timeout errors by name/code first to redacted `@netscript/plugin-directory-core` errors |
| `isLdapBaseDnMisconfigurationError` | function | Returns `true` for `noSuchObject` (32) or `invalidDNSyntax` (34) misconfiguration errors |
| `isNonLdapProgramError` | function | Returns `true` for JS programming errors (`TypeError`, `RangeError`, `ReferenceError`, `SyntaxError`) |

### Transport seams

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `LdapClientPort` | interface | Injectable LDAP client contract (`startTLS`, `bind`, `search`, `searchBounded`, `unbind`) |
| `LdapClientFactory` | type | Factory creating a per-attempt `LdapClientPort` |
| `LdapClientConnectOptions` | type | Host URL, socket/connect timeouts, and optional direct-LDAPS TLS options |
| `LdapTransportTlsOptions` | type | Strict TLS options (`rejectUnauthorized: true`, `ca`, `servername`) |
| `LdapFilterNode` | type | Structural view of an `ldapts` filter AST object |
| `LdapSearchParams` | type | Point/base LDAP search options (`scope`, `filter`, `attributes`, `sizeLimit`, `timeLimit`, `paged`) |
| `LdapBoundedSearchParams` | type | Client-bounded paged search options extending `LdapSearchParams` with hard `maxEntries` |
| `LdapSearchResult` | type | Raw search response envelope (`searchEntries`) |
| `LdapRawEntry` | type | Raw LDAP entry with `dn` and string/binary attributes |

### Re-exported core types

For self-contained JSR documentation, the root entrypoint re-exports referenced types from
`@netscript/plugin-directory-core`:

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `CallContext` | type | Re-exported per-call execution context from `@netscript/plugin-directory-core` |
| `ConsistencyInfo` | type | Re-exported freshness metadata from `@netscript/plugin-directory-core` |
| `ConsistencySource` | type | Re-exported `'live' \| 'cache'` source union from `@netscript/plugin-directory-core` |
| `DIRECTORY_ERROR_CODES` | type | Re-exported error code map type from `@netscript/plugin-directory-core` |
| `DirectoryCapability` | type | Re-exported adapter capability union from `@netscript/plugin-directory-core` |
| `DirectoryClock` | type | Re-exported UTC clock port (`nowMs`, `nowIso`) from `@netscript/plugin-directory-core` |
| `DirectoryError` | type | Re-exported base directory error type from `@netscript/plugin-directory-core` |
| `DirectoryErrorCode` | type | Re-exported error code union from `@netscript/plugin-directory-core` |
| `DirectoryGroup` | type | Re-exported normalized group record from `@netscript/plugin-directory-core` |
| `DirectoryHealth` | type | Re-exported aggregate health payload from `@netscript/plugin-directory-core` |
| `DirectoryHealthProbe` | type | Re-exported individual health probe from `@netscript/plugin-directory-core` |
| `DirectoryHealthProbeStatus` | type | Re-exported health probe status union from `@netscript/plugin-directory-core` |
| `DirectoryHealthStatus` | type | Re-exported `'healthy' \| 'degraded' \| 'unhealthy'` union from `@netscript/plugin-directory-core` |
| `DirectoryPort` | type | Re-exported provider-neutral directory port from `@netscript/plugin-directory-core` |
| `DirectoryRef` | type | Re-exported `(directoryInstance, immutableId)` key from `@netscript/plugin-directory-core` |
| `DirectoryTimeout` | type | Re-exported timeout error type from `@netscript/plugin-directory-core` |
| `DirectoryTimeoutOptions` | type | Re-exported timeout options type from `@netscript/plugin-directory-core` |
| `DirectoryUnauthorized` | type | Re-exported unauthorized error type from `@netscript/plugin-directory-core` |
| `DirectoryUnavailable` | type | Re-exported unavailable error type from `@netscript/plugin-directory-core` |
| `DirectoryUnsupported` | type | Re-exported unsupported error type from `@netscript/plugin-directory-core` |
| `DirectoryUser` | type | Re-exported normalized user record from `@netscript/plugin-directory-core` |
| `MemberOfAnyQuery` | type | Re-exported bounded membership query from `@netscript/plugin-directory-core` |
| `MemberOfAnyResult` | type | Re-exported bounded membership result from `@netscript/plugin-directory-core` |
| `Page` | type | Re-exported bounded search page from `@netscript/plugin-directory-core` |
| `SearchGroupsQuery` | type | Re-exported bounded group search query from `@netscript/plugin-directory-core` |
| `SearchUsersQuery` | type | Re-exported bounded user search query from `@netscript/plugin-directory-core` |
| `UserLookup` | type | Re-exported point-lookup selector union from `@netscript/plugin-directory-core` |

## Related docs

- [Directory queries guide](/identity-access/directory/)
- [@netscript/plugin-directory-core reference](/reference/plugin-directory-core/)
