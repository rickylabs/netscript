# Drift — chore-alpha1-jsr-shim-removal

(append-only)

## 2026-06-22 — PLAN-EVAL cycle 1 (openhands-run-27986503722-1)

- **Plan premise drift:** S3 wholesale retirement claims
  `defineScheduledTrigger().enqueueJob(...)` is the canonical replacement for
  `defineJob().schedule(cron)`. Verified false against the tree:
  - `plugins/workers/deno.json` does not depend on `@netscript/plugin-triggers-core`.
  - The two cron subsystems run through separate runtime adapters (workers `Scheduler` →
    `@netscript/cron` vs triggers `CronTriggerSchedulerAdapter` → `@netscript/cron`) and have
    separate scaffolds (`job-scaffolders.ts:64-65` vs `trigger-scaffolders.ts:86-88`) and
    separate CLI flags (`workers-cli-backend.ts` `--schedule` vs `triggers-cli-backend-support.ts`
    `defineScheduledTrigger` inspection).
  - S3b (workers-side) wholesale removal would orphan the public `JobDefinition.schedule`
    field (re-exported via `packages/plugin-workers-core/src/public/mod.ts`), the
    `JobBuilder.schedule()` method, the in-process `Scheduler` class, the scaffold emission,
    and the documented `.schedule(...)` examples in
    `packages/plugin-workers-core/README.md:99` + `docs/recipes/adding-a-job.md:22`.
- **Documented public-surface gap:** `.schedule(cron)` referenced in
  `docs/site/capabilities/durable-sagas.md:191` and
  `docs/site/explanation/durability-model.md:105`; not in S3 file list.
- **No implementation drift** — no source edits performed during this cycle.
- **Lock hygiene preserved** — no `deno.lock` churn.
- Verdict artifact: `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md`.

## 2026-06-23 — cycle-1 response: option (b) [user-confirmed]

- **Decision:** ship **T1 + T2 + S3a (saga)** in PR-B; **defer S3b (workers `.schedule()`)** entirely.
  User confirmed option (b) 2026-06-23 ("yes option B ship ... road to JSR publish").
- **Manifest correction (significant):** the T1 0-consumer claim missed one live consumer —
  `packages/cli/src/kernel/adapters/windows/runtime/v8-profiles.ts:12,46,73` imports the deprecated
  alias `V8_HEAP_MB`. (PLAN-EVAL also marked this 0-consumer; both the supervisor grep and the user
  caught it.) S1 now folds those 3 lines onto `DEFAULT_V8_HEAP_MB` before deleting the alias. The
  file stays — it is the Windows V8 heap-sizing path. No behavior change (alias === canonical value).
- **Deferred follow-up (architectural, out of scope):** workers-cron / triggers-cron unification must
  precede any workers `.schedule()` removal. Tracked as a separate rescope plan; excluded from both
  PR-B and PR-C.
- **Gate additions for cycle 2:** named S1 pre-delete grep gate; `deno doc --lint` per affected
  package; jsr-audit surface-scan note (removal-only → surface shrinks; residual risk = dangling refs,
  mechanically gated).
## 2026-06-23 — PLAN-EVAL cycle 2

- Verdict: **PASS** (cycle 2 of 2; final). Run: openhands-run-27988081250-1.
- S3b cleanly DEFERRED — verified at tip `5d1bee91`: every workers-side surface
  (`runtime-types.ts:54,85,209-212` schedule field + `RuntimeSchedulerPort` + `JobBuilder.schedule()`
  at `builders/job-builder.ts:50,131` + scaffold emission at `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65`
  + CLI `--schedule` flag + `job-builder.ts.template`) is intact and untouched by this PR. Plan's
  `## Slices` explicitly excludes S3b; `## Deferred follow-up` records the workers-cron/triggers-cron
  unification as out-of-PR-B scope.
- S3a verified self-contained: saga-bus subsystem has no dep on deferred workers work;
  `saga-supervisor.ts:130` folds cleanly onto the native default (`adapter: 'native'` or omitted
  — both yield the native branch in `create-saga-runtime.ts:86-90`).
- V8_HEAP_MB fold verified: `v8-profiles.ts:12,46,73` is the only live consumer of any of the 8 cli
  aliases in `windows.ts:217-231`. `DEFAULT_V8_HEAP_MB` (line 35) is value-identical. Other 7 aliases
  re-grepped: all 0-consumer.
- Gate set verified sufficient for the (smaller) breaking removal: named S1 pre-delete grep gate +
  `deno doc --lint` per pkg + per-package `test` + `arch:check` + `publish:dry-run` +
  `e2e:cli run scaffold.runtime` at IMPL-EVAL. jsr-audit note correctly concludes removal-only ⇒
  surface strictly shrinks; residual risk = dangling refs, mechanically gated.
- Version policy + zero-cast re-confirmed for the reduced set.
- Lock hygiene preserved — no `deno.lock` churn.
- **Non-blocking observations** (for implementer / IMPL-EVAL):
  1. research.md Tier-1 line 15 uses `COMPILE_TARGET` / `SERVICE_PREFIX` / `BUNDLE_EXTERNAL` —
     actual `windows.ts` names are `WINDOWS_TARGET` / `WINDOWS_SERVICE_PREFIX` /
     `BUNDLE_EXTERNAL_PACKAGES`. Canonical targets match. Plan not affected; suggest updating
     research.md for accuracy.
  2. S3a narrative-doc references (not enumerated in plan's file list): `README.md:108,142` +
     `docs/runtime-composition.md:27` + `docs/site/reference/sagas/index.md:93`. Add a doc-prose
     grep gate or update as part of S3a.
  3. S3a barrel-file references (not enumerated): `adapters/mod.ts:85,89`, `runtime/mod.ts:60-62,80`,
     `presets/mod.ts:8,12`, `plugins/sagas/src/runtime/mod.ts:65-70,87`. Mechanically caught by
     `deno doc --lint` + `arch:check` + `publish:dry-run`.
  4. `plugins/sagas/src/runtime/saga-runner.ts:118` `parseAdapter` must be normalized post-S3a
     (`SagaRuntimeAdapter` union drops `'legacy'`).
- Verdict artifact: `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md`.
- **Next:** implementation runs in a separate session (WSL Codex). Order: S1 → S2 → S3a.