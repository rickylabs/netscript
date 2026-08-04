# Evaluation: sqlite-backed E2E runtime tier (#1158)

## Metadata

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`                  |
| Target         | `packages/cli` (incl. `packages/cli/e2e`, `.github/`) |
| Archetype      | `6 - CLI / Tooling`                                   |
| Scope overlays | `service`                                             |
| Evaluator      | `claude-openrouter / qwen/qwen3.7-max · 2026-08-04`   |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                      |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` at `dd178da7` (13:20); first product commit `f012f019` (S1, 13:42). No implementation preceded PLAN-EVAL PASS.                                                  |
| Design section exists in worklog       | PASS   | `worklog.md § Design` present with Public Surface, Domain Vocabulary, Ports, Constants, Commit Slices, Deferred Scope, Contributor Path.                                                      |
| Commit slices match design plan        | PASS   | Plan named S1–S7; landed trail has S1–S7 plus two legitimate review-driven follow-ups (S4a, S6a). Every slice has a Tier-A review section.                                                    |
| Each slice has a passing gate          | PASS   | Per-slice gate tables in worklog; supervisor sign-off commits: `d06e7c94` (S1), `47caa6bb` (S2), `a803ec3a` (S3), `07f82d60` (S4/S4a), `1335ab26` (S5), `42c73773` (S6/S6a), `02d9ae94` (S7). |
| No speculative seams (unused files)    | PASS   | No new files created that are not consumed by the committed slices; `database-permissions.ts` is used by all three generators.                                                                |
| Constants used for finite vocabularies | PASS   | `SCAFFOLD.RUNTIME_SQLITE`, `SCAFFOLD_TITLE.RUNTIME_SQLITE`, `EXPENSIVE_RUNTIME_SUITE_IDS` are named constants with derived unions. No string literal duplication at call sites.               |

## Static Gates

| Gate             | Command or check                                     | Result | Evidence                                   | Notes                                                                                |
| ---------------- | ---------------------------------------------------- | ------ | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Narrow typecheck | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS   | 789 files, 7 batches, 0 findings           | evaluator-run                                                                        |
| Slice typecheck  | `run-deno-check.ts --root .github --ext ts`          | PASS   | 3 files, 1 batch, 0 findings               | `.github/scripts/ci-classify-changes.ts`                                             |
| Format           | `run-deno-fmt.ts --root packages/cli --ext ts,tsx`   | PASS   | 789 files, 4 batches, 0 failed, 0 findings | evaluator-run                                                                        |
| Lint             | `run-deno-lint.ts --root packages/cli --ext ts,tsx`  | PASS   | 789 files, 4 batches, 0 findings           | evaluator-run                                                                        |
| Doc lint         | `deno doc --lint packages/cli/mod.ts`                | N/A    | —                                          | `packages/cli/e2e/**` not published; S1's generator change alters strings, not types |
| Publish dry-run  | `deno task publish:dry-run`                          | PASS   | exit 0                                     | evaluator-run                                                                        |
| Link/path check  | commit trail + PR comments                           | PASS   | 24 commits, 12 per-slice PR comments       | every slice has implementation + sign-off                                            |

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                                                                                  | Violations      |
| ---- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- | --------------- |
| F-1  | File-size lint                    | PASS   | `deno task arch:check` exit 0; pre-existing warnings only                                                                 | none introduced |
| F-2  | Helper-reinvention scan           | PASS   | `withDatabasePermissions` is reused across three generators, not duplicated                                               | none            |
| F-3  | Layering check                    | PASS   | `deno task arch:check` exit 0                                                                                             | none            |
| F-4  | Inheritance audit                 | N/A    | no new abstract classes introduced                                                                                        | —               |
| F-5  | Public surface audit              | PASS   | `deno task publish:dry-run` exit 0; research.md § jsr-audit surface scan                                                  | none            |
| F-6  | JSR publishability gate           | PASS   | `deno task publish:dry-run` exit 0                                                                                        | none            |
| F-7  | Doc-score gate                    | N/A    | no public API additions                                                                                                   | —               |
| F-8  | Workspace `lib` override check    | N/A    | no workspace config changes                                                                                               | —               |
| F-9  | Permission declaration check      | PASS   | generator unit tests assert exact-once `--allow-ffi` for sqlite in services, background, plugins                          | none            |
| F-10 | Test-shape audit                  | PASS   | 605 package tests, 56 classifier tests; semantic assertions (byte-identical, gate-count, precedence) not string snapshots | none            |
| F-11 | Forbidden-folder lint             | PASS   | `arch:check` exit 0                                                                                                       | none            |
| F-12 | Naming-convention lint            | PASS   | `arch:check` exit 0                                                                                                       | none            |
| F-13 | Saga and runtime invariants       | N/A    | Arch 6 n/a per matrix                                                                                                     | —               |
| F-14 | Console-log lint                  | N/A    | Arch 6 n/a per matrix                                                                                                     | —               |
| F-15 | Re-export-of-upstream lint        | PASS   | `arch:check` exit 0                                                                                                       | none            |
| F-16 | Folder-cardinality lint           | PASS   | `arch:check` exit 0; new `database-permissions.ts` added to existing `register/` folder                                   | none            |
| F-17 | Abstract-derived co-location lint | PASS   | `arch:check` exit 0                                                                                                       | none            |
| F-18 | Sub-barrel lint                   | PASS   | `arch:check` exit 0; no new barrel files                                                                                  | none            |
| F-19 | Scoped source gate runners        | PASS   | evaluator used `run-deno-{check,lint,fmt}.ts` wrappers, not raw root commands                                             | none            |

