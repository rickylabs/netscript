# C3 worklog

## Design

External system: PostgreSQL. Port: true root/callback transaction boundary plus callback-derived SQL and generated row bridge. Named adapter: PostgreSQL command store. Composition root is consumer-owned generated bridge. Side-record delegates cannot accept a root client. Business callback excludes nested transaction and lifecycle methods. Import starts no connection or DDL. Consumer declares database network/environment permissions.
Contributor path: implement the same callback-bound port and real-provider conformance for a later SQL adapter. CLI generators, other providers, telemetry, relay and saga producer are deferred. No new debt.

| Phase | State |
| --- | --- |
| Bootstrap | Complete; branch from current main |
| Research | Complete; issue/comments/RFC/current contracts consulted |
| Plan & Design | Approved chain S7–S9, re-baselined |
| Plan-Gate | Reused independent PASS |
| Implement | Pending RED tests |
| Gate | Pending |
| Evaluate | Pending independent IMPL-EVAL |
| Release | Pending CI; no merge authorized |
| Close | Pending evidence |

S7: RED exit 1; scoped check/lint/fmt exit 0; true callback and generated type tests pass. Three semantic mutants fail their named tests, restored source passes. Schema/bridge/migration manually reviewed. Transient Prisma probes use separate consumer config because generated declarations do not support isolatedDeclarations. See s7-evidence.json.

S8: real-provider RED exit 1; six generated Prisma/PostgreSQL cases and six semantic production mutations qualify safe claims, rollback, clean follow-up and retryability. Isolated provider CI script and structured source/quality gates exit 0. See s8-provider-evidence.json and s8-supervisor-review.md.
