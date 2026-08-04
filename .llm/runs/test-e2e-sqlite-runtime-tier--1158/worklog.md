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

- No new package exports. `generateRegisterServices` / `generateRegisterBackground` /
  `generateRegisterPlugins` keep their signatures; `RegisterBackgroundOptions` and
  `RegisterPluginsOptions` gain an optional `readonly databaseEngine?: DatabaseEntry['Engine']`,
  matching `RegisterServicesOptions`.
- One internal helper, `withDatabasePermissions(permissions, databaseEngine)`, extracted from
  `generate-register-services.ts` into the shared `register/` module and reused by the three
  permission-bearing generators. Not exported from the package. Apps remain unchanged per D-5.

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

| # | Slice                                                                                                                                                                                      | Gate                                                                                                                  | Files                                                                                                                                                                                                                                               |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **`--allow-ffi` reaches every permission-bearing sqlite resource, not just services** — proves the #1191 fix is no longer services-only.                                                   | `deno test packages/cli/src/kernel/templates/aspire/helpers/tests/` + scoped wrappers + `quality:scan` + `arch:check` | `register/{database-permissions,generate-register-{background,plugins,services}}.ts`, `helpers/types.ts`, the pipeline call site, `helpers/tests/*`                                                                                                 |
| 2 | **The E2E can scaffold a project with no cache resource** — `RunOptions.cache` + `--cache/--no-cache` + `scaffold.init` forwards it; omitting it reproduces today's command byte-for-byte. | `deno test packages/cli/e2e/` (incl. a golden `scaffoldInitCommand` assertion for the default path)                   | `e2e/src/domain/run-context.ts`, `presentation/cli/options/run-options.ts`, `presentation/cli/commands/{run,full}-command.ts`, `gates/scaffold/scaffold-gates.ts`, `builders/workspace/suite-builder-options.ts`, `create-default-runner.ts`, tests |
| 3 | **A capability suite can pin its own defaults while the CLI still overrides them.**                                                                                                        | `deno test packages/cli/e2e/` — precedence test: suite default `sqlite` + `--db postgres` → postgres                  | `suites/scaffold/capability-suites.ts`, `presentation/cli/suites/registry.ts`, tests                                                                                                                                                                |
| 4 | **`scaffold.runtime.sqlite` exists, resolves, and requests zero container resources.**                                                                                                     | `deno task e2e:cli suites` lists it; registry + wait-matrix unit tests                                                | `e2e/src/domain/cli-surface.ts`, `suites/scaffold/capability-suites.ts`, tests                                                                                                                                                                      |
| 5 | **Cleanup survives a machine with no Docker and a run with no containers.**                                                                                                                | `deno test packages/cli/e2e/` — absent-binary and non-zero-`docker ps` cases                                          | `e2e/src/adapters/commands/docker-resource-cleaner.ts`, tests                                                                                                                                                                                       |
| 6 | **CI runs the cheap tier on scaffold changes and honours `ci:skip-e2e` / `ci:full` with no new labels.**                                                                                   | `deno test .github/scripts/` — `ci:full` / `ci:skip-e2e` / docs-only matrices                                         | `.github/scripts/ci-classify-changes.ts`, `.github/workflows/e2e-cli.yml`, classifier tests                                                                                                                                                         |
| 7 | **The tier is real: a full local run passes with zero containers created.**                                                                                                                | `deno task e2e:cli run scaffold.runtime.sqlite --cleanup --format pretty` + `docker ps -a` delta = 0                  | Fixes discovered by the run; `worklog.md` gate tables; run report artifact                                                                                                                                                                          |

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

