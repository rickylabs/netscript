# Context Pack: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`  |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`   |
| Current phase  | `implement` — S1 blocked on drift D-5 |
| Archetype      | `6 - CLI / Tooling`                   |
| Scope overlays | `service`                             |

## Current State

Bootstrap, Research, Plan & Design, and PLAN-EVAL are complete; `plan-eval.md` records `PASS` at
commit `dd178da7`. S1 began with a baseline trace and stopped before product edits on significant
drift D-5: contrary to locked decision D0 and research finding 8, `generate-register-apps.ts` does
not emit `resolvePermissions(...)` or any permission-bearing command. It launches apps through
`deno task`, whose CLI accepts no Deno permission flags; the default generated Fresh task already
uses `deno run --allow-all`.

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

## In Progress

- **S1 blocked for Tier-A rescope.** No product file has been edited and no slice gate has run.
  Drift D-5 requires a supervisor decision: rescope the shared helper to the three
  permission-bearing generators, or first design a real app task-permission contract.

## Next Steps

1. Tier-A supervisor reviews drift D-5 and revises D0/S1 if appropriate. Do not encode `--allow-ffi`
   as a `deno task` argument or generated comment.
2. Relaunch/resume S1 only with a permission-bearing app design or explicit three-generator rescope.
3. Slice review gate (Tier-A supervisor) → sign-off commit → push → PR comment. Repeat for S2–S7.
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
| `.llm/runs/test-e2e-sqlite-runtime-tier--1158/*`                               | new      | Harness artifacts only — the bootstrap commit.                 |
| `.llm/runs/test-e2e-sqlite-runtime-tier--1158/{drift,worklog,context-pack}.md` | modified | S1 blocking drift D-5; uncommitted pending supervisor rescope. |

No `packages/` or `.github/` file has been touched (D9).

## Gates

| Gate family | Current status | Evidence                                            |
| ----------- | -------------- | --------------------------------------------------- |
| Static      | `NOT_RUN`      | S1 stopped before product edits.                    |
| Fitness     | `NOT_RUN`      | Planned-surface jsr scan recorded in `research.md`. |
| Runtime     | `NOT_RUN`      | S7 is the first live sqlite run.                    |
| Consumer    | `NOT_RUN`      | S1 must leave non-sqlite scaffolds byte-identical.  |

## Open Questions

1. Exact init spelling to disable the cache (`--cache false` vs a declared `--no-cache`) — S2.
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
