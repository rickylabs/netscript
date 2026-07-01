# PLAN-EVAL cycle-2 — chore-plugin-rearch-v2--184 (PR #193, issue #184)

## Verdict: **PASS**

Cycle-1 `FAIL_PLAN` verdict, all 6 findings reconciled in `f8e6ea60`. The revised `plan.md` is ready
for the implementation lane (WSL Codex per Q7) to begin S-core-1 under the §Gates/§Acceptance rules.
Two quality concerns are flagged for the supervisor to clean up in `plan.md` text **before** S-core-1
starts; neither is a `FAIL_PLAN` trigger.

## Reconciliation verification (6 cycle-1 findings)

| # | Cycle-1 finding | Plan ref | Status |
|---|-----------------|----------|--------|
| 1 | Open-decision sweep / #181 sequencing | lines 211-218, 232-236 | **CLOSED** — S-conform-triggers HARD BLOCK until #192 (#181) merges, rebase-onto-main + `deno doc` route re-verify gate explicit; all 6 other slices proceed independently of #181; 4 hot shared files named as fixed inputs read post-merge. |
| 2 | Risk register (was: none explicit) | lines 288-299 | **CLOSED** — 8 risks R1-R8, each with likelihood/impact and owning slice/mitigation. R1-R8 cover the real program hazards (R4 verified real: `plugin-workers-core/stores` is currently imported by `plugin-triggers-core/runtime/trigger-runtime-processor.ts:22` — the "pre-trim grep + retain any subpath with a live external importer" mitigation is the right answer). |
| 3 | Cast mechanism self-contradiction | lines 247-271 | **CLOSED** — Resolution B (LOCKED): `definePlugin().build(): PluginManifest`; delete local `*PluginManifest`/`*Contribution` + cast; delete per-connector `inspect*` → core `inspectPlugin`; README/test repoint; per-connector no-dangling grep gate. Prior contradiction ("delete" vs "keep for narrowing") gone. Line refs verified for workers (`src/public/mod.ts:106,244-245,249`; re-export `mod.ts:13`; consumers only at `README.md:45,51` and `tests/public/manifest_test.ts:2,44`). |
| 4 | streams delete-set (was: enumerated) | lines 180-191 | **CLOSED** — `src/public/mod.ts:67-76` (interface), `137-142` (const collapse), `144-147` (keep standalone `defineStream*`); `mod.ts:41` type re-export; live consumers `e2e/probes/probe-context.ts:2` and `tests/public/stream-api_test.ts:3-5` named; `grep StreamsPluginManifest → 0` no-dangling gate. **Minor accuracy issue:** `probe-context.ts:2` does NOT import `defineStream*` (it imports `StreamPayloadSchema` from `public/stream-api.ts`); the plan's instruction that this line "must import `defineStreamTopic/Producer/Consumer`" is fabricated. The grep gate is unaffected. |
| 5 | JSR surface itemization (was: no slow-type/@module scan) | lines 301-328 | **CLOSED** — net-new `./scaffold`, changed `./service` (annotated router + `bindPluginContract`), `build(): PluginManifest`, `-core` subpath trim; each item carries jsr-audit obligations (explicit return types, no slow types, `@module`+symbol docs, clean file list); `deno task publish:dry-run` per package per slice is the gate. Confirmed `./scaffold` is genuinely net-new (not in current `deno.json`). |
| 6 | Open-decision 3 — `runtime/`→`application/` vs `./runtime` subpath | lines 273-286 | **CLOSED** — explicit no-collision statement: internal `-core/src/runtime/` renames to `-core/src/application/` (internal-only, behind `.`); PUBLIC `./runtime` subpath maps to presentation runtime-launch binding (kept only where external consumer needs direct-start, e.g. workers). Consistent across plan (line 158-159 cross-reference; line 82 subpath list; line 285-286 net statement). |

## Hard checks a–g re-grade