| Time       | Slice     | Step                                                  | Notes                                                                                                                                                                                                                                                               |
| ---------- | --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-04 | bootstrap | Research pass re-derived against `main` @ `c6f243da`  | 5 corrections to the carried-in draft, 2 of them blockers. See `research.md` § Re-baseline.                                                                                                                                                                         |
| 2026-08-04 | bootstrap | Run dir authored; branch + draft PR opened            | Harness artifacts only — no product code (D9).                                                                                                                                                                                                                      |
| 2026-08-04 | S1        | Pre-implementation trace stopped on app-command drift | `generate-register-apps.ts` launches `deno task` and owns no permission list; recorded as significant drift D-5 before product edits.                                                                                                                               |
| 2026-08-04 | S1        | Resumed after supervisor D-5 ruling                   | Implemented the three-generator rescope; apps were not touched and receive neither task arguments nor generated comments.                                                                                                                                           |
| 2026-08-04 | S1        | Implementation gates complete                         | All six required gates passed; slice is awaiting Tier-A substantive review and sign-off.                                                                                                                                                                            |
| 2026-08-04 | S1        | **Tier-A slice review — ACCEPTED**                    | Supervisor read the diff and re-ran every gate independently. One cosmetic finding, no blocking findings. Sign-off commit follows.                                                                                                                                  |
| 2026-08-04 | S2        | Resolved R-2 against the real public binary           | `--no-cache` exited 2; `--cache=false` and `--cache false` both exited 0. The single-argv `--cache=false` spelling was selected. Dry-run reported two Aspire resources. Materialized config had `Cache: {}` and no `PrimaryCache`; the probe directory was removed. |
| 2026-08-04 | S2        | Implementation and generator gates complete           | Added the default-true cache axis, CLI negation, exact init forwarding, workspace-builder plumbing, and focused regression tests. All six required gates passed; Tier-A review is pending.                                                                          |
| 2026-08-04 | S2        | Resumed after external timeout                        | Re-read the partial diff, repeated all three public-binary spelling probes under a fresh `/tmp` directory, cleaned it, and independently re-ran all six required gates. The only correction was the second accepted false spelling, recorded as D-6.                |

## Slice Review — S1 (Tier-A, supervisor)

Reviewed at `f012f019`. The supervisor read the diff and **re-ran every gate independently** rather
than accepting the implementer's report (`lane-policy.md` invariant 2 — no lane self-certifies).

**Independently reproduced gate results**

| Gate         | Command                                                                          | Verdict                                                                |
| ------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| helper tests | `deno test --no-lock -A packages/cli/src/kernel/templates/aspire/helpers/tests/` | 18 passed, 171 steps, 0 failed                                         |
| type-check   | `.llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`                  | 786 files, 7 batches, 0 findings                                       |
| lint         | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`                   | 786 files, 4 batches, 0 findings                                       |
| quality:scan | `deno task quality:scan`                                                         | `ok: true`, 0 findings (7 pre-existing allowances, none in this slice) |
| arch:check   | `deno task arch:check`                                                           | exit 0; warnings are pre-existing and out of scope                     |

**Substantive review**

- `withDatabasePermissions` is a pure value-in/value-out helper — A11 respected, no IO, no env
  probing. It de-duplicates (`!permissions.includes('--allow-ffi')`), so an entry that already
  declares the flag does not get a second one.
- The branch keys off `databaseEngine === 'Sqlite'`, an existing `DatabaseEntry['Engine']` domain
  value. No hardcoded plugin names, no host-side `kind === …` coupling.
- The services generator now **consumes** the shared helper instead of keeping a private copy — one
  implementation, not two. That is the point of the slice.
- The
  `entryPermissions ? denoDefaults.Permissions : withDatabasePermissions(denoDefaults.Permissions, …)`
  shape in background and plugins mirrors the services call site exactly, and is correct:
  `resolvePermissions` prefers entry permissions when present, so the defaults argument only needs
  the FFI flag on the path where it is actually used.
- `helpers-generator-pipeline.ts` hoists the existing
  `config.Databases[config.PrimaryDatabase]?.Engine` expression rather than introducing a second
  derivation — services behaviour is provably unchanged.
- Apps were **not** touched, per the D-5 ruling: no `RegisterAppsOptions.databaseEngine`, no
  `--allow-ffi` smuggled in as a `deno task` argument or a generated comment.
- R-1 is closed by test, not by assertion:
  `keeps non-SQLite {background,service,plugin} output
  byte-identical` compares generated output
  across `[undefined, 'Postgres', 'Mysql', 'Mssql']`.
- No `any`, no `as unknown as`, no new `// deno-lint-ignore`.
- Test imports use `jsr:@std/assert@^1`, matching the existing convention in that directory — not a
  finding.

