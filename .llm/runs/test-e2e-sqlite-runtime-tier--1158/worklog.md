# Worklog: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                |
| -------------- | ------------------------------------ |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158` |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`  |
| Archetype      | `6 - CLI / Tooling`                  |
| Scope overlays | `service`                            |

## Design

Recorded before any implementation file is created, per `workflow/run-loop.md` § 3b.

### Public Surface

Framework (`packages/cli` published surface) — S1 only:

- No new exports. `generateRegisterApps` / `generateRegisterBackground` / `generateRegisterPlugins`
  keep their signatures; their options types gain an optional
  `readonly databaseEngine?: DatabaseEntry['Engine']`, matching `RegisterServicesOptions`.
- One internal helper, `withDatabasePermissions(permissions, databaseEngine)`, extracted from
  `generate-register-services.ts` into the shared `register/` helper module and reused by all four
  generators. Not exported from the package.

E2E harness (`packages/cli/e2e`, internal to the package, not a JSR surface):

- `SCAFFOLD.RUNTIME_SQLITE` — new suite id `'scaffold.runtime.sqlite'`.
- `SCAFFOLD_TITLE.RUNTIME_SQLITE` — `'Runtime scaffold capability smoke (sqlite, no docker)'`.
- `RunOptions.cache: boolean` — new run axis.
- `ScaffoldCapabilitySuite.defaults?: Partial<RunOptions>` — per-suite default options.
- CLI: `--cache` / `--no-cache` on `run` and `full`.

### Domain Vocabulary

- `ScaffoldCapabilitySuite` — gains `defaults?: Partial<RunOptions>`; the suite-level baseline that
  caller overrides win over.
- `RunOptions.cache: boolean` — "scaffold a shared cache resource at `netscript init`". Boolean, not
  an enum: the only decision the E2E needs is _whether init creates its own container-backed cache_.
  The backend itself stays a product concern (D3).
- `DatabaseEntry['Engine']` — existing product vocabulary reused by S1; no new engine type.
- `CacheWiring` / `Mode: 'Auto' | 'Container' | 'Executable' | 'External' | 'Local'` — existing
  generated-apphost vocabulary; this run consumes it, it does not extend it.

### Ports

None created. The existing `CommandExecutor` port is deliberately **not** extended with an `env`
field — subprocesses inherit the runner process environment, so `NETSCRIPT_CACHE_MODE` is set
process-wide by the CI job and by the sqlite suite (finding 13). Adding an `env` seam would be a
speculative port for a need this run does not have.

`DockerResourceCleaner` (existing port) keeps its contract; only the Deno adapter becomes tolerant.

### Constants

- `SCAFFOLD.RUNTIME_SQLITE = 'scaffold.runtime.sqlite'` (`e2e/src/domain/cli-surface.ts`)
- `SCAFFOLD_TITLE.RUNTIME_SQLITE = 'Runtime scaffold capability smoke (sqlite, no docker)'`
- `NETSCRIPT_CACHE_MODE` value `'Executable'` — referenced through one named constant in the sqlite
  suite module, not as a bare string at two call sites.
- Gate ids: **none added**. The sqlite suite reuses `RUNTIME_GATES` verbatim (D4 filters nothing);
  `runtime.wait.garnet` and the engine-filtered DB waits already do the right thing.

### Commit Slices

