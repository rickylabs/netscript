# Context Pack: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`  |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`   |
| Current phase  | `implement` — S1 gates green; supervisor review pending |
| Archetype      | `6 - CLI / Tooling`                   |
| Scope overlays | `service`                             |

## Current State

Bootstrap, Research, Plan & Design, and PLAN-EVAL are complete; `plan-eval.md` records `PASS` at
commit `dd178da7`. The Tier-A supervisor narrowed S1 under drift D-5 to the three
permission-bearing generators. The implementation now shares the database permission rule across
services, background processors, and plugin services; the pipeline threads the primary engine to
all three. Apps remain unchanged because they launch through `deno task`, and their generated task
already uses `deno run --allow-all`.

The carried-in draft from the failed Copilot/Grok run was re-derived against `main` @ `c6f243da` and
**corrected in four places**; two corrections are blockers. The plan's D2/D3/D4/E5 deliberately
supersede the draft's decisions of the same names.

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

## In Progress

- **S1 awaiting Tier-A slice review.** Automated gates are green; the implementation lane does not
  self-certify or begin S2.

## Next Steps

1. Tier-A supervisor substantively reviews the landed S1 implementation and evidence.
2. Supervisor records the S1 sign-off or returns findings. Do not encode `--allow-ffi` as a
   `deno task` argument or generated comment.
3. Only after supervisor sign-off may the run proceed to S2.
4. Gate phase: scoped wrappers + `quality:scan` + `arch:check` + `publish:dry-run`, then the
   postgres `scaffold.runtime` regression run.
5. IMPL-EVAL in a third session.

## Key Decisions

| Decision                                                                             | Source                                               | Notes                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| `D0` S1 extends #1191's `--allow-ffi` to apps/background/plugins first               | code — `generate-register-services.ts:32-38`         | Hard blocker; nothing else can be green without it.          |
| `D1` additive suite id `scaffold.runtime.sqlite`                                     | plan / owner constraint 1                            | Default `scaffold.runtime` untouched.                        |
| `D2` no-Docker profile = sqlite + cache disabled + `NETSCRIPT_CACHE_MODE=Executable` | code — `generate-register-infrastructure.ts:182-212` | Corrects the draft: garnet was never the blocker; redis was. |
| `D3` boolean `RunOptions.cache`, **no** `cacheBackend` axis                          | code — `generate-appsettings.ts:251-259`             | `deno-kv` emits `External`, not `Local`.                     |
| `D4` runtime waits unchanged; garnet **not** filtered                                | code — `runtime-gates.ts:390-405`                    | Same resource name in both arms.                             |
| `D5` per-suite `defaults` merged under caller overrides                              | code — `capability-suites.ts:168-192`                | A suite id alone cannot pin an engine today.                 |
| `E5` classifier output `run_runtime_sqlite`, no new `ci:*` labels                    | code — `ci-classify-changes.ts:292-360`              | Keeps `ci:skip-e2e` authoritative over both runtime tiers.   |
| `D6` merge-readiness stays postgres                                                  | issue #1158 constraints                              | No change to `full-command.ts`.                              |
| `D8` Docker cleanup tolerant on both failure paths                                   | code — `docker-resource-cleaner.ts:9-43`             | Missing binary **and** non-zero `docker ps`.                 |

## Files Changed

| Path                                                                           | Status   | Notes                                                          |
| ------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------- |
| `.llm/runs/test-e2e-sqlite-runtime-tier--1158/{worklog,context-pack}.md` | modified | S1 evidence and handoff state. |
| `packages/cli/src/kernel/templates/aspire/helpers/register/{database-permissions,generate-register-services,generate-register-background,generate-register-plugins}.ts` | modified/new | Shared SQLite permission policy and three consumers. |
| `packages/cli/src/kernel/templates/aspire/helpers/{types,helpers-generator-pipeline}.ts` | modified | Optional engine contracts and call-site threading. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/*` | modified | Semantic permission and non-SQLite invariance coverage. |

No app generator, `RegisterAppsOptions`, E2E, GitHub, cache, or embedded-template file was touched.

## Gates

| Gate family | Current status | Evidence                                            |
| ----------- | -------------- | --------------------------------------------------- |
| Static      | `PASS`         | Scoped check/lint/fmt wrappers: 0 findings.         |
| Fitness     | `PASS`         | `quality:scan` and `arch:check` exited 0.           |
| Runtime     | `NOT_RUN`      | S7 is the first live sqlite run.                    |
| Consumer    | `PASS`         | Semantic tests prove non-SQLite output invariance. |

## Open Questions

1. Exact init spelling to disable the cache (`--cache false` vs a declared `--no-cache`) — S2; not started.
2. Does the Garnet dotnet-tool executable arm start on `ubuntu-latest`? — S7, with a pre-agreed
   downgrade path.
3. Any silently postgres-shaped behavior gate? — S7.

## Drift and Debt

- **Drift:** D-1 supervisor lane override (minor); D-2 carried-in root cause wrong (significant);
  D-3 #1191 fix is services-only, new blocker (significant); D-4 CI "no docker service" framing
  (minor). All in `drift.md`.
- **Debt:** two entries to create at Close — the unreachable `Mode: 'Local'` cache arm, and
  `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forcing a container on every scaffold.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
