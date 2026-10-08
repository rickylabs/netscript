# C3 worklog

## Design

External system: PostgreSQL. Port: true root/callback transaction boundary plus callback-derived SQL
and generated row bridge. Named adapter: PostgreSQL command store. Composition root is
consumer-owned generated bridge. Side-record delegates cannot accept a root client. Business
callback excludes nested transaction and lifecycle methods. Import starts no connection or DDL.
Consumer declares database network/environment permissions. Contributor path: implement the same
callback-bound port and real-provider conformance for a later SQL adapter. CLI generators, other
providers, telemetry, relay and saga producer are deferred. No new debt.

| Phase         | State                                                    |
| ------------- | -------------------------------------------------------- |
| Bootstrap     | Complete; branch from current main                       |
| Research      | Complete; issue/comments/RFC/current contracts consulted |
| Plan & Design | Approved chain S7–S9, re-baselined                       |
| Plan-Gate     | Reused independent PASS                                  |
| Implement     | Pending RED tests                                        |
| Gate          | Pending                                                  |
| Evaluate      | Pending independent IMPL-EVAL                            |
| Release       | Pending CI; no merge authorized                          |
| Close         | Pending evidence                                         |

S7: RED exit 1; scoped check/lint/fmt exit 0; true callback and generated type tests pass. Three
semantic mutants fail their named tests, restored source passes. Schema/bridge/migration manually
reviewed. Transient Prisma probes use separate consumer config because generated declarations do not
support isolatedDeclarations. See s7-evidence.json.

S8: real-provider RED exit 1; six generated Prisma/PostgreSQL cases and six semantic production
mutations qualify safe claims, rollback, clean follow-up and retryability. Isolated provider CI
script and structured source/quality gates exit 0. See s8-provider-evidence.json and
s8-supervisor-review.md.

S9 adds actual deferred-constraint commit rejection beyond callback-thrown faults: state/receipt
rows roll back after the callback returns, phase is commit, and one callback is preserved. A
semantic classification mutant fails the named case; restored and full seven-case provider run pass.
Arbitrary driver-looking business errors preserve identity. Documentation gate exposed private type
annotations: the root and PostgreSQL manifests now re-export their owning transaction/return types.
Initial root check/lint/fmt/quality/architecture and 256 service/contracts/database tests pass;
final native docs/publish/prod-install and regenerated-consumer qualification follows.

## IMPL-EVAL round 1 and repair

Google fallback independently returned FAIL_FIX at a0e9613d0e1ab951eb399d9fd7835bbb87dc19ca. Full
documentation exit was inaccurately recorded: per-entrypoint failures persisted despite a clean
combined summary. Historical qualification now records exit 1 and preserves the correction.
Explicitly exported the complete own-port annotation graph; verified every export entrypoint and
combined documentation exit 0. Original public claims corrected. Normal merge of current main
6d1eaf5a221ce29fa55c0bfd10e3b5c7d66101e3 preserves merged authentication and stream repairs.
Conflicting generated carriers take main then regenerate with Deno 2.9.5. Requalification and
same-session re-evaluation remain pending.
