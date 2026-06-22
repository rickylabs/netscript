# Worklog — chore-alpha1-jsr-shim-removal

- Planning artifacts committed. No implementation slice until PLAN-EVAL PASS.

## 2026-06-22 — PLAN-EVAL cycle 1

- Verdict: **FAIL_PLAN** (cycle 1 of 2).
- T1 (cli aliases / db buildConnectionString / mssqlJsonExtension / telemetry context/job.ts) — verified 0-consumer; plan accurate.
- T2 (mssql trustedConnection / fresh serveStaticFiles + registerFsRoutes) — canonical exists (authentication.type='ntlm', staticFiles, fsRoutes); plan accurate.
- T3 saga-side (`saga-bus-legacy` + legacy runtime) — verified 0 external consumer; canonical `SagaBusBridge`/native runtime covers; wholesale removal safe.
- T3 workers-side (`schedule()` builder + `schedule` field plumbing) — **unsound**. `defineScheduledTrigger().enqueueJob()` is not a canonical replacement; the two are parallel cron subsystems with separate scaffolds, CLI flags, runtime adapters, and documented public surfaces.
- Version policy (alpha-1 minor bump with breaking note): **PASS** — semver-correct for 0.0.1-alpha.0 series.
- Required fixes: re-scope S3b (workers-side), run `jsr-audit` on the planned surface, include doc/recipe updates in S3b file list, add `deno doc --lint` to gate set, convert "Codex must grep" to a gate, re-run open-decision sweep.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` for full findings.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` for drift notes.

## 2026-06-23 — S1 implementation: Tier 1 aliases

- Scope:
  - Folded the only live CLI alias consumer from `V8_HEAP_MB` to `DEFAULT_V8_HEAP_MB`.
  - Removed the 8 deprecated Windows constants aliases from `packages/cli/src/kernel/constants/windows.ts`.
  - Removed `buildConnectionString` and `mssqlJsonExtension` deprecated database exports and barrels.
  - Deleted the deprecated telemetry `src/context/job.ts` re-export shim.
  - Added type-only barrel exports needed for the S1 `deno doc --lint` public-surface gate:
    `PostgresDriverAdapter` from database and core telemetry types referenced by root-exported job helpers.
- S1 pre-delete grep gate: PASS. Zero hits for all S1 symbols across `templates/**`, `docs/**`,
  `plugins/*/templates/**`, `plugins/*/src/scaffolding/templates/**`,
  `packages/*/src/**/templates/**`, and `packages/cli/src/kernel/assets/**`.
- Consumer proof after deletion:
  - Removed CLI alias names have no live alias exports/imports; remaining hits are canonical `DEFAULT_*` names.
  - `buildConnectionString` hits are only the unrelated private adapter methods in mysql/postgres.
  - `mssqlJsonExtension` and `context/job` have zero package/plugin/doc hits.
