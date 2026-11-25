---
layout: layouts/base.vto
title: Directory queries
templateEngine: [vento, md]
order: 2
---

# Directory queries

Authentication answers "who is this request" through `AuthBackendPort` and `Principal`. Live
directory queries answer "what does the enterprise directory say about this user, now": look up
users and groups, read a stable provider-immutable identifier, and evaluate transitive membership
against a bounded set of candidate group identifiers.

{{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({
  src: "/assets/diagrams/directory-architecture.svg",
  alt: "Architecture of NetScript live directory queries: an external OIDC provider authenticates through plugin-auth to establish a Principal, while the application binds subjects to immutable DirectoryRef keys and queries memberOfAny through DirectoryPort and read-only adapters such as directory-ldap to compute effective roles for service authz.",
  caption: "How live directory queries compose with plugin-auth and service authorization without duplicating directory state."
}) }}

## The port and its contract

`@netscript/plugin-directory-core` holds contracts, fail-closed invariants, typed errors, and the
reusable conformance testing kit. It imports zero provider SDKs so Active Directory / LDAP,
Microsoft Entra ID, and SCIM adapters implement one stable contract.

- **Immutable keys only.** Users and groups are keyed by
  `DirectoryRef { directoryInstance, immutableId }` (`objectGUID` on Active Directory, `objectId` on
  Entra ID). Display names, email addresses, and user principal names are attributes, never keys.
- **Bounded queries everywhere.** `searchUsers` and `searchGroups` require a positive integer
  `limit`, capped by `normalizeDirectorySearchLimit`, and every `Page<T>` reports `truncated` and
  `evaluatedAt`. `memberOfAny` evaluates only an explicit `candidateGroupIds` set instead of
  enumerating every group a user belongs to.
- **Fail-closed account state.** `getUser` returns `enabled` and optional `expiresAt` so callers can
  inspect account state, while `memberOfAny` evaluates disabled and expired accounts to an empty
  membership list (`isDirectoryUserActive`).
- **Typed failure boundaries.** Adapters raise `DirectoryUnavailable`, `DirectoryUnauthorized`,
  `DirectoryTimeout`, or `DirectoryUnsupported` instead of falling back silently to partial
  membership or empty scans.

## Evaluating bounded membership

```ts
import {
  DirectoryUnsupported,
  type DirectoryPort,
  type DirectoryRef,
} from '@netscript/plugin-directory-core';

declare const directory: DirectoryPort;

if (!directory.capabilities.has('transitive-membership')) {
  throw new DirectoryUnsupported(
    directory.name,
    'memberOfAny',
    'Configured directory adapter does not support transitive membership.',
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

## Consistency and revocation budgets

Every `memberOfAny` response carries `evaluatedAt` (an ISO-8601 UTC timestamp) and
`consistency: { source: 'live' | 'cache', ageMs }`. Direct adapters report
`{ source: 'live', ageMs: 0 }`. Consumers and future caching layers reason about revocation delay
using `DirectoryConsistencyBudget` and `computeRevocationBoundMs`:

```ts
import { computeRevocationBoundMs } from '@netscript/plugin-directory-core';

const revocationBoundMs = computeRevocationBoundMs({
  replicationAllowanceMs: 30_000,
  membershipCacheTtlMs: 60_000,
  maxStalenessMs: 120_000,
});
console.log(revocationBoundMs); // 90000
```

## Testing adapters with the conformance suite

`@netscript/plugin-directory-core/testing` provides an in-memory `DirectoryPort`, a deterministic
clock (`createDeterministicClock`), an invented `example.test` conformance dataset
(`DIRECTORY_CONFORMANCE_DATASET`), and `runDirectoryConformanceSuite`. Every directory adapter runs
the same one-call suite to verify:

- direct, multi-level nested, and cyclic group membership;
- Active Directory-style primary-group membership not listed in group `member` attributes;
- disabled users and clock-driven expired users failing closed on `memberOfAny`;
- mandatory search limit validation, ceiling capping, and `truncated` reporting;
- hostile search payloads (LDAP metacharacters, wildcards, hex escapes, NUL bytes, blank queries);
- unknown and duplicated `candidateGroupIds`;
- timeout budgets and aborted timeout signals throwing `DirectoryTimeout`;
- redacted `health()` output with no credentials or distinguished names.

```ts
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

console.log(report.passed);
```

## Next steps

- {{ comp.xref({ key: "ref:plugin-directory-core", text: "@netscript/plugin-directory-core reference" }) }}:
  complete symbol inventory for the root, domain, ports, and testing entrypoints.
- {{ comp.xref({ key: "cap:auth", text: "Authentication" }) }}: session sign-in and `Principal`
  verification through `@netscript/plugin-auth`.