| # | Check | Status |
|---|-------|--------|
| a | Base-truth corrected (alpha.16 `fc911ba1` exports `./contract-base`/`./service`/`./adapter`/`./protocol`; only `./scaffold` net-new) | **OK** — confirmed via `packages/plugin/deno.json` |
| b | streams = proxy, NO `contracts/v1`, `serveRpc:false`, `capabilities.hasRoutes:false` | **OK** — `hasRoutes:true` bug correctly identified in `plugins/streams/scaffold.plugin.json:12` and `README.md:87`; plan line 179 fix |
| c | Aspire base extension (`AspireNSPluginContribution`) | **OK** — confirmed at `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts:10` |
| d | Removal hazards (triggers VOID-remove now-backed routes; streams no-dangling) | **OK** — line 216 explicit VOID on the A11-remove-6-routes synthesis instruction; line 190-191 grep gate |
| e | Cast budget | **QUALITY CONCERN** — see below |
| f | Greenfield S9 `plugin new` BEFORE conformance with 5-gate bar, `./scaffold` AST/factory codegen, retires `.template` | **OK** — slice #2 ordering correct; Q5=YES at line 229; AST/factory-only at line 53 |
| g | `e2e-cli-prod` = HARD release-acceptance gate, never "expected drift" | **OK** — line 243-244 + R6 |

## Quality concerns to clean up in `plan.md` text BEFORE S-core-1 starts

### QC-1 (medium): Cast budget phrasing is internally inconsistent and inconsistent with the live base
- Line 240 says "2-cast budget" but line 269 says "exactly the one centralized-contract `as unknown as` in each `-core` contract".
- Live base has 21+ `as unknown as` casts in `plugin-workers-core` alone (see `streams/producer.ts:59`; `streams/schema.ts:145,164,203`; `config/task-config.ts:109`; `config/job-config.ts:87,109`; `config/workers-config.ts:87,125,129`; `runtime/composition-root.ts:139,141,143,144,145`; `public/root.ts:309,316,323`; `builders/workflow-builder.ts:71,79`).
- The plan's INTENT is clear (no NEW casts beyond the sanctioned centralized-contract one), but the specific number and the "per -core" framing don't reconcile. **Recommendation:** Rephrase to "no new `as unknown as` beyond the sanctioned centralized-contract one; existing in-`core` casts are grandfathered" so the gate is unambiguous.

### QC-2 (minor): Streams `probe-context.ts:2` line ref is inaccurate
- Plan line 188 says the file "must import `defineStreamTopic/Producer/Consumer` from `@netscript/plugin-streams` directly", but the file imports `StreamPayloadSchema` from `public/stream-api.ts` and has no `defineStream*` usage. The grep gate (`grep StreamsPluginManifest → 0`) is unaffected. **Recommendation:** Drop the "must import `defineStream*`" clause from the probe-context line; keep only the grep gate.

## Files inspected (read-only)
- `.llm/tmp/run/chore-plugin-rearch-v2--184/plan.md` (full, 339 lines)
- `.llm/tmp/run/chore-plugin-rearch-v2--184/research.md` (referenced)
- `packages/plugin/deno.json`, `packages/plugin/src/contract-base/domain/base-contract.ts`, `packages/plugin/src/abstracts/plugin-aspire-contribution.ts`, `packages/plugin/src/service/presentation/create-plugin-service.ts`
- `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts`
- `plugins/workers/src/public/mod.ts:105-252`, `plugins/workers/mod.ts:10-20`, `plugins/workers/README.md:45,51`, `plugins/workers/tests/public/manifest_test.ts:2,44`
- `plugins/sagas/src/public/mod.ts:185`, `plugins/streams/src/public/mod.ts:67,137-147`, `plugins/streams/mod.ts`, `plugins/streams/scaffold.plugin.json:12`, `plugins/streams/README.md:87`, `plugins/streams/src/e2e/probes/probe-context.ts:2`, `plugins/streams/tests/public/stream-api_test.ts:3-5`
- `packages/plugin-workers-core/src/streams/{producer,schema}.ts`, `config/{task-config,job-config,workers-config}.ts`, `runtime/composition-root.ts`, `public/root.ts`, `builders/workflow-builder.ts`
- Cross-connector imports from `plugin-workers-core/{stores,telemetry,runtime,builders}` to verify R4 is a real, mitigated hazard.

## Verdict
**PASS** — all 6 cycle-1 findings reconciled, hard checks a–g confirmed against the live alpha.16 base.
QC-1 and QC-2 are plan-text cleanups, not gate failures; recommend addressing in the plan before
S-core-1 begins to keep the §Gates cast-check unambiguous.
