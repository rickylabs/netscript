---
layout: layouts/base.vto
title: "@netscript/plugin-directory-core"
---

# `@netscript/plugin-directory-core`

Provider-neutral directory port, domain types, fail-closed invariants, typed errors, and the
conformance testing kit shared by NetScript directory adapters. Zero provider SDK imports.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-directory-core` | `./mod.ts` | Curated root contract: `DirectoryPort`, domain types, invariants, and typed errors. |
| `@netscript/plugin-directory-core/domain` | `./src/domain/mod.ts` | [Domain types, health shapes, and invariants](#domain-types-and-invariants). |
| `@netscript/plugin-directory-core/ports` | `./src/ports/mod.ts` | [`DirectoryPort`, queries, clock, deadlines, and typed errors](#port-and-typed-errors). |
| `@netscript/plugin-directory-core/testing` | `./src/testing/mod.ts` | [In-memory port, deterministic clock, dataset, and conformance suite](#testing-kit). |

## Port and typed errors

| Symbol | Kind | Description |
| --- | --- | --- |
| `DirectoryPort` | interface | Provider-neutral directory query port (`searchUsers`, `searchGroups`, `getUser`, `memberOfAny`, `health`). |
| `DirectoryClock` | interface | Wall-clock interface (`nowMs`, `nowIso`) shared by production adapters and test doubles. |
| `createSystemDirectoryClock` | function | Create a live wall clock backed by `Date.now()`. |
| `DIRECTORY_MAX_TIMEOUT_MS` | const | Maximum safe 32-bit timer delay accepted for `CallContext.timeoutMs` (`2_147_483_647` ms). |
| `DirectoryDeadlineParams` | type alias | Parameters accepted by `runWithDirectoryDeadline`. |
| `resolveDirectoryTimeoutMs` | function | Validates `CallContext.timeoutMs` or default timeout against `DIRECTORY_MAX_TIMEOUT_MS`. |
| `classifyDirectoryAbortError` | function | Maps `AbortSignal.reason` to `DirectoryTimeout` (timeout) or `DirectoryUnavailable` (caller abort). |
| `assertDirectoryCallContext` | function | Validates `CallContext` before directory I/O (`RangeError`, `DirectoryTimeout`, or `DirectoryUnavailable`). |
| `runWithDirectoryDeadline` | function | Races an async directory operation against `timeoutMs` and `AbortSignal` with guaranteed cleanup. |
| `SearchUsersQuery` | type alias | Bounded user search input (`{ text, limit }`). |
| `SearchGroupsQuery` | type alias | Bounded group search input (`{ text, limit }`). |
| `MemberOfAnyQuery` | type alias | Bounded candidate-group membership query (`{ user, candidateGroupIds }`). |
| `MemberOfAnyResult` | type alias | Membership result carrying `memberOf`, `evaluatedAt`, and `consistency`. |
| `DIRECTORY_ERROR_CODES` | const | Machine-readable error code constants for directory failures. |
| `DirectoryErrorCode` | type alias | Union of machine-readable directory error codes. |
| `DirectoryTimeoutOptions` | interface | Error options adding optional `timeoutMs` for `DirectoryTimeout`. |
| `DirectoryError` | class | Base typed directory error with `code`, `directoryName`, `operation`, and redacted `reason`. |
| `DirectoryUnavailable` | class | Thrown when directory hosts are unreachable, fail TLS, or return transient server errors. |
| `DirectoryUnauthorized` | class | Thrown when service-account authentication or directory read authorization fails. |
| `DirectoryTimeout` | class | Thrown when a call exceeds its caller timeout budget or server time limit. |
| `DirectoryUnsupported` | class | Thrown when an operation or capability sits outside the adapter's upstream boundary. |
| `isDirectoryError` | function | Type guard narrowing an unknown value to `DirectoryError`. |

## Domain types and invariants

| Symbol | Kind | Description |
| --- | --- | --- |
| `DIRECTORY_MIN_SEARCH_LIMIT` | const | Minimum positive integer search limit (`1`). |
| `DIRECTORY_MAX_SEARCH_LIMIT` | const | Default maximum search limit ceiling (`100`). |
| `DirectoryRef` | type alias | Stable `(directoryInstance, immutableId)` object reference. |
| `DirectoryCapability` | type alias | Adapter capability literal (`'search'`, `'transitive-membership'`, `'change-events'`). |
| `CallContext` | type alias | Per-call cancellation (`signal`), timeout (`timeoutMs`), and trace context. |
| `Page` | type alias | Bounded search page carrying `items`, `truncated`, and `evaluatedAt`. |
| `DirectoryUser` | type alias | Normalized user record with `ref`, `immutableId`, `enabled`, optional `expiresAt`, and attributes. |
| `DirectoryGroup` | type alias | Normalized group record with `ref`, `immutableId`, `displayName`, and optional attributes. |
| `UserLookup` | type alias | Lookup selector by `DirectoryRef` or instance-scoped UPN, email, or username. |
| `ConsistencySource` | type alias | Origin discriminator (`'live'` or `'cache'`) for membership evaluations. |
| `ConsistencyInfo` | type alias | Freshness metadata (`{ source, ageMs }`) returned with `memberOfAny`. |
| `DirectoryConsistencyBudget` | type alias | Revocation and staleness budget configuration (`replicationAllowanceMs`, `membershipCacheTtlMs`, `maxStalenessMs`). |
| `DirectoryHealthStatus` | type alias | Aggregate dependency status (`'healthy'`, `'degraded'`, `'unhealthy'`). |
| `DirectoryHealthProbeStatus` | type alias | Individual probe status (`'pass'`, `'warn'`, `'fail'`, `'info'`). |
| `DirectoryHealthProbe` | type alias | Redacted dependency probe entry with no credentials or distinguished names. |
| `DirectoryHealth` | type alias | Typed dependency health payload returned by `DirectoryPort.health`. |
| `normalizeDirectorySearchLimit` | function | Validates mandatory positive integer `limit` and caps it at `maxLimit`. |
| `isDirectoryUserActive` | function | Fail-closed check requiring `enabled === true` and a future valid `expiresAt` when set. |
| `computeRevocationBoundMs` | function | Computes `replicationAllowanceMs + membershipCacheTtlMs` after validating budget fields. |

## Testing kit

Exported from `@netscript/plugin-directory-core/testing`.

| Symbol | Kind | Description |
| --- | --- | --- |
| `DEFAULT_DETERMINISTIC_CLOCK_ISO` | const | Default initial ISO-8601 UTC timestamp for `createDeterministicClock`. |
| `DirectoryClock` | interface | Wall-clock interface (`nowMs`, `nowIso`) injected into adapters and test doubles. |
| `DeterministicDirectoryClock` | interface | Controllable clock extending `DirectoryClock` with `advanceMs` and `set`. |
| `createDeterministicClock` | function | Create a deterministic clock for expiry and `evaluatedAt` testing. |
| `createSystemDirectoryClock` | function | Create a live wall clock backed by `Date.now()`. |
| `DIRECTORY_CONFORMANCE_INITIAL_TIME_ISO` | const | Initial UTC timestamp used by the conformance suite. |
| `DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS` | const | Milliseconds advanced during the clock-driven expiry test. |
| `DIRECTORY_CONFORMANCE_DATASET` | const | Canonical invented `example.test` users and groups seeded by every adapter test. |
| `DirectoryConformanceDataset` | type alias | Shape of the canonical conformance dataset and named IDs. |
| `InMemoryDirectoryUser` | type alias | Seed user shape supporting `primaryGroupId` separate from group `member` lists. |
| `InMemoryDirectoryGroup` | type alias | Seed group shape supporting direct `memberUserIds` and nested `memberGroupIds`. |
| `DirectoryOperationName` | type alias | Port operation name union accepted by failure-simulation hooks. |
| `InMemoryDirectoryOptions` | type alias | Configuration accepted by `createInMemoryDirectoryPort`. |
| `createInMemoryDirectoryPort` | function | Create an in-memory `DirectoryPort` implementing all core invariants. |
| `DirectoryConformanceFixture` | type alias | Fixture returned by an adapter factory for each conformance case. |
| `DirectoryConformanceSuiteOptions` | type alias | Options accepted by `runDirectoryConformanceSuite` and `verifyDirectoryConformance`. |
| `DirectoryConformanceCaseResult` | type alias | Per-scenario pass record inside `DirectoryConformanceReport`. |
| `DirectoryConformanceReport` | type alias | Aggregate report returned by `verifyDirectoryConformance`. |
| `verifyDirectoryConformance` | function | Execute every conformance scenario programmatically and return a structured report. |
| `runDirectoryConformanceSuite` | function | Register the full conformance suite with `Deno.test` in one call. |