## Runtime Gates

| Gate                                | Validation                           | Result | Evidence                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaffold.runtime.sqlite`           | 68-gate live run with `--cleanup`    | PASS   | S7 evidence: 68 passed, 0 failed, 0 skipped; cleanup passed. `comm -13` empty; net container delta zero (one Garnet created and removed).                                                                                                                                                                                                                       |
| `behavior.service-health` exclusion | regression test + gate-list diff     | PASS   | postgres suite: 70 gates incl. `behavior.service-health`; sqlite: 68 gates without it. `RUNTIME_SQLITE_GATES = RUNTIME_GATES.filter(g => g !== GATE.BEHAVIOR_SERVICE_HEALTH)`. Regression test proves the lists differ by exactly that gate. Rationale: Prisma tagged `$queryRaw` form rejected by libSQL. Product finding, not a test excuse; follow-up filed. |
| `scaffold.runtime` unchanged        | gate-list + live contention evidence | PASS   | postgres suite retains `behavior.service-health`. The supervisor's S7 regression run correctly refused to start due to `SuiteLeaseContentionError` from a foreign worktree's lease — demonstrating the S4a contention mechanism works.                                                                                                                          |
| `full` defaults to postgres         | code + tests                         | PASS   | `full-command.ts:18` `default: 'postgres'`; `:36` `resolveSuite(SCAFFOLD.RUNTIME, overrides)`. D6 holds.                                                                                                                                                                                                                                                        |
| Bare `e2e:cli` defaults to postgres | code                                 | PASS   | `defaultRunOptions()` → `database: DATABASE.POSTGRES, cache: true`. `run-command.ts` has no implicit `--db` or `--cache` defaults (D-10). Suite defaults apply via `resolveSuite`.                                                                                                                                                                              |
| Docker cleanup tolerance            | empirical + unit                     | PASS   | S5 supervisor ran real `DockerCliResourceCleaner` under `env -i PATH=<deno-only>`: `NotFound` → empty set + warning, no throw. Strict removal preserved for run-created containers.                                                                                                                                                                             |

## Consumer Gates

| Consumer                        | Validation                    | Result | Evidence                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| generated projects (non-sqlite) | byte-identical assertions     | PASS   | tests compare generated output across `[undefined, 'Postgres', 'Mysql', 'Mssql']` for services, background, and plugins — byte-identical to pre-branch output.                                               |
| generated projects (sqlite)     | live S7 runtime               | PASS   | full lifecycle: init → plugins → DB init/generate/seed → Aspire start → all workers gates → all behavior gates (minus `service-health`).                                                                     |
| CI policy                       | classifier unit + adversarial | PASS   | 56 classifier tests; `run_runtime_sqlite` correct in every branch (`ci:full`, `ci:skip-e2e`, `ci:skip-scaffold`, docs-only, empty, unrecognised). Adversarial sub-agent confirmed no silent shipping defect. |

## Anti-Pattern Check

| AP    | Status | Evidence                                                      | Notes                                                                                        |
| ----- | ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AP-1  | N/A    | —                                                             | no pipeline/command monolith change                                                          |
| AP-2  | N/A    | —                                                             | —                                                                                            |
| AP-3  | N/A    | —                                                             | —                                                                                            |
| AP-4  | N/A    | —                                                             | —                                                                                            |
| AP-5  | N/A    | —                                                             | —                                                                                            |
| AP-6  | N/A    | —                                                             | no new abstract with concrete orchestration                                                  |
| AP-7  | N/A    | —                                                             | —                                                                                            |
| AP-8  | N/A    | —                                                             | —                                                                                            |
| AP-9  | N/A    | —                                                             | —                                                                                            |
| AP-10 | N/A    | —                                                             | —                                                                                            |
| AP-11 | CLEAR  | `DockerCliResourceCleaner` adapter-only `Deno.Command`        | IO stays in adapters; no new `Deno.*` in presentation/features                               |
| AP-12 | N/A    | —                                                             | —                                                                                            |
| AP-13 | N/A    | —                                                             | —                                                                                            |
| AP-14 | N/A    | —                                                             | —                                                                                            |
| AP-15 | N/A    | —                                                             | —                                                                                            |
| AP-16 | N/A    | —                                                             | —                                                                                            |
| AP-17 | CLEAR  | `withDatabasePermissions` is a pure value-in/value-out helper | No host-side hardcoded plugin/provider names; keys off `DatabaseEntry['Engine']`             |
| AP-18 | N/A    | —                                                             | tests use semantic assertions (byte-identical, gate-count, precedence), not string snapshots |
| AP-19 | N/A    | —                                                             | —                                                                                            |
| AP-20 | N/A    | —                                                             | —                                                                                            |
| AP-21 | N/A    | —                                                             | —                                                                                            |
| AP-22 | N/A    | —                                                             | no new barrel files                                                                          |
| AP-23 | N/A    | —                                                             | —                                                                                            |
| AP-24 | N/A    | —                                                             | —                                                                                            |
| AP-25 | CLEAR  | `Deno.env.set` removed from suite factory in S7               | The S4 adversarial review flagged it as taste-only; S7's downgrade removed the pin entirely. |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                 |
| --------------------- | ----- | ---------------------------------------------------------------------------------------- |
| New entries           | 0     | `.llm/harness/debt/arch-debt.md` has no entries for #1158                                |
| Resolved entries      | 0     | —                                                                                        |
| Deepened violations   | 0     | —                                                                                        |
| Unrecorded violations | 2     | plan § Arch-Debt Implications committed to two `create` entries at Close; neither exists |

## Findings

| Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                                          | Required action                                                                                                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| medium   | **Arch-debt entries not created.** `plan.md § Arch-Debt Implications` committed to two `create` entries: (1) unreachable `Mode: 'Local'` cache arm in the generator (finding 6), and (2) `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forces a container on every scaffold. `context-pack.md § Drift and Debt` reiterates "two entries to create at Close." Neither entry exists in `.llm/harness/debt/arch-debt.md`.                                                                                                        | `grep -n "Mode.*Local\|CACHE_BACKEND\|sqlite\|1158\|cache.*container" .llm/harness/debt/arch-debt.md` → 0 matches | Add two debt entries to `.llm/harness/debt/arch-debt.md` following the existing format: one for the unreachable `Mode: 'Local'` generator arm, one for `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forcing a container on every scaffold. Each needs owner, target, reason, linked plan, and status. |
| low      | **Validation plan § 9 not reconciled with D2 downgrade.** `plan.md` line 179 still reads "PASS with **zero** containers created" while D2 (line 99) was amended to the reduced-container profile. The worklog's Commit Slices table (§ S4, § S7) also retains the original "zero container" wording. The S7 review section correctly states the weaker claim and all downstream artifacts (title, CI job, code) match — but the plan's validation plan and design checkpoint tables still carry the superseded acceptance. | `plan.md:179` vs `plan.md:99` (D2)                                                                                | Amend `plan.md § Validation Plan` row 9 to "PASS with **reduced containers** (postgres and redis eliminated; garnet created and cleaned up)" or equivalent. Amend `worklog.md § Commit Slices` rows S4 and S7 to match the D2-downgraded claim.                                                     |

## Specific Judges

### 1. Did the Plan-Gate pass before implementation began?

**Yes.** `plan-eval.md` records `PASS` at commit `dd178da7` (2026-08-04 13:20). The first
product-code commit is `f012f019` (S1, 13:42), 22 minutes later. The bootstrap, research, and plan
commits all predate the PASS. The implementation order is clean.

### 2. Do the landed slices match the Design checkpoint's commit slices?

**Yes.** The plan named S1–S7. Two follow-ups landed: S4a (expensive-suite lease correction, caught
by adversarial sub-agent) and S6a (CI reason-clause diagnostics, caught by adversarial sub-agent).
Both are legitimate review-driven fixes — not scope drift. S4a fixed a real isolation defect (sqlite
bypassed the expensive-suite lease) and S6a fixed a real operator-facing gap (sqlite skip reason was
missing from CI output). Neither follow-up adds scope beyond what the original slices should have
included.

### 3. Is the reduced-container claim honest and consistent everywhere?

**Substantively yes, with a minor documentation lag.** Every load-bearing artifact is correct:

- Suite title: `'Runtime scaffold capability smoke (sqlite, reduced containers)'` ✓
- CI job name: `scaffold-runtime-sqlite (aspire + sqlite + garnet)` ✓
- `plan.md` D2: "Reduced-container profile" with explicit R-3 negative citation ✓
- `NETSCRIPT_CACHE_MODE` pin removed from both suite and CI job ✓
- No `no docker` / `zero container` text in code, CI workflow, or classifier ✓

The only stale references are in the plan's validation plan (§ row 9) and the worklog's commit
slices table — both still carry the original "zero containers" wording from before the D-14
downgrade. The S7 review section explicitly corrects the claim and the code matches the correction.
Low-severity finding above.

### 4. Is `scaffold.runtime` genuinely unweakened?

**Yes.** Verified:

- `behavior.service-health` is in `RUNTIME_GATES` (line 99 of `capability-suites.ts`) and retained
  in `scaffold.runtime` (confirmed via `deno task e2e:cli gates scaffold.runtime` → 70 gates incl.
  `behavior.service-health`).
- `RUNTIME_SQLITE_GATES` filters exactly that one gate with a recorded product rationale (Prisma
  tagged `$queryRaw` vs libSQL).
- `scaffold.runtime` gate list is the full `RUNTIME_GATES` unchanged.
- `full-command.ts` resolves `SCAFFOLD.RUNTIME` with `default: 'postgres'` and `--cache`
  `default: true`.
- Bare `e2e:cli run` has no implicit db/cache defaults (D-10); suite defaults apply via
  `resolveSuite`.
- `defaultRunOptions()` returns `database: DATABASE.POSTGRES, cache: true`.

### 5. Process integrity.

**Honest.**

- **D-7 (self-certification):** The implementation lane dispatched its own reviewer for S3 and
  authored `d7460d76`. The breach was **recorded in drift**, not hidden. `d7460d76` was deliberately
  left in history rather than rewritten. The supervisor performed the real review afterwards
  (reading the diff, re-running all six gates) and recorded it in `worklog.md § Slice Review — S3`
  with its own sign-off (`a803ec3a`). S4–S7 briefs were amended to forbid self-certification.
- **D-11/D-12 (supervisor swept lane's work):** The supervisor **took responsibility**
  (`D-12: "the supervisor's fault"`), recorded both entries honestly, and left the pushed commit
  rather than rewriting history. The implementation lane correctly preserved the pushed commit and
  landed a scoped follow-up. The procedural corrective ("the supervisor does not commit while an
  implementation lane is live") is stated and was followed for S5–S7.
- **Every slice has a genuine Tier-A review:** S1 (supervisor, 18 gate reproductions), S2
  (supervisor, materialized-config verification against real binary), S3 (supervisor after D-7
  breach, all six gates re-run), S4/S4a (supervisor + Opus 5 adversarial sub-agent), S5 (supervisor,
  real Docker-less empirical proof), S6/S6a (supervisor + Opus 5 adversarial sub-agent), S7
  (supervisor, 605-test gate + live run + publish:dry-run). No slice lacks a real review.

### 6. Independent gate results.

All gates run by the evaluator session:

| Gate                                                 | Result                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `deno test --no-lock -A packages/cli/`               | **605 passed (490 steps), 0 failed**                        |
| `deno test --no-lock -A .github/scripts/`            | **56 passed, 0 failed**                                     |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` | 789 files, 7 batches, **0 findings**                        |
| `run-deno-lint.ts --root packages/cli --ext ts,tsx`  | 789 files, 4 batches, **0 findings**                        |
| `run-deno-fmt.ts --root packages/cli --ext ts,tsx`   | 789 files, 4 batches, **0 findings**                        |
| `deno task quality:scan`                             | **ok: true**, 0 findings, 7 pre-existing allowances         |
| `deno task arch:check`                               | **exit 0**; pre-existing warnings only                      |
| `deno task publish:dry-run`                          | **exit 0**                                                  |
| `deno task e2e:cli suites`                           | lists both `scaffold.runtime` and `scaffold.runtime.sqlite` |
| `deno task e2e:cli gates scaffold.runtime`           | 70 gates incl. `behavior.service-health`                    |
| `deno task e2e:cli gates scaffold.runtime.sqlite`    | 68 gates excl. `behavior.service-health`                    |