| # | Slice                                                                                                                                                                                      | Gate                                                                                                 | Files                                                                                                                                                                                                                                               |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **`--allow-ffi` reaches every sqlite resource, not just services** — proves the #1191 fix is no longer services-only.                                                                      | `deno test packages/cli/src/kernel/templates/aspire/helpers/tests/` + `quality:scan` + `arch:check`  | `register/generate-register-{apps,background,plugins,services}.ts`, `helpers/types.ts`, generator call sites, `helpers/tests/*`                                                                                                                     |
| 2 | **The E2E can scaffold a project with no cache resource** — `RunOptions.cache` + `--cache/--no-cache` + `scaffold.init` forwards it; omitting it reproduces today's command byte-for-byte. | `deno test packages/cli/e2e/` (incl. a golden `scaffoldInitCommand` assertion for the default path)  | `e2e/src/domain/run-context.ts`, `presentation/cli/options/run-options.ts`, `presentation/cli/commands/{run,full}-command.ts`, `gates/scaffold/scaffold-gates.ts`, `builders/workspace/suite-builder-options.ts`, `create-default-runner.ts`, tests |
| 3 | **A capability suite can pin its own defaults while the CLI still overrides them.**                                                                                                        | `deno test packages/cli/e2e/` — precedence test: suite default `sqlite` + `--db postgres` → postgres | `suites/scaffold/capability-suites.ts`, `presentation/cli/suites/registry.ts`, tests                                                                                                                                                                |
| 4 | **`scaffold.runtime.sqlite` exists, resolves, and requests zero container resources.**                                                                                                     | `deno task e2e:cli suites` lists it; registry + wait-matrix unit tests                               | `e2e/src/domain/cli-surface.ts`, `suites/scaffold/capability-suites.ts`, tests                                                                                                                                                                      |
| 5 | **Cleanup survives a machine with no Docker and a run with no containers.**                                                                                                                | `deno test packages/cli/e2e/` — absent-binary and non-zero-`docker ps` cases                         | `e2e/src/adapters/commands/docker-resource-cleaner.ts`, tests                                                                                                                                                                                       |
| 6 | **CI runs the cheap tier on scaffold changes and honours `ci:skip-e2e` / `ci:full` with no new labels.**                                                                                   | `deno test .github/scripts/` — `ci:full` / `ci:skip-e2e` / docs-only matrices                        | `.github/scripts/ci-classify-changes.ts`, `.github/workflows/e2e-cli.yml`, classifier tests                                                                                                                                                         |
| 7 | **The tier is real: a full local run passes with zero containers created.**                                                                                                                | `deno task e2e:cli run scaffold.runtime.sqlite --cleanup --format pretty` + `docker ps -a` delta = 0 | Fixes discovered by the run; `worklog.md` gate tables; run report artifact                                                                                                                                                                          |

Slice count: 7 (target < 30). Order is a strict dependency chain — S1 unblocks the runtime path,
S2–S3 build the seams, S4 assembles the suite, S5 makes teardown safe, S6 wires CI, S7 proves it.

### Deferred Scope

- **Promoting sqlite to merge-readiness** — D6; postgres stays the bar.
- **Changing `SCAFFOLD_DEFAULTS.CACHE_BACKEND`** — a product default affecting every user; follow-up
  issue at Close.
- **Emitting `Mode: 'Local'` for deno-kv** — the generator arm exists but is unreachable; recorded
  as debt, not fixed here.
- **A `cacheBackend` axis on the E2E runner** — superseded by D3; would be a speculative seam.
- **`env` on the `CommandExecutor` port** — not needed (finding 13).

### Contributor Path

To add another container-free tier (say mysql-less, or a bare-runtime tier), a contributor:

1. adds the id + title to `SCAFFOLD` / `SCAFFOLD_TITLE` in `e2e/src/domain/cli-surface.ts`;
2. appends one entry to `scaffoldCapabilitySuites` in `suites/scaffold/capability-suites.ts` with a
   `gates` list and a `defaults` object;
3. adds a CI job by copying the `scaffold-runtime-sqlite` block and its classifier output.

No gate-filtering logic to touch: waits are derived from the suite's resolved options.

## Progress Log

| Time       | Slice     | Step                                                  | Notes                                                                                                                                 |
| ---------- | --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-04 | bootstrap | Research pass re-derived against `main` @ `c6f243da`  | 5 corrections to the carried-in draft, 2 of them blockers. See `research.md` § Re-baseline.                                           |
| 2026-08-04 | bootstrap | Run dir authored; branch + draft PR opened            | Harness artifacts only — no product code (D9).                                                                                        |
| 2026-08-04 | S1        | Pre-implementation trace stopped on app-command drift | `generate-register-apps.ts` launches `deno task` and owns no permission list; recorded as significant drift D-5 before product edits. |