**Findings**

| # | Severity | Finding                                                                                                                     | Disposition                                                                                                                                      |
| - | -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | cosmetic | The commit body of `f012f019` contains literal `\n\n` escape sequences instead of newlines, so it renders as one long line. | Accepted as-is. Amending would rewrite a pushed hash already cited in the PR trail for zero functional gain. Noted here so the record is honest. |

**Verdict: ACCEPTED.** S1 proves what it claims. Proceed to S2.

## Slice Review — S2 (Tier-A, supervisor)

Reviewed at `8d960571`. Gates re-run independently; the load-bearing behavioural claim was verified
against the real binary rather than accepted from the implementer's report.

**Independent verification of the claim the slice rests on**

Ran `netscript init … --db sqlite --cache=false --ci --yes --no-git --force` and read the generated
`appsettings.json`:

```
Cache           : {}
PrimaryCache    : None
Databases       : ['sqlite']
PrimaryDatabase : sqlite
```

That is exactly the no-Docker profile D2 requires — no `redis` container resource, and sqlite
contributes no Aspire DB resource. R-2 is closed empirically: `--no-cache` exits 2, `--cache=false`
and `--cache false` exit 0, so the single-argv `--cache=false` form is used and **no product CLI
fallback was needed** — `init-command.ts` is untouched.

**Reproduced gate results**

| Gate                                       | Verdict                          |
| ------------------------------------------ | -------------------------------- |
| `deno test --no-lock -A packages/cli/e2e/` | 97 passed, 0 failed              |
| `run-deno-check.ts --root packages/cli`    | 786 files, 7 batches, 0 findings |
| `run-deno-lint.ts --root packages/cli`     | 786 files, 4 batches, 0 findings |
| `deno task quality:scan`                   | exit 0                           |
| `deno task arch:check`                     | exit 0                           |

**Substantive review**

- The golden test `scaffold init default command remains byte-identical` pins the full default argv
  as a literal array — the regression guard for `scaffold.runtime` is a real assertion, not a smoke
  test.
- `DISABLE_CACHE_ARGUMENT` is a named constant; the flag is spread from an array that is empty on
  the default path, so the default argv is provably unchanged by construction as well as by test.
- `RunOptions.cache` defaults to `true` in **both** `defaultRunOptions` factories, so every existing
  suite and the `full` command keep today's behaviour.
- `withCache` follows the existing `withCleanup` shape exactly, and `createScaffoldCapabilitySuite`
  threads it with the same `!== undefined` guard — `false` is not swallowed as falsy.
- Commit body uses real newlines (the S1 cosmetic finding did not recur).
- No `any`, no `as unknown as`, no new lint-ignore.

**Findings:** none.

**Verdict: ACCEPTED.** Proceed to S3.

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
| Apps own no permission-bearing command               | significant | yes (D-5 + ruling) |

## Gate Results

### S2 Slice Gates

| Gate       | Command                                                                                           | Raw result                                                      |
| ---------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| E2E tests  | `deno test --no-lock -A packages/cli/e2e/`                                                        | exit 0; 97 passed, 0 failed                                     |
| type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | exit 0; 786 files, 7 batches, 0 failed batches, 0 findings      |
| lint       | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`  | exit 0; 786 files, 4 batches, 0 findings                        |
| format     | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`   | exit 0; 786 files, 4 batches, 0 failed batches, 0 findings      |
| quality    | `deno task quality:scan`                                                                          | exit 0; `ok: true`, 0 findings, 7 pre-existing allowances       |
| doctrine   | `deno task arch:check`                                                                            | exit 0; existing out-of-scope dependency/doctrine warnings only |

