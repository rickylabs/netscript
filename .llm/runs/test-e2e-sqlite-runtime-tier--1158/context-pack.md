# Context Pack: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`       |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`        |
| Current phase  | `implement` — S7 complete; closeout        |
| Archetype      | `6 - CLI / Tooling`                        |
| Scope overlays | `service`                                  |

## Current State

Bootstrap, Research, Plan & Design, and PLAN-EVAL are complete; `plan-eval.md` records `PASS` at
commit `dd178da7`. The Tier-A supervisor narrowed S1 under drift D-5 to the three permission-bearing
generators. The implementation now shares the database permission rule across services, background
processors, and plugin services; the pipeline threads the primary engine to all three. Apps remain
unchanged because they launch through `deno task`, and their generated task already uses
`deno run --allow-all`.

S2 adds the default-true `RunOptions.cache` axis, `--cache` / `--no-cache` parsing, workspace builder
plumbing, and conditional `scaffold.init` forwarding. The public binary rejects `--no-cache` but
accepts both `--cache=false` and `--cache false`; the E2E uses the single-argv `--cache=false`
spelling. S7 exposed a verification gap: the live E2E resolves `bin/netscript-dev.ts`, whose
maintainer init command did not accept `--cache`. That maintainer-only command now declares and
forwards the option (D-16); the public CLI remains unchanged.

S3 adds `ScaffoldCapabilitySuite.defaults?: Partial<RunOptions>` and resolves capability defaults
under caller overrides once at the top of `createScaffoldCapabilitySuite`. Every builder and
reporting read now uses that resolved object. The existing `resolveSuite` caller-wins spread is
unchanged, so a sqlite capability default survives an empty override and an explicit postgres
override still wins. Database wait filtering reads the materialized default options and follows the
resolved engine. No existing built-in capability has a defaults object.

S4 adds the `scaffold.runtime.sqlite` capability with sqlite/cache-off defaults. The generic `run`
command no longer supplies implicit db/cache overrides, because those masked capability defaults
(drift D-10); unchanged suite defaults keep `scaffold.runtime` postgres/cache-on, and `full` retains
its explicit postgres/cache-on defaults. S7 removed the experimental executable-Garnet pin after
cross-process state visibility failed (D-14), so ambient container-backed Garnet is retained. The
sqlite gate list now differs from `RUNTIME_GATES` by exactly `behavior.service-health`, whose tagged
Prisma raw query is libSQL-incompatible (D-15); the Postgres suite remains unchanged.

S4a corrects the adversarial-review finding in S4's lease surface. A shared
`EXPENSIVE_RUNTIME_SUITE_IDS` tuple now contains both runtime tiers, and the suite runner acquires
the expensive-suite lease by membership rather than a literal postgres id comparison. Runner tests
prove postgres-held→sqlite and sqlite-held→postgres contention both raise
`SuiteLeaseContentionError`; the existing cheap `scaffold.service` path still takes no lease.
`suite-lease.ts` remains unchanged because its `isSuiteId` parser already accepts every `SCAFFOLD`
value. The built-in suites table now discovers the reduced-container sqlite tier.

S5 makes Docker resource discovery tolerant without weakening resource removal. The adapter's
private list path turns a missing Docker executable (`Deno.errors.NotFound`) or non-zero `docker ps`
into an empty container set and emits a warning through an injected writer that defaults to direct
`Deno.stderr` output. The port contract and suite runner stay unchanged. Adapter tests cover both
discovery failures, a no-new-container prune, and strict failed removal; a runner test uses
`cleanup: true` with the real adapter raising `NotFound` on snapshot and prune and returns an `ok`
report.

S6 extends the classifier with `run_runtime_sqlite`, derived as `run_static && !ci:skip-e2e` after
the precedence-winning `ci:full` path. The new `scaffold-runtime-sqlite` workflow job uses the same
draft, `diff_unavailable`, skipped-by-policy, and failed-classifier guards as its siblings; installs
Deno 2.9.0, .NET 10, and Aspire CLI 13.4.6; and invokes the sqlite suite with cleanup plus a
distinct report artifact. S7 removed its executable-Garnet environment pin, leaving the default
container-backed Garnet arm. Its 40-minute timeout remains 20 minutes shorter than the Postgres job.
An independent concurrency group prevents either runtime tier from queueing behind the other.
`lane-visibility` reports the sqlite result. The three frozen `ci:*` labels and the existing
postgres/draft jobs are unchanged.

S6a closes the adversarial diagnostics/test gap without changing that boolean. Every sqlite policy
branch now contributes an explicit reason: skipped by `ci:skip-e2e`, skipped because the static
signal is off (including `ci:skip-scaffold`), forced by `ci:full`, or selected by the scaffold
signal. Workflow-source coverage pins non-PR `ci:skip-scaffold`, lane visibility, concurrency and
artifact distinctness, auxiliary report globs, and the suite id exported from `cli-surface.ts`. The
workflow and classifier prose now state the derived `ci:skip-scaffold` effect, and only the two
stale label descriptions changed; the frozen label set remains exactly three.

