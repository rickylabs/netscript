# @netscript/directory-ldap

[![JSR](https://jsr.io/badges/@netscript/directory-ldap)](https://jsr.io/@netscript/directory-ldap)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**Active Directory and LDAP adapter implementing NetScript's `DirectoryPort` over strict TLS.**

This Archetype 2 Integration package connects NetScript services to Active Directory, Samba AD, or
LDAP directories behind `@netscript/plugin-directory-core`'s `DirectoryPort`. It builds every LDAP
filter using `ldapts` filter AST classes (never string concatenation), enforces strict TLS defaults
(`ldaps://` or StartTLS with `rejectUnauthorized: true` and custom CA file loading), reads bind
credentials exclusively from a `*_FILE` path at startup, decodes binary AD `objectGUID` and
`objectSid` attributes, and evaluates bounded transitive group membership including Active Directory
`primaryGroupID` resolution.

## Why teams use it

- **Strict TLS by default** — Uses `ldaps://` or explicit StartTLS with `rejectUnauthorized: true`
  and custom CA bundles from `tls.caFile`. Plaintext `ldap://` is refused unless
  `tls.allowInsecurePlaintextDev: true` is explicitly opted in.
- **`*_FILE` secret discipline** — Service-account bind passwords are read once at startup from
  `bindPasswordFile`. Inline passwords, URL credentials, and secret/DN echoes in errors or health
  probes are rejected or redacted.
- **Zero LDAP filter string concatenation** — Every query constructs `ldapts` filter AST objects
  (`AndFilter`, `OrFilter`, `NotFilter`, `EqualityFilter`, `SubstringFilter`, `ExtensibleFilter`),
  preventing filter injection on hostile search input (`*`, `(`, `)`, `\`, `\0`).
- **Active Directory fidelity** — Decodes mixed-endian binary `objectGUID`, evaluates
  `userAccountControl` (`ACCOUNTDISABLE`) and Windows FILETIME `accountExpires` fail-closed, runs
  bounded `LDAP_MATCHING_RULE_IN_CHAIN` (`1.2.840.113556.1.4.1941`) queries against explicit
  candidate groups, and handles AD `primaryGroupID` via `objectSid` RID derivation.
- **Ordered multi-host failover & redacted health** — Tries configured directory controllers in
  order, fails fast on unauthorized credentials to avoid account lockouts, and reports
  `'healthy'` / `'degraded'` / `'unhealthy'` across all configured hosts in `health()`.

## Install

```bash
deno add jsr:@netscript/directory-ldap@<version>
```

Pin `<version>` to match your workspace NetScript version.

## Quick example

Create a strict LDAPS adapter backed by a secret file and custom enterprise CA bundle:

```typescript
import { createLdapDirectoryPort } from '@netscript/directory-ldap';

const createDirectory = () =>
  createLdapDirectoryPort({
    directoryInstance: 'corp-example',
    urls: ['ldaps://dc1.example.test:636', 'ldaps://dc2.example.test:636'],
    baseDn: 'DC=example,DC=test',
    bindDn: 'CN=svc-directory,OU=ServiceAccounts,DC=example,DC=test',
    bindPasswordFile: '/run/secrets/ldap_bind_password',
    tls: { caFile: '/etc/ssl/certs/corp-root-ca.pem' },
  });

console.log(typeof createDirectory);
```

Evaluate bounded transitive membership and check multi-host health:

```typescript
import type { DirectoryPort } from '@netscript/directory-ldap';

declare const directory: DirectoryPort;

const membership = await directory.memberOfAny(
  {
    user: {
      directoryInstance: 'corp-example',
      immutableId: '20000000-0000-4000-8000-000000000001',
    },
    candidateGroupIds: ['10000000-0000-4000-8000-000000000002'],
  },
  { timeoutMs: 2_000 },
);

const status = await directory.health({ timeoutMs: 2_000 });
console.log(membership.memberOf, status.status, status.reachableHosts, status.totalHosts);
```

## Public surface

| Export                         | Purpose                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- |
| `createLdapDirectoryPort`      | Async composition-root factory returning a strict `DirectoryPort`           |
| `resolveLdapConfig`            | Pure startup configuration validator enforcing TLS and `*_FILE` invariants  |
| `decodeAdObjectGuid` / encode  | Mixed-endian 16-byte Active Directory `objectGUID` binary <-> UUID codecs   |
| `derivePrimaryGroupSid`        | Replaces a user binary `objectSid` RID with `primaryGroupID`                |
| `decodeAdAccountEnabled`       | Fail-closed `userAccountControl` (`0x0002` `ACCOUNTDISABLE`) decoder        |
| `decodeAdAccountExpires`       | BigInt Windows FILETIME `accountExpires` <-> ISO-8601 UTC decoder/encoder   |
| `mapLdapError`                 | Redacted LDAP/TLS/timeout classifier to `@netscript/plugin-directory-core`  |
| `LdapClientPort` / factory     | Injectable transport seam for deterministic conformance testing             |

The always-current symbol list is
[`deno doc jsr:@netscript/directory-ldap@<version>`](https://jsr.io/@netscript/directory-ldap/doc).

## Docs

- **LDAP adapter reference**:
  [rickylabs.github.io/netscript/reference/directory-ldap/](https://rickylabs.github.io/netscript/reference/directory-ldap/)
- **Identity & Access — live directory queries**:
  [rickylabs.github.io/netscript/identity-access/directory/](https://rickylabs.github.io/netscript/identity-access/directory/)
- **Core port reference**:
  [rickylabs.github.io/netscript/reference/plugin-directory-core/](https://rickylabs.github.io/netscript/reference/plugin-directory-core/)
- **API docs on JSR**:
  [jsr.io/@netscript/directory-ldap/doc](https://jsr.io/@netscript/directory-ldap/doc)

## Compatibility

Targets Deno 2.9+ with `ldapts` (`9.3.1` pinned via the workspace catalog). Optional Samba AD
container integration tests are skipped unless `NETSCRIPT_LDAP_INTEGRATION_URL` is configured.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
