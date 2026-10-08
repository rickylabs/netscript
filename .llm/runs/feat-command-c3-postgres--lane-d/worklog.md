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

## Repair qualification

Exact product 10286a1efe4d1574ad9d4b22a17f9a7082657e85: repository
check/lint/format/quality/architecture, targeted tests, all four pinned generated freshness checks,
full export documentation (every entrypoint), JSR audit, native publish, production install and
seven-case native provider gate all exit 0. See repair-qualification.json and gates.log.
Same-session independent round 2 is next; no native CI or readiness claim.

## Independent round 2 PASS

Same Google fallback conversation returns PASS at exact product
10286a1efe4d1574ad9d4b22a17f9a7082657e85. Native CLI exits 0. Round 1 and transparent correction
retained. Final review-record follow-up changes harness artifacts only; current-head native CI and
issue evidence/readiness are next.

## Ready-state CI private lock repair

Native Fresh UI quality detected stale private workspace dependency metadata: missing database
direct driver-adapter-utils membership. Native Deno 2.9.5 lock:update produces exactly one added
line. Semantic comparison proves all resolved versions and integrity records unchanged. Fresh UI
frozen package check exits 0. No framework source, test, tool or generated consumer behavior
changes. Same independent evaluator will verify this dependency-metadata delta against prior PASS;
new current-head CI remains required.

## Independent round 3 PASS

Same Google fallback conversation independently verifies exact product
5138748194002ef1afdb95edfb798ddd7f08bb1f and returns PASS. Native CLI exits 0. Reviewer confirms one
private workspace membership line, identical versions/integrities, frozen package checks, all four
generated freshness checks, all documentation entrypoints and exact source manifest. Prior round-2
provider/type/mutation/publish qualification remains applicable. Final follow-up changes harness
artifacts only; full native current-head CI and final handoff still pending.

## Current-main reconciliation and native workflow inventory

Normal merge preserves upstream native chat repair f257f9627. Only MCP corpus conflicts; take main
then regenerate with Deno 2.9.5. C3/database/service/contracts/root/private lock source remains
byte-identical to round-3 PASS. At e40472b7c all root/local/freshness/docs/publish gates pass again;
21 affected upstream chat tests and frozen Fresh UI package checks pass.

Prior ready-state native repository test reports 5540 pass and one failure: workflow concurrency
inventory lacked new command-postgres.yml. Added per-ref cancel-in-progress concurrency and
registered the workflow/expected block in the existing complete inventory test. Local RED 1, full
release workflow suite GREEN 0. Production cancel-in-progress mutant fails the named assertion;
restored 0 with exact bytes. Targeted type/lint/format pass. Repository lint/fmt selects
package/plugin roots and excludes .llm tools, so explicit tool-file verification uses no-config lint
and the same single-quote/100-column format policy. Initial no-target/default-style diagnostic
failures are retained privately, not counted green. Same-session reconciliation review and final
current-head CI are next; no readiness claim.

## Independent reconciliation round 4 PASS

Same Google fallback conversation returns PASS at product b4be6a282544dda2ca9161a4e1b00b78fb787eeb.
Reviewer independently confirms ordinary main preservation, byte-identical C3 framework/core/private
lock, bounded classified workflow and mutation, full release workflow test suite, affected native
chat tests, every database documentation entrypoint, frozen Fresh UI package checks, four pinned
generated consumers and exact 34-path source manifest. Native CLI exits 0. Final review follow-up is
artifact-only. Current-head functional native CI, acceptance/DoD/status, zero open review threads
and close-gate rerun remain handoff gates.

## Latest-main reconciliation qualification

Main 587be0dd7 merged independently qualified AI model/wire repair. Normal merge preserves all
upstream source and records; five conflicting generated carriers take main then refresh Deno 2.9.5.
Exact product 59d8a3b382d3996f26ed2e9ea93ffe5ca577c6f3: all
root/scoped/docs/publish/JSR/install/frozen/workflow/generated gates exit 0. C3
database/service/contracts/types/provider fixtures/tools/workflow/inventory and both locks unchanged
from round-4 PASS. Earlier final pushed 1f39b2c10 passes native full repository tests and all
browser/quality jobs; close-gate waits truthful final DoD. Same-session reconciliation review 5 and
final native current-head CI pending.

## Independent latest-main round 5 PASS

Same Google fallback conversation independently PASS at product
59d8a3b382d3996f26ed2e9ea93ffe5ca577c6f3. Native CLI exits 0. Reviewer verifies merged upstream AI
behavior, all C3 source/locks/workflow unchanged, five regenerated carriers, four Deno 2.9.5
freshness gates, frozen Fresh UI, all database doc entrypoints, eight workflow inventory tests and
complete 34-path manifest. Earlier full native repository/browser/quality CI passes. Final verdict
follow-up is artifact-only; final current-head native CI and truthful DoD/status/close-gate handoff
pending.
