# Changelog

All notable changes to `@netscript/directory-ldap` are documented in this file.

## Unreleased

### Added

- Initial `DirectoryPort` adapter backed by `ldapts@9.3.1` for Active Directory and LDAP directories.
- Strict TLS defaults (`ldaps://` or StartTLS with `rejectUnauthorized: true` and custom CA file
  loading; plaintext `ldap://` refused unless explicit dev opt-in is configured).
- `*_FILE`-only service-account bind password loading at startup with redacted errors and health
  probes.
- Pure `ldapts` filter AST builders (`AndFilter`, `OrFilter`, `NotFilter`, `EqualityFilter`,
  `SubstringFilter`, `PresenceFilter`, `ExtensibleFilter`) with zero string concatenation.
- Bounded paged searches with `sizeLimit`, `timeLimit`, binary `objectGUID` mixed-endian decoding,
  `userAccountControl` / Windows FILETIME `accountExpires` evaluation, bounded
  `LDAP_MATCHING_RULE_IN_CHAIN` (`1.2.840.113556.1.4.1941`) membership evaluation, and separate
  Active Directory `primaryGroupID` / `objectSid` RID resolution.
- Ordered multi-host failover and per-host `'healthy'` / `'degraded'` / `'unhealthy'` health probes.