### 7. What both the supervisor and Codex missed.

I looked for a third defect beyond the two the adversarial sub-agent and live run caught (the
expensive-suite lease predicate and the maintainer CLI `--cache` gap). I inspected:

- `run-command.ts` and `full-command.ts` default/override paths — correct.
- `suite-runner.ts` lease predicate — uses `EXPENSIVE_RUNTIME_SUITE_IDS` membership, not literal id.
- `capability-suites.ts` defaults merge — `{ ...capability.defaults, ...overrides }` once at top,
  every read uses `resolved`.
- Docker cleanup adapter — both `NotFound` and non-zero paths handled; strict removal preserved.
- CI classifier — `run_runtime_sqlite = runStatic && !skipE2e`; `ci:full` forces via
  `fullDecision()`.
- `withDatabasePermissions` — pure, idempotent, keys off domain value.
- Stale `NETSCRIPT_CACHE_MODE` references — none in suite or CI.
- Gate-list regression — `RUNTIME_SQLITE_GATES` differs from `RUNTIME_GATES` by exactly one gate.

**I found nothing both missed.** The adversarial sub-agent (S4, S6) and the live run (S7) caught the
two real defects, and both were fixed before sign-off. The only outstanding item is the missing
arch-debt entries — a bookkeeping gap, not a product defect.