S7 completes the live tier. Three instrumented executable-Garnet attempts proved healthy processes
but inconsistent cross-process job/queue/execution visibility, resolving R-3 negatively and taking
the pre-agreed D2 downgrade. The first container-backed run passed all workers gates and then isolated
the sole provider-specific `behavior.service-health` failure, resolving R-4 through the locked
one-gate sqlite exclusion. The final run passed 68/68 selected gates and cleanup. The before/after
container snapshots contain the same foreign Postgres container and `comm -13` is empty: Garnet was
created during the run and removed by cleanup, so the honest net container delta is zero.

## Completed

- Skills activated: `netscript-harness`, `netscript-doctrine` (archetype + verdict),
  `netscript-cli`, `netscript-pr`, `jsr-audit` (surface scan recorded in `research.md`).
- Research pass with 18 verified findings, each cited at `file:line`.
- Archetype 6 + `SCOPE-service` selected and justified; doctrine verdict recorded.
- Plan with 10 locked decisions, an open-decision sweep (3 "must resolve now", each resolved inside
  its own slice), a 9-entry risk register, gate set, debt implications, and a validation plan.
- Design checkpoint: public surface, vocabulary, ports (none created, with rationale), constants, 7
  commit slices, deferred scope, contributor path.
- Branch created, run dir committed, draft PR opened.
- Rescoped S1 implemented with exact-once SQLite FFI, explicit-permission deduplication, pipeline
  propagation, and byte-identical non-SQLite assertions.
- All six S1 gates passed: helper tests, scoped check/lint/fmt, `quality:scan`, and `arch:check`.
- S1 received Tier-A substantive review and sign-off at `d06e7c94`.
- S2 R-2 probe completed: `--no-cache` exit 2; `--cache=false` and `--cache false` exit 0. The
  materialized no-cache config retained only the empty schema section `Cache: {}` and omitted
  `PrimaryCache`.
- S2 implementation completed with 97 E2E tests passing and all scoped/fitness gates green.
- S2 received Tier-A substantive review with no findings and sign-off at `47caa6bb`.
- S3 implementation completed with precedence, database-gate filtering, and exact built-in options
  regression coverage; 99 E2E tests and all five static/fitness commands passed.
- S3 received Tier-A substantive review with no findings; all six required gates were reproduced
  independently. Sign-off recorded in `worklog.md`.
- S4 implementation completed with the additive suite profile, operator-first cache-mode seam, real
  CLI default/override coverage, and wait/resource consistency assertions. All six required gates
  passed: 104 E2E tests plus scoped check/lint/fmt, `quality:scan`, and `arch:check`.
- S4a lease correction completed with bidirectional runtime-tier contention coverage and the cheap
  suite negative control. All six requested gates passed: 105 E2E tests, scoped check/lint/fmt,
  `quality:scan`, and `arch:check`; `e2e:cli suites` listed both runtime tiers.
- S5 implementation completed with both Docker discovery failures tolerated, direct-stderr warning
  visibility, no-container pruning, strict failed-removal preservation, and runner-level
  `cleanup: true` coverage. All six requested gates passed: 110 E2E tests; 787-file scoped
  check/lint/fmt scans; `quality:scan`; and `arch:check`.
- S5 received Tier-A substantive review with no findings and sign-off at `1335ab26`.
- S6 implementation completed with the full classifier matrix, failed-classifier and
  `diff_unavailable` workflow assertions, lane visibility, and an explicit YAML parse. All four
  requested gates passed; 54 classifier/draft-policy tests passed.
- S6a diagnostics remediation completed with all reason branches and named mutation holes pinned,
  sibling-aligned report collection, explicit `@std/yaml` parsing, and all gates green: 56 tests
  plus scoped check/lint/fmt with zero findings.
- S7 live runtime completed after the locked R-3 downgrade and R-4 provider-specific gate
  exclusion. The selected suite passed 68/68 gates, including cleanup; all database gates,
  `runtime.wait.garnet`, `runtime.wait.workers`, and the workers job/seed/trigger/execution chain
  passed. R-5 therefore resolves positively.
- The complete package gate passed: 605 tests, scoped check/lint/fmt over 789 files, `quality:scan`,
  `arch:check`, and suite discovery. The final container snapshot delta is empty after cleanup.

## In Progress

- **Implementation closeout only:** commit the S7 source/tests/artifacts, push the explicit branch
  refspec, post the evidence comment to PR #1220, and stop. This lane does not review, self-certify,
  dispatch a reviewer, or author a sign-off commit (D-7).

## Next Steps

