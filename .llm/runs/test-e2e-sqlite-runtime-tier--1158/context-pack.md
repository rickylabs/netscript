# Context Pack: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`              |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`               |
| Current phase  | `implement` — S4 complete; awaiting Tier-A review |
| Archetype      | `6 - CLI / Tooling`                               |
| Scope overlays | `service`                                         |

## Current State

Bootstrap, Research, Plan & Design, and PLAN-EVAL are complete; `plan-eval.md` records `PASS` at
commit `dd178da7`. The Tier-A supervisor narrowed S1 under drift D-5 to the three permission-bearing
generators. The implementation now shares the database permission rule across services, background
processors, and plugin services; the pipeline threads the primary engine to all three. Apps remain
unchanged because they launch through `deno task`, and their generated task already uses
`deno run --allow-all`.

S2 now adds the default-true `RunOptions.cache` axis, `--cache` / `--no-cache` parsing, workspace
builder plumbing, and conditional `scaffold.init` forwarding. The real public binary rejects
`--no-cache` but accepts both `--cache=false` and `--cache false`; the E2E uses the single-argv
`--cache=false` spelling. No fallback edit under `packages/cli/src/**` was needed. The default init
argv remains byte-identical by golden assertion.

S3 adds `ScaffoldCapabilitySuite.defaults?: Partial<RunOptions>` and resolves capability defaults
under caller overrides once at the top of `createScaffoldCapabilitySuite`. Every builder and
reporting read now uses that resolved object. The existing `resolveSuite` caller-wins spread is
unchanged, so a sqlite capability default survives an empty override and an explicit postgres
override still wins. Database wait filtering reads the materialized default options and follows the
resolved engine. No existing built-in capability has a defaults object.

S4 adds the `scaffold.runtime.sqlite` capability with sqlite/cache-off defaults and reuses
`RUNTIME_GATES` by reference. Resolution pins `NETSCRIPT_CACHE_MODE=Executable` only when the
operator has not set it. The generic `run` command no longer supplies implicit db/cache overrides,
because those masked capability defaults (drift D-10); unchanged suite defaults keep
`scaffold.runtime` postgres/cache-on, and `full` retains its explicit postgres/cache-on defaults.
Wait gates are tested against `runtimeResources()` for sqlite and postgres, with Garnet retained in
both and no database resource wait on sqlite.

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

## In Progress

- **S4 awaits Tier-A substantive review.** The implementation lane has not reviewed, dispatched a
  reviewer, self-certified, or authored a sign-off commit.

## Next Steps

1. Tier-A supervisor reviews S4 and authors any sign-off commit.
2. **Stop before S5.** S5 requires a new slice instruction; do not start it from this handoff.
3. Gate phase: scoped wrappers + `quality:scan` + `arch:check` + `publish:dry-run`, then the
   postgres `scaffold.runtime` regression run.
4. IMPL-EVAL in a third session.

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

| Path                                                                           | Status   | Notes                                                                 |
| ------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------- |
| `.llm/runs/test-e2e-sqlite-runtime-tier--1158/{worklog,context-pack,drift}.md` | modified | S4 evidence, handoff state, and D-10/D-11 drift.                     |
| `packages/cli/e2e/src/domain/cli-surface.ts`                                   | modified | Additive sqlite runtime id and title.                                 |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts`                        | modified | SQLite/cache-off profile and operator-first executable-cache seam.    |
| `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`             | modified | Exported documented resource list for cross-site consistency testing. |
| `packages/cli/e2e/src/presentation/cli/commands/run-command.ts`                | modified | Generic run no longer masks per-suite db/cache defaults.              |
| `packages/cli/e2e/tests/presentation/{suite-registry,cli-program}_test.ts`     | modified | Registry, CLI precedence, environment, and wait/resource regressions. |

No `packages/cli/src/**`, `.github/**`, cleanup adapter, live runtime, product cache default, or
embedded-template file was touched.

## Gates

| Gate family | Current status | Evidence                                           |
| ----------- | -------------- | -------------------------------------------------- |
| Static      | `PASS`         | S4 scoped check/lint/fmt: 786 files, 0 findings.   |
| Fitness     | `PASS`         | S4 `quality:scan` and `arch:check` exited 0.       |
| Runtime     | `NOT_RUN`      | S7 is the first live sqlite run.                   |
| Consumer    | `PASS`         | S4: 104 E2E tests; suite list and CLI path proven. |

## Open Questions

1. Exact init spelling is resolved: both `--cache=false` and `--cache false` are accepted;
   `--no-cache` is rejected. S2 uses the single-argv equals spelling, and no product-command
   fallback was required.
2. Does the Garnet dotnet-tool executable arm start on `ubuntu-latest`? — S7, with a pre-agreed
   downgrade path.
3. Any silently postgres-shaped behavior gate? — S7.

## Drift and Debt

- **Drift:** D-1 supervisor lane override (minor); D-2 carried-in root cause wrong (significant);
  D-3 #1191 fix is services-only, new blocker (significant); D-4 CI "no docker service" framing
  (minor); D-5 apps have no permission-bearing command (significant); D-6 resumed cache-spelling
  probe corrected the partial handoff evidence (minor); D-7 self-certification breach (significant);
  D-8 owner-authorized supplementary verification lane (minor); D-9 adversarial-check escalation
  order (minor); D-10 generic `run` defaults masked capability defaults (significant); D-11
  concurrent supervisor commit swept the S4 worktree (significant). All in `drift.md`.
- **Debt:** two entries to create at Close — the unreachable `Mode: 'Local'` cache arm, and
  `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forcing a container on every scaffold.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
