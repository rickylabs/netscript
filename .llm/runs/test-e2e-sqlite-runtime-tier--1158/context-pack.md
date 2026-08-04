# Context Pack: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`  |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`   |
| Current phase  | `implement` — S2 gates green; supervisor review pending |
| Archetype      | `6 - CLI / Tooling`                   |
| Scope overlays | `service`                             |

## Current State

Bootstrap, Research, Plan & Design, and PLAN-EVAL are complete; `plan-eval.md` records `PASS` at
commit `dd178da7`. The Tier-A supervisor narrowed S1 under drift D-5 to the three
permission-bearing generators. The implementation now shares the database permission rule across
services, background processors, and plugin services; the pipeline threads the primary engine to
all three. Apps remain unchanged because they launch through `deno task`, and their generated task
already uses `deno run --allow-all`.

S2 now adds the default-true `RunOptions.cache` axis, `--cache` / `--no-cache` parsing, workspace
builder plumbing, and conditional `scaffold.init` forwarding. The real public binary rejects
`--no-cache` but accepts both `--cache=false` and `--cache false`; the E2E uses the single-argv
`--cache=false` spelling. No fallback edit under `packages/cli/src/**` was needed. The default init
argv remains byte-identical by golden assertion.

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

## In Progress

- **S2 awaiting Tier-A slice review.** Automated gates are green; the implementation lane does not
  self-certify or begin S3.

## Next Steps

1. Tier-A supervisor substantively reviews the landed S2 implementation and reproduces its evidence.
2. Supervisor records the S2 sign-off or returns findings; the implementation lane does not
   self-certify.
3. Only after supervisor sign-off may the run proceed to S3.
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
| `.llm/runs/test-e2e-sqlite-runtime-tier--1158/{worklog,context-pack}.md` | modified | S2 evidence and Tier-A handoff state. |
| `packages/cli/e2e/src/domain/run-context.ts` | modified | Required boolean `RunOptions.cache` axis. |
| `packages/cli/e2e/src/{create-default-runner,application/builders/workspace/suite-builder-options}.ts` | modified | Both default factories preserve cache-on behavior. |
| `packages/cli/e2e/src/presentation/cli/{commands,options}/**` | modified | `--cache` / `--no-cache` declaration and mapping. |
| `packages/cli/e2e/src/application/{builders/workspace,gates/scaffold}/**` | modified | Builder plumbing and conditional `--cache=false` forwarding. |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` | modified | Cache override threaded beside cleanup. |
| `packages/cli/e2e/tests/**` | modified | Golden default argv, exact-once no-cache, parse tests, and typed fixtures. |

No `packages/cli/src/**`, suite id, per-suite default, GitHub, cleanup, product cache default, or
embedded-template file was touched.

## Gates

| Gate family | Current status | Evidence                                            |
| ----------- | -------------- | --------------------------------------------------- |
| Static      | `PASS`         | S2 scoped check/lint/fmt: 786 files, 0 findings.    |
| Fitness     | `PASS`         | S2 `quality:scan` and `arch:check` exited 0.        |
| Runtime     | `NOT_RUN`      | S7 is the first live sqlite run.                    |
| Consumer    | `PASS`         | S2: 97 E2E tests; default init argv byte-identical. |

## Open Questions

1. Exact init spelling is resolved: both `--cache=false` and `--cache false` are accepted;
   `--no-cache` is rejected. S2 uses the single-argv equals spelling, and no product-command fallback
   was required.
2. Does the Garnet dotnet-tool executable arm start on `ubuntu-latest`? — S7, with a pre-agreed
   downgrade path.
3. Any silently postgres-shaped behavior gate? — S7.

## Drift and Debt

- **Drift:** D-1 supervisor lane override (minor); D-2 carried-in root cause wrong (significant);
  D-3 #1191 fix is services-only, new blocker (significant); D-4 CI "no docker service" framing
  (minor); D-5 apps have no permission-bearing command (significant); D-6 resumed cache-spelling
  probe corrected the partial handoff evidence (minor). All in `drift.md`.
- **Debt:** two entries to create at Close — the unreachable `Mode: 'Local'` cache arm, and
  `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forcing a container on every scaffold.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
