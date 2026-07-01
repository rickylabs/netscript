# PLAN-EVAL — chore-alpha1-jsr-shim-removal (cycle 2)

- Plan evaluator session: openhands-run-27988081250-1 (2026-06-23)
- Run: `chore-alpha1-jsr-shim-removal`
- Branch / tip: `chore/alpha1-jsr-shim-removal @ 5d1bee91`
- Surface / archetype: multi-package framework edit. Archetypes touched: ARCHETYPE-2 (cli),
  ARCHETYPE-3 (database), ARCHETYPE-5 (plugin-sagas-core), plus fresh + telemetry packages
  (ARCHETYPE-2/3). Scope overlays: SCOPE-service (Tier 2/3a touch runtime paths).
- Baseline verified: `origin/main @ df67038d` (post PR-A #111 + arch-debt #112). Tip `5d1bee91`
  is planning-only: diff against `origin/main` is purely evaluator artifacts
  (`plan.md`/`research.md`/`drift.md`/`plan-eval.md`/`worklog.md`/`commits.md` + cycle-1 trace).
  No source edits, no `deno.lock` churn.
- Lock hygiene preserved.

## TL;DR

**Verdict: `PASS`.** The revised plan correctly closes the cycle-1 unsoundness. S3b (workers-side
slice) is now genuinely deferred — every workers-side surface (`JobDefinition.schedule`,
`JobBuilder.schedule`, scheduler plumbing, scaffold emission, CLI `--schedule`, the documented
`.schedule(...)` examples in README + recipes + site docs) is intact at tip `5d1bee91` and the
plan's `## Slices` explicitly excludes it. S3a (saga legacy) is self-contained — the saga-bus
subsystem has no dependency on the deferred workers work; the lone external caller
`saga-supervisor.ts:130` folds cleanly onto the native default. The `V8_HEAP_MB` correction is
accurate: `v8-profiles.ts:12,46,73` is the only live consumer of any of the 8 cli aliases;
`DEFAULT_V8_HEAP_MB` is value-identical; S1 lists the fold before the delete; the other 7
aliases remain 0-consumer. The named S1 pre-delete grep gate + `deno doc --lint` +
per-package test + `arch:check` + `publish:dry-run` + `scaffold.runtime-at-IMPL` set is
sufficient for the (now smaller) breaking removal, and the jsr-audit note correctly concludes
that removal-only strictly shrinks the surface with no new slow-types. Version policy (alpha-1
minor bump with breaking note) and zero-cast hold for the reduced set. Lock hygiene rule
(no `deno.lock` churn) is in place. No implementation begins until the next session.

## Cycle-1 → cycle-2 diff (what changed)

| Area                              | Cycle-1 plan                                  | Cycle-2 plan (this run)                                                |
| --------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| Tier-3 scope                      | T3 wholesale (saga + workers)                 | S3a (saga) only; S3b (workers) DEFERRED out of PR-B                     |
| Workers `JobDefinition.schedule`  | "remove"                                      | Untouched (lives at tip, no PR-B edit)                                  |
| Workers `JobBuilder.schedule()`   | "remove"                                      | Untouched                                                              |
| `v8-profiles.ts` consumer of `V8_HEAP_MB` | Missed (marked 0-consumer)             | Folded onto `DEFAULT_V8_HEAP_MB` before delete (3 lines, value-identical)|
| Grep gate                         | "Codex must grep" (open item, not a gate)     | Named, blocking S1 pre-delete grep gate over templates/docs/plugins/*/templates/scaffold |
| `deno doc --lint`                 | Not in gate set                               | Added per affected package                                             |
| `jsr-audit` surface scan          | Not run                                       | Run; conclusion = removal-only ⇒ no new slow-types, residual = dangling refs (mechanically gated) |
| Open-decision sweep               | Did not flag S3b canonical-replacement gap    | Swept: version-policy RESOLVED, T3-scope RESOLVED, doc-refs RESOLVED into grep gate |

## Plan-Gate checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS     | `research.md` exists; re-baselined against `origin/main @ df67038d`; V8_HEAP_MB consumer correction at Tier 1 documented.        |
| Decisions locked                        | PASS     | Decisions #1-#4 re-stated with cycle-1 corrections applied. S3b deferred via user-confirmed option (b) — recorded in `drift.md`.    |
| Open-decision sweep                     | PASS     | `plan.md` §Open-decision sweep explicitly enumerates and resolves every cycle-1 open decision; deferred workers-cron is filed as a separate plan, not a PR-B open item. |
| Commit slices (< 30, gate + files each) | PASS     | 3 slices (S1, S2, S3a); each names files + proving gate. S3b explicitly DEFERRED.                                                  |
| Risk register                           | PASS     | Tier classification + V8_HEAP_MB fold + `jsr-audit` surface note cover residual risks (dangling refs).                                |
| Gate set selected                       | PASS     | S1 pre-delete grep gate + scoped check/lint/fmt + `deno doc --lint` per pkg + `deno task test` (cli/db/telemetry/fresh/sagas) + `arch:check` + `publish:dry-run` + `e2e:cli run scaffold.runtime --cleanup --format pretty` at IMPL-EVAL. |
| Deferred scope explicit                 | PASS     | S3b (workers-side) + PR-C (project-wide sweep) explicitly out of scope; both recorded in `drift.md` + `plan.md` §Deferred follow-up.|
| jsr-audit surface scan (pkg/plugin)     | PASS     | `plan.md` §jsr-audit surface scan applies publishability rubric; conclusion = removal-only ⇒ surface strictly shrinks; residual risk = dangling refs (mechanically gated). |

## Verification against the real surface (this branch, tip `5d1bee91`)

### 1. S3b is genuinely gone from scope ✅

Grepped tip `5d1bee91` for every workers-side surface mentioned in cycle-1's ruling. All
intact:

- `packages/plugin-workers-core/src/runtime/runtime-types.ts:54,85` — `readonly schedule?: string`
  on `JobDefinition` / `TaskDefinition` — present, no PR-B edit.
- `packages/plugin-workers-core/src/runtime/runtime-types.ts:209-212` — `RuntimeSchedulerPort`
  (with `schedule(job: JobDefinition)` method) — present.
- `packages/plugin-workers-core/builders/job-builder.ts:50,131` — `JobBuilder.schedule()` decl +
  impl — present (not in PR-B diff).
- `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` — `.schedule(...)` emission —
  present.
- `plugins/workers/src/cli/workers-cli-backend.ts` — `--schedule` flag — present.
- `plugins/workers/src/scaffolding/templates/job-builder.ts.template` — template — present.
- `packages/plugin-workers-core/README.md:99` + `docs/recipes/adding-a-job.md:22` +
  `docs/site/capabilities/durable-sagas.md:191` + `docs/site/explanation/durability-model.md:105`
  — all reference `.schedule(...)` as a live feature — present, no PR-B edit.

Plan.md's `## Slices` lists S3b only as **"DEFERRED (option b). NOT in PR-B."** with an
explanatory paragraph. Plan.md's `## Deferred follow-up` separately records the
workers-cron/triggers-cron unification as out-of-PR-B scope. `drift.md` records the
2026-06-23 user-confirmed option (b) decision.

**Deferral is clean, not partial.**

### 2. S3a (saga) is sound and self-contained ✅

- `packages/plugin-sagas-core/src/adapters/saga-bus-legacy.ts` — 8 exports
  (`SagaBusLegacyMachine`, `SagaBusLegacyBus`, `SagaBusLegacyLogger`,
  `SagaBusLegacyDefinitionMapper`, `SagaBusLegacyFactory`, `SagaBusLegacyOptions`,
  `SagaBusLegacy`, `createSagaBusLegacy`) — plan removes the whole module.
- Re-export chain: `adapters/mod.ts:85,89` + `runtime/mod.ts:60-62,80` + `presets/mod.ts:8,12` —
  these barrel lines will be removed when the underlying types/exports disappear (plan implies
  this; the grep gate + `deno doc --lint` + `arch:check` mechanically catch any leftover).
- `runtime/create-saga-runtime.ts:43,77-80,86-88` — legacy option field + legacy overload +
  legacy branch — plan removes all three.
- `presets/start-sagas.ts:31-41,59-70` — legacy overloads + legacy branches in
  `startSagas`/`startLegacySagaSupervisor` (the legacy preset re-exports for the saga
  supervisor plugin) — plan removes these.
- **Lone external caller:** `plugins/sagas/src/runtime/saga-supervisor.ts:130` —
  `adapter:'legacy'` fold onto native default. The supervisor's `adapter?` field is optional
  (line 41) and accepts `'native'` by default; folding onto native means passing
  `{ ...options, adapter: 'native' }` or simply omitting the `adapter` field (since `'native'`
  is the default). Verified against `create-saga-runtime.ts:86-90` — omitting `adapter` or
  passing `adapter: 'native'` both yield the native branch. ✅
- **No dependency on deferred workers work.** The saga runtime is a saga-internal scheduler
  (`packages/plugin-sagas-core/src/runtime/saga-scheduler.ts`, internal port), not the workers
  `Scheduler`. Sagas do not consume `defineScheduledTrigger` or `JobBuilder.schedule`. The
  only cross-package dep in `packages/plugin-sagas-core/deno.json:29` is to
  `@netscript/plugin-workers-core` (workspace pkg only), and no `JobDefinition.schedule` /
  `.schedule()` plumbing is touched by S3a. ✅
- **Tests:** `tests/runtime/saga-idempotency_test.ts:5,112,159` — uses `SagaBusLegacy` +
  `SagaBusLegacyBus`. Plan says "delete/retarget their tests." ✅

### 3. V8_HEAP_MB fold is correct ✅

- **Consumer survey** of all 8 cli aliases in `packages/cli/src/kernel/constants/windows.ts:217-231`:
  - `SERVY_CLI_PATH` (line 218) — 0 consumers ✅
  - `WINDOWS_TARGET` (line 220) — 0 consumers ✅ (research.md names it `COMPILE_TARGET` —
    minor doc nit, see non-blocking observations)
  - `WINDOWS_SERVICE_PREFIX` (line 222) — 0 consumers ✅ (research.md names it `SERVICE_PREFIX` —
    minor doc nit)
  - `BUNDLE_EXTERNAL_PACKAGES` (line 224) — 0 consumers ✅ (research.md names it `BUNDLE_EXTERNAL` —
    minor doc nit)
  - `BUNDLE_EXTERNAL_IMPORTS` (line 226) — 0 consumers ✅
  - `COMPILE_TIMEOUT_MS` (line 228) — 0 consumers ✅
  - `BUNDLE_TIMEOUT_MS` (line 230) — 0 consumers ✅
  - `V8_HEAP_MB` (line 232) — **3 consumers at `v8-profiles.ts:12,46,73`** ✅ (correctly noted in
    plan.md §Locked decisions #4 + §Slices S1 + research.md Tier 1 correction)
- **Value-identical fold:** `DEFAULT_V8_HEAP_MB = ...` (line 35) is the canonical; the alias
  `V8_HEAP_MB = DEFAULT_V8_HEAP_MB` (line 232) is a direct reference. Fold at v8-profiles.ts:12,46,73
  is mechanical, no behavior change. ✅
- **S1 fold-before-delete order:** plan.md §Slices S1 says "fold `v8-profiles.ts:12,46,73`
  (`V8_HEAP_MB` → `DEFAULT_V8_HEAP_MB`) ... Then delete: the 8 cli `windows.ts` aliases" —
  fold precedes delete in the slice sequence. ✅

### 4. Gate sufficiency for the (now smaller) breaking removal ✅

- **Named S1 pre-delete grep gate** — plan.md §Gate set line 68-70: `rtk grep` each S1 symbol
  across `templates/`, `docs/`, `plugins/*/templates`, scaffold output. **Verified at tip:**
  zero hits across `packages/plugin/src/templates/skeleton`, `packages/cli/src/kernel/assets`,
  `plugins/workers/src/scaffolding/templates`, and `docs/`. The gate is named, blocking, and
  pre-delete — addressing cycle-1's required fix #5. ✅
- **`deno doc --lint` per affected package** — plan.md §Gate set line 73-74. Required for
  publishability / typedoc-drift on public-surface removals. Addresses cycle-1's required fix #4. ✅
- **Per-package test** — `deno task test` for cli, database, telemetry, fresh, plugin-sagas-core.
  Catches runtime regressions on the removed surface + any test-file consumers. ✅
- **`arch:check`** — catches dangling exports in barrel modules. ✅
- **`publish:dry-run`** — confirms the trimmed public surface still publishes. ✅
- **`e2e:cli run scaffold.runtime --cleanup --format pretty` at IMPL-EVAL** — Tier 2/3a touch
  runtime packages, scaffold runtime is in scope at IMPL pass. ✅
- **jsr-audit conclusion** — plan.md §jsr-audit surface scan: removal-only ⇒ published surface
  strictly shrinks; no new slow-types or JSDoc obligations; every remaining export already
  shipped on `main` (post PR-A); residual risk class = dangling type/value reference to a
  removed symbol; mitigation = `deno doc --lint` + `run-deno-check.ts` + `publish:dry-run`
  per affected package catch any dangling reference at slice time. ✅

### 5. Version policy + zero-cast ✅

- **Version policy** — unchanged from cycle-1 PASS: alpha-1 pre-1.0 (0.0.1-alpha.0) → minor bump
  per affected package (`0.Y.Z → 0.(Y+1).0`) with `BREAKING (alpha-1, zero-compat)` note. Plan
  re-states this in §Locked decisions #2 + §Open-decision sweep. ✅
- **Zero-cast** — removal-only, no new casts introduced. Plan.md §Zero-cast / lock hygiene
  re-states this. The 2-accepted-cast rule unaffected. ✅

### 6. Lock hygiene ✅

- Plan.md §Zero-cast / lock hygiene: "Do NOT churn root `deno.lock`; no `deno cache --reload`."
- Removal drops no live dependency. Implementation will not touch `deno.lock`. ✅

## Open-decision sweep (evaluator-run)

Plan.md §Open-decision sweep explicitly resolves every cycle-1 open decision. Re-run yields:

1. **Version policy** — RESOLVED (alpha-1 minor bump per pkg). No rework risk. ✅
2. **Tier-3 scope** — RESOLVED (S3a saga wholesale retired; S3b workers DEFERRED per option (b)
   with user confirmation in `drift.md` 2026-06-23). No rework risk inside PR-B. ✅
3. **Scaffold/docs/template references** — RESOLVED into a named, blocking S1 grep gate
   (verified clean at tip). No rework risk. ✅
4. **jsr-audit** — RESOLVED (surface-scan note in plan.md §jsr-audit). No rework risk. ✅

No evaluator-found open decisions remaining for PR-B.

## Non-blocking observations (for the implementer / IMPL-EVAL)

These are correctness nits that do not affect plan soundness but should be addressed during
implementation:

1. **research.md Tier-1 alias names** — research.md line 15 lists `COMPILE_TARGET`,
   `SERVICE_PREFIX`, `BUNDLE_EXTERNAL` as the deprecated aliases. The actual `windows.ts:217-231`
   names are `WINDOWS_TARGET`, `WINDOWS_SERVICE_PREFIX`, `BUNDLE_EXTERNAL_PACKAGES`. The
   canonical targets (`DEFAULT_COMPILE_TARGET`, `DEFAULT_SERVICE_PREFIX`, `DEFAULT_BUNDLE_EXTERNAL`)
   match. The grep gate + deletion step target by source-file location, so this does not affect
   plan gate sufficiency. Implementation should use the correct alias names from `windows.ts` when
   running the grep gate (zero hits regardless of name). **Suggest updating research.md line 15
   for documentation accuracy.**
2. **S3a doc-file references** — the S3a slice's structural scope is sound, but the plan does
   not explicitly enumerate narrative-doc references to `SagaBusLegacy` / `adapter: 'legacy'`:
   - `packages/plugin-sagas-core/README.md:108,142`
   - `packages/plugin-sagas-core/docs/runtime-composition.md:27`
   - `docs/site/reference/sagas/index.md:93` (`SagaRuntimeAdapter` type alias reference)
   The plan's gate set does not include a doc-prose grep gate (markdown isn't covered by
   `deno doc --lint`). Implementation should update these docs as part of S3a (or add a
   `SagaAdapter`-name-grep gate). `deno task test` for plugin-sagas-core doesn't catch
   markdown references.
3. **S3a barrel-file references** — the plan's S3a scope enumerates primary removal targets
   (`saga-bus-legacy.ts` + `create-saga-runtime.ts:43,79,87` + `start-sagas.ts:41,69-70` +
   `saga-supervisor.ts:130`) but doesn't explicitly enumerate the barrel files that re-export
   the removed types (`adapters/mod.ts:85,89`, `runtime/mod.ts:60-62,80`, `presets/mod.ts:8,12`,
   `plugins/sagas/src/runtime/mod.ts:65-70,87`). These are caught mechanically by
   `deno doc --lint` + `arch:check` + `publish:dry-run` (any leftover type re-export from a
   deleted module is a publish-bar failure), so the gate set is sufficient.
4. **`saga-runner.ts:118`** — `parseAdapter` function returns `SagaRuntimeAdapter`. After S3a
   removes `'legacy'` from the union, the parser must either error on any non-'native' input or
   simply normalize to 'native'. Implementation detail; `deno check` + `deno task test` for
   plugin-sagas-core will surface this.

## Verdict

`PASS`

### Required before IMPL-EVAL (none)

None — every Plan-Gate box is checked.

### Next steps

1. Implementation runs in a separate session (WSL Codex) per the cycle-2 protocol. Order:
   **S1 → S2 → S3a** (each with its own commit + gate).
2. IMPL-EVAL runs after all three slices land, using the gate set in plan.md §Gate set +
   `evaluator/protocol.md`.
3. The deferred workers-cron/triggers-cron unification is a separate plan (out of PR-B + PR-C).
4. Lock hygiene continues to forbid `deno.lock` churn and `deno cache --reload`.

## Notes for IMPL-EVAL

- Cycle 2 of 2 is the final PLAN-EVAL pass; this is the last plan-side gate before code lands.
- No `deno.lock` churn, no source edits, no commits other than evaluator artifacts performed
  during this cycle.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` (this file) for the verdict
  artifact; see `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` for drift notes.