1. External supervisor/reviewer evaluates the pushed S7 implementation and evidence; this lane does
   not dispatch that work.
2. Later merge-readiness work retains the full Postgres `scaffold.runtime` regression and separate
   IMPL-EVAL session.

## Key Decisions

| Decision                                                                             | Source                                               | Notes                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| `D0` S1 extends SQLite `--allow-ffi` across permission-bearing resources             | code — shared database-permissions helper            | Services, background processors, and plugins; apps excluded. |
| `D1` additive suite id `scaffold.runtime.sqlite`                                     | plan / owner constraint 1                            | Default `scaffold.runtime` untouched.                        |
| `D2` reduced-container profile = sqlite + cache disabled + ambient Garnet arm | S7 / drift D-14 | Executable Garnet failed cross-process state semantics; Postgres and Redis remain eliminated. |
| `D3` boolean `RunOptions.cache`, **no** `cacheBackend` axis                          | code — `generate-appsettings.ts:251-259`             | `deno-kv` emits `External`, not `Local`.                     |
| `D4` runtime waits unchanged; garnet **not** filtered                                | code — `runtime-gates.ts:390-405`                    | Same resource name in both arms.                             |
| `D5` per-suite `defaults` merged under caller overrides                              | code — `capability-suites.ts:168-192`                | A suite id alone cannot pin an engine today.                 |
| `E5` classifier output `run_runtime_sqlite`, no new `ci:*` labels                    | code — `ci-classify-changes.ts:292-360`              | Keeps `ci:skip-e2e` authoritative over both runtime tiers.   |
| `D6` merge-readiness stays postgres                                                  | issue #1158 constraints                              | No change to `full-command.ts`.                              |
| `D8` Docker cleanup tolerant on both failure paths                                   | code — `docker-resource-cleaner.ts:9-43`             | Missing binary **and** non-zero `docker ps`.                 |

## S7 Files Changed

| Area | Notes |
| ---- | ----- |
| permissions | SQLite `--allow-all` expands to include FFI, with direct helper coverage. |
| maintainer init | `netscript-dev init` accepts and forwards `--cache`; public CLI unchanged. |
| runtime readiness | Workers scheduler and pool readiness gate plus builder coverage. |
| suite policy | Executable Garnet pin removed; sqlite excludes only `behavior.service-health`. |
| CI + artifacts | Workflow follows ambient Garnet; plan, drift, worklog, context, and leak evidence reconciled. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | `PASS` | 605 package tests; scoped check/lint/fmt over 789 files. |
| Fitness | `PASS` | `quality:scan` green with no findings; `arch:check` exit 0. |
| Runtime | `PASS` | `scaffold.runtime.sqlite`: 68 passed, 0 failed; cleanup passed. |
| Consumer | `PASS` | Database, workers, plugin, auth, AI, UI, and OTEL behavior gates passed. |
| Discovery | `PASS` | `deno task e2e:cli suites` lists both runtime tiers with honest titles. |

## Open Questions

1. Exact init spelling is resolved: both `--cache=false` and `--cache false` are accepted;
   `--no-cache` is rejected. S2 uses the single-argv equals spelling, and no public-command fallback
   was required; S7 separately corrected the maintainer command path under D-16.
2. R-3 is resolved negatively: executable Garnet starts but does not provide reliable cross-process
   state semantics; D2 uses ambient container-backed Garnet.
3. R-4 found exactly one Postgres-shaped behavior gate: `behavior.service-health`; it is excluded
   only from sqlite and retained unchanged in `scaffold.runtime`.
4. R-5 is resolved positively: plugin-add restores the Garnet primary-cache configuration before
   runtime behavior; jobs, seed, trigger, and execution gates all pass.

## Drift and Debt

- **Drift:** D-1 supervisor lane override (minor); D-2 carried-in root cause wrong (significant);
  D-3 #1191 fix is services-only, new blocker (significant); D-4 CI "no docker service" framing
  (minor); D-5 apps have no permission-bearing command (significant); D-6 resumed cache-spelling
  probe corrected the partial handoff evidence (minor); D-7 self-certification breach (significant);
  D-8 owner-authorized supplementary verification lane (minor); D-9 adversarial-check escalation
  order (minor); D-10 generic `run` defaults masked capability defaults (significant); D-11
  concurrent supervisor commit swept the S4 worktree (significant); D-12 assigns that sweep to the
  supervisor (significant); D-13 records S4's omitted sqlite lease membership (significant); D-14
  records the executable-Garnet downgrade (significant); D-15 records the libSQL-incompatible
  service-health gate (significant); D-16 records the maintainer-init `--cache` verification gap
  (significant). All in `drift.md`.
- **Debt:** two entries to create at Close — the unreachable `Mode: 'Local'` cache arm, and
  `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forcing a container on every scaffold.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
