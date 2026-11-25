# @netscript/plugin-directory-core

[![JSR](https://jsr.io/badges/@netscript/plugin-directory-core)](https://jsr.io/@netscript/plugin-directory-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**Provider-neutral directory port, domain contracts, typed errors, and conformance testing kit for
NetScript.**

Enterprise services need to ask a live directory "what does the directory say about this user, now"
— look up users and groups, read an immutable identity key, and evaluate transitive membership in a
bounded set of granted groups. This Archetype 2 Integration core package defines that neutral port
(`DirectoryPort`), immutable identity references (`DirectoryRef`), bounded search pages (`Page<T>`),
typed errors, and the reusable `./testing` conformance suite. It ships zero provider SDK imports so
Active Directory/LDAP, Microsoft Entra ID, and SCIM adapters implement one stable contract.

## Why teams use it

- **Provider-neutral port** — `DirectoryPort` exposes `searchUsers`, `searchGroups`, `getUser`,
  `memberOfAny`, and `health` with zero LDAP, Graph, or SCIM types on the contract surface.
- **Immutable identity keys** — Principals and groups are addressed by
  `DirectoryRef { directoryInstance, immutableId }` (`objectGUID` on AD, `objectId` on Entra);
  display names and UPNs are attributes, never keys.
- **Bounded by construction** — Searches require a positive integer `limit` capped by
  `normalizeDirectorySearchLimit`, every page reports `truncated` and `evaluatedAt`, and
  `memberOfAny` evaluates only an explicit `candidateGroupIds` set.
- **Fail-closed semantics** — Disabled and expired users evaluate to empty membership via
  `isDirectoryUserActive`, and upstream failures map to `DirectoryUnavailable`,
  `DirectoryUnauthorized`, `DirectoryTimeout`, and `DirectoryUnsupported`.
- **One-call conformance suite** — `@netscript/plugin-directory-core/testing` ships an in-memory
  `DirectoryPort`, a deterministic clock, and `runDirectoryConformanceSuite` covering nested groups,
  primary groups, disabled/expired users, truncation, timeouts, hostile search strings, and unknown
  or duplicated candidates.

## Install

```bash
deno add jsr:@netscript/plugin-directory-core@<version>
```

Pin `<version>` to match your workspace NetScript version.

## Quick example

Evaluate bounded transitive group membership against any `DirectoryPort` implementation:

```typescript
import {
  type DirectoryPort,
  type DirectoryRef,
  DirectoryUnsupported,
} from '@netscript/plugin-directory-core';

declare const directory: DirectoryPort;

if (!directory.capabilities.has('transitive-membership')) {
  throw new DirectoryUnsupported(
    directory.name,
    'memberOfAny',
    'Directory adapter does not support transitive group evaluation.',
  );
}

const user: DirectoryRef = {
  directoryInstance: 'corp-example',
  immutableId: '20000000-0000-4000-8000-000000000001',
};

const result = await directory.memberOfAny(
  {
    user,
    candidateGroupIds: ['10000000-0000-4000-8000-000000000002'],
  },
  { timeoutMs: 2_000 },
);
console.log(result.memberOf, result.evaluatedAt, result.consistency.source);
```

Run the canonical conformance suite against an adapter factory with one call:

```typescript
import {
  createDeterministicClock,
  createInMemoryDirectoryPort,
  DIRECTORY_CONFORMANCE_DATASET,
  verifyDirectoryConformance,
} from '@netscript/plugin-directory-core/testing';

const report = await verifyDirectoryConformance({
  name: 'in-memory',
  createFixture: () => {
    const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
    return {
      clock,
      maxSearchLimit: 3,
      port: createInMemoryDirectoryPort({
        directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
        clock,
        maxSearchLimit: 3,
        users: DIRECTORY_CONFORMANCE_DATASET.users,
        groups: DIRECTORY_CONFORMANCE_DATASET.groups,
      }),
    };
  },
});
console.log(report.suiteName, report.passed);
```

## Public surface

| Entry       | What it gives you                                                                  |
| ----------- | ---------------------------------------------------------------------------------- |
| `.`         | Curated root exports: `DirectoryPort`, `DirectoryRef`, domain helpers, and errors  |
| `./domain`  | `DirectoryRef`, `DirectoryUser`, `DirectoryGroup`, `Page`, `DirectoryHealth`, caps |
| `./ports`   | `DirectoryPort`, query/result contracts, and the four typed directory errors       |
| `./testing` | In-memory `DirectoryPort`, deterministic clock, dataset, and conformance suite     |

The always-current symbol list is
[`deno doc jsr:@netscript/plugin-directory-core@<version>`](https://jsr.io/@netscript/plugin-directory-core/doc).

## Docs

- **Directory reference — port, domain types, errors, and testing kit**:
  [rickylabs.github.io/netscript/reference/plugin-directory-core/](https://rickylabs.github.io/netscript/reference/plugin-directory-core/)
- **Identity & Access — live directory queries**:
  [rickylabs.github.io/netscript/identity-access/directory/](https://rickylabs.github.io/netscript/identity-access/directory/)
- **API docs on JSR**:
  [jsr.io/@netscript/plugin-directory-core/doc](https://jsr.io/@netscript/plugin-directory-core/doc)

## Compatibility

Contracts, types, and errors are plain TypeScript with zero provider SDK dependencies. The
`./testing` conformance suite targets Deno 2.9+.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