**R-2 empirical evidence.** The public binary rejects `--no-cache` and accepts both `--cache=false`
and `--cache false`. `scaffold.init` emits the single-argv `--cache=false` spelling only when
`RunOptions.cache === false`; omitting the E2E option remains byte-identical by golden argv
assertion. The accepted probe's dry-run reported two Aspire resources; a materialized probe
confirmed no cache resource (`Cache: {}`) and no `PrimaryCache`. The product CLI fallback in
`init-command.ts` was not needed. The resumed probe used `/tmp/ns-cache-probe.<random>` and verified
its removal afterward.

**Post-slice reconcile note.** S2 remains partial work on #1158 / draft PR #1220, so the existing PR
closing keyword remains appropriate but no acceptance box can be completed yet. The sweep found both
the issue and PR still carrying stale `status:plan-eval`; the S2 phase comment reconciles them to
`status:impl`. No new reviewer findings appeared after the S1 sign-off comment. S2 is
implementation-complete with green automated gates but remains explicitly pending Tier-A review; S3
has not started.

### Static Gates

| Gate         | Command or check                                                | Result | Notes                                        |
| ------------ | --------------------------------------------------------------- | ------ | -------------------------------------------- |
| type-check   | `.llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | `PASS` | 786 files; 7 batches; 0 failed; 0 findings.  |
| lint         | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`  | `PASS` | 786 files; 4 batches; 0 findings.            |
| format       | `.llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`   | `PASS` | 786 files; 4 batches; 0 findings.            |
| quality:scan | `deno task quality:scan`                                        | `PASS` | Repository scan found no violations.         |
| arch:check   | `deno task arch:check`                                          | `PASS` | Exit 0; existing out-of-scope warnings only. |

### Fitness Gates

| Gate   | Result    | Evidence               | Notes                                           |
| ------ | --------- | ---------------------- | ----------------------------------------------- |
| `F-1`  | `PASS`    | scoped lint wrapper    | 0 findings.                                     |
| `F-3`  | `PASS`    | `deno task arch:check` | Exit 0.                                         |
| `F-5`  | `NOT_RUN` | —                      | Planned-surface scan recorded in `research.md`. |
| `F-6`  | `NOT_RUN` | —                      | `publish:dry-run` at Gate phase.                |
| `F-9`  | `PASS`    | generator tests        | SQLite FFI exactly once in all three outputs.   |
| `F-10` | `PASS`    | helper test directory  | 18 passed, 171 steps, 0 failed.                 |
| `F-19` | `PASS`    | scoped wrappers        | check/lint/fmt all passed.                      |

### Runtime Gates

| Gate                          | Result    | Evidence | Notes                                       |
| ----------------------------- | --------- | -------- | ------------------------------------------- |
| `scaffold.runtime.sqlite`     | `NOT_RUN` | —        | S7. Zero-container delta is the acceptance. |
| `scaffold.runtime` (postgres) | `NOT_RUN` | —        | Merge-readiness regression run at Gate.     |

### Consumer Gates

| Consumer           | Result | Evidence                 | Notes                                                                                                                                   |
| ------------------ | ------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| generated projects | `PASS` | semantic generator tests | Postgres, MySQL, MSSQL, and no-engine output is byte-identical to the pre-branch path for services, background processors, and plugins. |

## Handoff Notes

- **Read `research.md` § Re-baseline first.** The carried-in draft's stated blocker was wrong; the
  plan diverges from it deliberately at D2, D3, D4, and E5.
- The two claims most worth attacking: (a) that `Mode: 'Auto'` garnet really resolves to the
  executable arm under `NETSCRIPT_CACHE_MODE=Executable` on CI, and (b) that S1's permission change
  leaves every non-sqlite scaffold byte-identical.
- No product code exists at PLAN-EVAL time. Implementation begins only on `PASS`.
- S2 implementation is complete with green automated gates but is **not self-certified**. Tier-A
  must review the slice before sign-off; do not start S3 from this handoff.