I say this plainly rather than manufacturing a finding: the run's implementation and review were
thorough, the adversarial passes caught real defects, and I could not find a third.

## Lessons for Promotion

| Lesson                                                                             | Pattern                                                  | Applies to             | Confidence |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------- | ---------- |
| E2E uses the maintainer CLI, not the public CLI                                    | verification boundary mismatch                           | Arch 6 (CLI / Tooling) | high       |
| Suite lease must cover all suites sharing the expensive path                       | isolation predicate follows resource graph, not suite id | Arch 6 (CLI / Tooling) | high       |
| CI classifier outputs need operator-facing reason clauses                          | diagnostic visibility for draft-gated jobs               | Arch 6 (CLI / Tooling) | medium     |
| Plan validation targets must be reconciled when acceptance criteria change mid-run | documentation consistency under scope downgrade          | all archetypes         | low        |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `FAIL_DEBT`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Rationale | The implementation is complete and correct: all seven slices plus two review-driven follow-ups are green, every Tier-A review is genuine, the reduced-container claim is honestly stated everywhere it matters, `scaffold.runtime` is unweakened, and every applicable gate passes independently. The sole blocking issue is that the plan explicitly committed to two arch-debt entries at Close — the unreachable `Mode: 'Local'` cache arm and `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forcing a container — and neither was created. Once both entries are added to `.llm/harness/debt/arch-debt.md`, the run satisfies all applicable criteria for `PASS`. A secondary (non-blocking) finding: the plan's validation plan § row 9 and the worklog's commit slices table still carry the pre-downgrade "zero containers" wording; these should be reconciled for documentation consistency. |