- Gates:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/database --root packages/telemetry --ext ts,tsx --pretty` — PASS, 593 files, 5 batches, 0 occurrences.
  - `deno lint packages/cli/src packages/database/adapters packages/database/extensions packages/database/ports packages/database/prisma-tracing.ts packages/database/mod.ts packages/telemetry/src packages/telemetry/mod.ts packages/telemetry/context.ts` — PASS, 55 files.
  - `deno fmt --check packages/cli/src packages/database/adapters packages/database/extensions packages/database/ports packages/database/prisma-tracing.ts packages/database/mod.ts packages/telemetry/src packages/telemetry/mod.ts packages/telemetry/context.ts` — PASS, 55 files.
  - `deno doc --lint packages/cli/mod.ts` — PASS.
  - `deno doc --lint packages/database/mod.ts` — PASS, with npm `@types/node` unresolved-type warnings only.
  - `deno doc --lint packages/telemetry/mod.ts` — PASS.
  - `deno task --cwd packages/cli test` — PASS, 147 tests / 311 steps.
  - `deno task --cwd packages/database test` — PASS, 5 tests / 7 steps.
  - `deno task --cwd packages/telemetry test` — PASS, 12 tests.
  - `rtk proxy deno task arch:check` — PASS exit 0; emitted existing dependency catalog warnings and doctrine warnings only.
- Wrapper note: `run-deno-lint.ts` and `run-deno-fmt.ts` were invoked with the requested roots but returned nonzero with 0 parsed findings while selecting 593 files despite `--ext`/`--include`; direct scoped TS `deno lint`/`deno fmt --check` over the affected source set passed. Raw `deno fmt --check packages/cli packages/database packages/telemetry` only reported pre-existing Markdown wrapping in `packages/database/README.md`.
- Version/changelog note: no `CHANGELOG` files exist for `packages/cli`, `packages/database`, or `packages/telemetry`. Package versions remain at the repo lockstep `0.0.1-alpha.0`; this conflicts with the run plan's minor-bump decision and the repo standards lockstep invariant, so the PR body must carry the breaking alpha note and IMPL-EVAL should rule on version timing.
- Lock/cast hygiene: no `deno.lock` change; no new `as` casts in the diff.
- Lock hygiene preserved — no `deno.lock` churn, no source edits, no implementation commits.
## 2026-06-23 — PLAN-EVAL cycle 2

- Verdict: **PASS** (cycle 2 of 2; final). Run: openhands-run-27988081250-1.
- S3b (workers-side slice) cleanly DEFERRED per user-confirmed option (b). Verified at tip `5d1bee91`:
  all workers-side surface (schedule field + scheduler port + builder method + scaffold + CLI flag +
  template + 4 docs/recipe/site references) is intact and untouched by PR-B.
- S3a (saga legacy) verified self-contained: no dependency on deferred workers work;
  `saga-supervisor.ts:130` fold onto native default is correct (native is the default in
  `create-saga-runtime.ts:86-90`).
- V8_HEAP_MB fold verified: `v8-profiles.ts:12,46,73` is the only live consumer; other 7 aliases
  re-grepped = 0-consumer.
- Gate set verified sufficient for the smaller breaking removal.
- Version policy + zero-cast re-confirmed.
- Lock hygiene preserved — no `deno.lock` churn, no source edits, no implementation commits.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` for full findings.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` for drift notes.

## 2026-06-23 — S2 implementation: Tier 2 option fields

- Scope:
  - Removed the deprecated MSSQL `trustedConnection` option and folded integrated security onto the canonical
    `authentication.type = "ntlm"` path.
  - Removed deprecated Fresh `serveStaticFiles` and `registerFsRoutes` options, using canonical
    `staticFiles` and `fsRoutes` instead.
  - Updated Fresh tests to use canonical options.
- Consumer proof:
  - `trustedConnection`, `serveStaticFiles`, and deprecated option-shaped `registerFsRoutes?:` have zero hits in
    `packages/database` and `packages/fresh` after the edit.
- Gates:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/database --root packages/fresh --ext ts,tsx --pretty` — PASS, 167 files, 2 batches, 0 occurrences.
  - `deno lint packages/database/adapters packages/database/extensions packages/database/ports packages/database/prisma-tracing.ts packages/database/mod.ts packages/fresh/src packages/fresh/mod.ts` — PASS, 150 files.
  - `deno fmt --check packages/database/adapters packages/database/extensions packages/database/ports packages/database/prisma-tracing.ts packages/database/mod.ts packages/fresh/src packages/fresh/mod.ts` — PASS, 153 files.
  - `deno doc --lint packages/database/mod.ts` — PASS, with npm `@types/node` unresolved-type warnings only.
  - `deno doc --lint packages/fresh/mod.ts` — PASS.
  - `deno task --cwd packages/database test` — PASS, 5 tests / 7 steps.
  - `deno task --cwd packages/fresh test` — PASS, 141 tests.
  - `rtk proxy deno task arch:check` — PASS exit 0; emitted existing dependency catalog warnings and doctrine warnings only.
- Lock/cast hygiene: no `deno.lock` change; no new `as` casts in the diff.