## Decisions

| Decision                                              | Reason                                                                                    | Source                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Garnet wait is **not** filtered                       | The resource exists under the same name in both the container and executable arms         | code (`generate-register-infrastructure.ts:182-212`) |
| Boolean `cache` axis instead of a `cacheBackend` axis | `--cache-backend deno-kv` yields `Mode: 'External'`, and plugin-add re-adds garnet anyway | code (`generate-appsettings.ts:251-259`)             |
| S1 (`--allow-ffi`) precedes every E2E slice           | Non-service resources exit 1 on sqlite without it                                         | code (`generate-register-services.ts:32-38`)         |
| Per-suite `defaults` merged **under** overrides       | A suite id alone cannot pin an engine today                                               | code (`capability-suites.ts:168-192`)                |

## Drift

| Drift                                                | Severity    | Logged in drift.md |
| ---------------------------------------------------- | ----------- | ------------------ |
| Supervisor lane is Opus 5, not the canonical Fable 5 | minor       | yes (D-1)          |
| Carried-in draft's root-cause analysis was wrong     | significant | yes (D-2)          |
| #1191's fix is services-only — new blocker           | significant | yes (D-3)          |

## Gate Results

### Static Gates

| Gate         | Command or check                                                | Result    | Notes                     |
| ------------ | --------------------------------------------------------------- | --------- | ------------------------- |
| type-check   | `.llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | `NOT_RUN` | No product code yet (D9). |
| lint         | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`  | `NOT_RUN` | Same.                     |
| format       | `.llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`   | `NOT_RUN` | Same.                     |
| quality:scan | `deno task quality:scan`                                        | `NOT_RUN` | Required from S1 onward.  |
| arch:check   | `deno task arch:check`                                          | `NOT_RUN` | Required from S1 onward.  |

### Fitness Gates

| Gate   | Result    | Evidence | Notes                                           |
| ------ | --------- | -------- | ----------------------------------------------- |
| `F-1`  | `NOT_RUN` | —        | Bootstrap is harness artifacts only.            |
| `F-3`  | `NOT_RUN` | —        | Same.                                           |
| `F-5`  | `NOT_RUN` | —        | Planned-surface scan recorded in `research.md`. |
| `F-6`  | `NOT_RUN` | —        | `publish:dry-run` at Gate phase.                |
| `F-9`  | `NOT_RUN` | —        | S1 is the permission-declaration slice.         |
| `F-10` | `NOT_RUN` | —        | Per-slice tests named in the slice table.       |
| `F-19` | `NOT_RUN` | —        | Scoped wrappers only.                           |

### Runtime Gates

| Gate                          | Result    | Evidence | Notes                                       |
| ----------------------------- | --------- | -------- | ------------------------------------------- |
| `scaffold.runtime.sqlite`     | `NOT_RUN` | —        | S7. Zero-container delta is the acceptance. |
| `scaffold.runtime` (postgres) | `NOT_RUN` | —        | Merge-readiness regression run at Gate.     |

### Consumer Gates

| Consumer           | Result    | Evidence | Notes                                                                     |
| ------------------ | --------- | -------- | ------------------------------------------------------------------------- |
| generated projects | `NOT_RUN` | —        | S1 changes emitted permissions; non-sqlite output must be byte-identical. |

## Handoff Notes

- **Read `research.md` § Re-baseline first.** The carried-in draft's stated blocker was wrong; the
  plan diverges from it deliberately at D2, D3, D4, and E5.
- The two claims most worth attacking: (a) that `Mode: 'Auto'` garnet really resolves to the
  executable arm under `NETSCRIPT_CACHE_MODE=Executable` on CI, and (b) that S1's permission change
  leaves every non-sqlite scaffold byte-identical.
- No product code exists at PLAN-EVAL time. Implementation begins only on `PASS`.
