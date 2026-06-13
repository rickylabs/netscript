# PLAN-EVAL — 5d4 streaming (defer + PSR + e2e streams)

**Evaluator session:** OpenHands 27461651497 (separate from generator)  
**Run ID:** `feat-package-quality-wave5-apps--5d4-streaming`  
**Branch:** `feat/package-quality-wave5-apps-5d4-streaming` · PR #37  
**Evaluated artifacts:** `research.md`, `design.md`, `plan.md`, `context-pack.md`, `drift.md`, `worklog.md`  
**Protocol:** `.llm/harness/evaluator/plan-protocol.md`  
**Gate checklist:** `.llm/harness/gates/plan-gate.md`  
**Gate matrix:** `.llm/harness/gates/archetype-gate-matrix.md` (Arch 3 required gates)  
**Umbrella authority:** `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` and `handover-5d4-plan.md`

---

## Summary

**Verdict: `NEEDS-REVISION` (FAIL_PLAN)**

The plan delivers a coherent streaming-layering design with a well-scoped problem restatement and a clear defer/SSE/plugin-streams ownership split. The MEASURE-FIRST numbers (113 doc-lint = 63 missing-jsdoc + 50 private-type-ref) are internally consistent between research, context-pack, and plan. The plan's tail sections (Review map, Assumptions, Questions for supervisor, Dependencies & merge impact, Side-effect ledger) are all present and sound. Drift from the umbrella is logged (D-5d4-1..7), not silent.

However, the plan fails three Plan-Gate checklist boxes:

1. **Gate set selected** — for Archetype 3, all 18 F-* gates (`F-1` through `F-18`) are marked `required` in `gates/archetype-gate-matrix.md`. The plan lists only 8 (`F-2`, `F-3`, `F-5`, `F-7`, `F-9`, `F-13`, `F-14`, `F-15`). Ten required gates (`F-1`, `F-4`, `F-6`, `F-8`, `F-10`, `F-11`, `F-12`, `F-16`, `F-17`, `F-18`) plus `Runtime/Aspire validation` and `Consumer import validation` are neither named nor justified as `n/a`/`PENDING_SCRIPT` for this run's surface.
2. **Commit slices** — the 113-error doc-lint budget and 3 likely over-cap files (research §Over-cap inventory) are not retired by any slice. Specifically: `defer/mod.ts` (46 missing-jsdoc + 14 private-type-ref), `streams/mod.ts` (8 missing-jsdoc + 24 private-type-ref), and `server/stream.ts` (4 missing-jsdoc + 3 private-type-ref) have no designated slice. F-1 layer caps for `DeferIsland` (240 lines), `DeferPage` (264 lines), and `sse.ts` (408 lines) are unnamed — no slice owns them, no debt entry defers them.
3. **jsr-audit** — the plan schedules `deno task publish:dry-run` as validation step 4 (post-slicing), but does not document that the `jsr-audit` publishability rubric was applied to the planned public surface *before slicing*, with named slow-type risks. The checklist requires pre-slice naming.

A fourth concern does not currently block but requires clarification:

- **Open-decision sweep** — the "Must resolve now" clock-port decision is listed in the sweep and simultaneously raised as *Question for supervisor #1*. The protocol says: *"If any open decision would force rework when deferred → FAIL_PLAN."* Deferring the clock-port question past plan approval but before slice 3 implementation is the only safe reading. Confirm that the supervisor answer lands before slice 3 begins, or lock a default (local test helper).

Per-slice gates are present (each of 8 slices names gates and files) and the locked decisions (L-5d4-1..6) have rationale. The design's streaming lifecycle, cancellation contract, and port/adapter split are coherent. The umbrella divergence D-5d4-6 (Restructure verdict vs. 5d4 scope) is correctly logged as drift at `minor` severity, not a silent rescope.

---

## Gate-by-gate findings

### 1. Research present and current — ✓ PASS

`research.md` exists, is current, and explicitly reuses verified findings from the prior run (113 combined lint errors, abort/cleanup gaps, private-type-refs, 3-vs-27 coupling). D-5d4-1 documents that the prior run falsely claimed these artifacts were committed; the new run re-measures and confirms them. The research re-baselines against the current branch state.

### 2. Decisions locked — ✓ PASS

Plan §Locked Decisions (L-5d4-1 through L-5d4-6) lists 6 decisions with rationale. Each is specific and actionable. No decision is left vague. Design §Open design questions has 3 "Locked" entries. The decisions are consistent between `plan.md` and `design.md`.

### 3. Open-decision sweep — ⚠ WARNING (non-blocking)

Plan §Open-Decision Sweep lists three items. "Fake timer / clock port for stream tests" is marked **"Must resolve now"** and is simultaneously raised as Questions for supervisor #1. This creates an ambiguity: if the supervisor answer is awaited before *plan* approval, the plan cannot pass; if the answer can be awaited between plan approval and slice 3 implementation, the status should be reworded to "safe to defer to pre-slice-3." **Fix:** lock a default (local test helper; promoted to shared utility only if reused) or note explicitly that supervisor question 1 must be answered before slice 3 begins.

### 4. Commit slices — ✗ FAIL

**Eight** slices (1–8), each named with what it proves, gates, and files. Count is under 30. Order is logical.

**However**, the umbrella target architecture requires *0 over-cap files (baseline 13; F-1 per-layer caps)* and *doc-lint 0 over ALL exports combined*. The 5d4 research identifies 3 likely over-cap files and 113 doc-lint errors across 5 entrypoints. The slice lock does **not** retire this budget fully:

| Slice | Coverage of 113 doc-lint errors | Coverage of F-1 over-cap |
|-------|---|---|
| 1 | DeferPage.tsx (5 missing-jsdoc + 6 private-type-ref), stream-error-boundary.tsx (5 missing-jsdoc + 6 private-type-ref) | DeferPage 264 LOC — not owned |
| 2 | telemetry.ts (not in doc-lint baseline), stream.ts (4 missing-jsdoc + 3 private-type-ref), sse.ts (0 + 3 private-type-ref) | sse.ts 408 LOC — not owned |
| 3–5 | Test files only (not in doc-lint baseline) | N/A |
| 6 | README (not in doc-lint baseline) | N/A |

**Unretired budget:**

- `defer/mod.ts`: 46 missing-jsdoc + 14 private-type-ref — no slice owns these.
- `streams/mod.ts`: 8 missing-jsdoc + 24 private-type-ref — no slice owns these.
- `server/stream.ts`: 4 missing-jsdoc + 3 private-type-ref — partially owned by slice 2 but not named in the "what it proves" column.
- F-1 layer cap candidates: `DeferIsland` (240 LOC), `DeferPage` (264 LOC), `sse.ts` (408 LOC) — not addressed by any slice; no debt entry defers them.

The plan's slice 1 "Files touched" column lists only `DeferPage.tsx` and `stream-error-boundary.tsx`, leaving `defer/mod.ts` (the largest single-file error source at 60 errors) unowned.

**Required fix:** either (a) add a slice that owns the mod.ts barrel files and the F-1 candidates, or (b) mark them explicitly as deferred with a debt entry. Given the umbrella's "0 over-cap files" target, option (b) requires an umbrella drift entry, not silent omission.

### 5. Risk register — ✓ PASS

Plan §Risk Register lists 4 risks with mitigations. Risks are specific (Preact abort semantics, KV watch async cleanup, cascading doc lint, consumer breakage). Mitigations are actionable. Design §Fitness-gate implications aligns.

### 6. Gate set selected — ✗ FAIL

The plan's Fitness Gates table lists 8 gates: F-2, F-3, F-5, F-7, F-9, F-13, F-14, F-15. The plan's validation plan adds Consumer gate and Plan-Gate (slice 8).

**Required Arch 3 gates not addressed:**

| Gate | Matrix status (Arch 3) | Plan mentions | Notes |
|------|---|---|---|
| F-1 File-size lint | required | No | Research identifies 3 over-cap candidates |
| F-4 Inheritance audit | required | No | Likely n/a for streaming surface — but not stated |
| F-6 JSR publishability | required | Indirectly (validation step 4) | But see Finding #7 below |
| F-8 Workspace lib check | required | No | Should at least confirm workspace membership |
| F-10 Test-shape audit | required | No | Slices 3–5 add new tests; shape should be checked |
| F-11 Forbidden-folder lint | required | No | Quick lint, but not listed |
| F-12 Naming-convention lint | required | No | Naming on new/changed exports |
| F-16 Folder-cardinality lint | required | No | `defer/` has 6+ files; not assessed |
| F-17 Abstract-derived co-location | required | No | N/A for streaming surface — but not stated |
| F-18 Sub-barrel lint | required | No | `defer/mod.ts` is a barrel; not checked |

**Other gate families:**

| Gate family | Matrix status (Arch 3) | Plan mentions | Notes |
|---|---|---|---|
| Static gates | required | ✓ (validation steps 1–3) | |
| Runtime/Aspire validation | required | **No** | Handover deep-dive #5 explicitly calls for an Aspire/playground proof |
| Browser validation | n/a (Arch 3 subtype) | n/a | OK |
| Consumer import validation | required | ✓ (slice 7) | |

Phase A reporting convention allows `PENDING_SCRIPT` for gates without automation, but the gate must still be *named* in the plan with evidence. None of the 10 missing F-* gates appear.

**Required fix:** expand the Fitness Gates table to cover all required Arch 3 gates, marking each as either `PASS` (with evidence), `PENDING_SCRIPT` (with manual evidence), `DEBT_ACCEPTED` (with registry entry), or `n/a` (with reason). Runtime/Aspire validation must be added as a slice or explicitly deferred with debt and an umbrella drift entry.

### 7. jsr-audit — ✗ FAIL

The plan-gate checklist requires: *"The jsr-audit skill's publishability rubric has been applied to the PLANNED public surface and slow-type / surface risks are named before slicing."*

The plan schedules `deno task publish:dry-run` as validation step 4 (after slicing). The research identifies private-type-ref risks (JSXInternal, ComponentChildren, WatchableKv, KvKey) but does not apply the full `jsr-audit` rubric as a pre-slice scan.

**Required fix:** document a pre-slice jsr-audit scan of the planned `@netscript/fresh` public surface (the 12 retained subpaths + `./testing`), naming each slow-type risk with its mitigating slice. Alternatively, mark `N/A` with a reason — but for a package wave, N/A is not valid.

### 8. Deferred scope explicit — ✓ PASS

Plan §Non-Scope lists 5 explicit exclusions: full archetype restructure, Fresh runtime rewrite, plugins/streams server adapter changes (unless boundary defect), lockfile regeneration, documentation-site edits. §Hidden Scope lists 3 implicit expansion risks (cascading doc lint, consumer type-check, fake timer strategy). Both sections are clear.

---

## Umbrella consistency check

### Archetype + public-surface correctness

- **Arch 3 (Runtime/Behavior):** correct choice. The wave owns long-running streaming lifecycle (abort handling, KV watch, heartbeat cleanup, renderer teardown).
- **SCOPE-frontend:** correct overlay. Defer island hydration and page rendering are frontend concerns.
- **Public surface:** the plan retains the 12 existing subpaths + `./testing` (per umbrella §Final public surface). L-5d4-5 ("Do not add new package-level exports unless RFC 13/16 explicitly demand it") is umbrella-aligned.

### Per-slice gates: present and real

Each of 8 slices names gates and files. Gate-slice alignment is sound:

- Slice 1 (surface type fixes) → F-5, F-7 ✓
- Slices 3–5 (abort tests) → F-13 ✓
- Slice 6 (permissions) → F-9 ✓
- Slice 7 (consumer type-check) → Consumer gate ✓

However, per-slice F-7 (doc-score = 100) is not explicitly called per slice — only in slice 1. Slices 3–5 add new tests that also need JSDoc.

### MEASURE-FIRST numbers internally consistent

| Metric | Research | Plan context | Consistency |
|---|---|---|---|
| Total doc-lint errors | 113 | Scope mentions "public-surface type defects" | ✓ (but not retired per slice) |
| missing-jsdoc | 63 | — | ✓ reported |
| private-type-ref | 50 | — | ✓ reported |
| deno check exit | 0 | — | ✓ |
| Over-cap candidates | 3 files | — | ✓ reported but not sliced |

### Required plan.md tail sections

| Section | Present | Sound |
|---|---|---|
| Review map | ✓ | ✓ Points to design/plan/context-pack/drift/research |
| Assumptions | ✓ | ✓ Preact version, Deno.Kv watch, phase-1 research validity |
| Questions for supervisor | ✓ | ✓ 3 questions; see Finding #3 re clock-port ambiguity |
| Dependencies & merge impact | ✓ | ✓ Lists deps; notes low-to-medium merge impact |
| Side-effect ledger | ✓ | ✓ 4 side effects with owner slice and mitigation |

### Divergences from umbrella

| Drift entry | Umbrella expectation | 5d4 position | Verdict |
|---|---|---|---|
| D-5d4-6 (doctrine verdict) | Restructure | 5d4 only fixes streaming surface | ✓ Logged as minor drift; not silent rescope |
| D-5d4-7 (clock port) | Clock port in adapters | Open question | ✓ Logged; resolution needed before slice 3 |
| D-5d4-5 (telemetry convention) | 5d1 owns cross-cutting vocab | Defer to 5d1 convention | ✓ Logged; 5d1 is a dependency |

All divergences are logged, not silent. ✓

---

## Blocking findings (top 3)

1. **Gate set selection incomplete** — 10 of 18 required Arch 3 F-* gates not named; Runtime/Aspire validation (required) not planned. Plan-gate box unchecked.
2. **Commit slices do not retire doc-lint and over-cap budgets** — `defer/mod.ts` (60 errors), `streams/mod.ts` (32 errors), and F-1 candidates (3 files) are not owned by any slice; no debt entry defers them. The umbrella's "0 over-cap files" and "doc-lint 0 over ALL exports" targets are unmet for 5d4's surface.
3. **jsr-audit publishability rubric not applied pre-slice** — validation step 4 schedules the dry-run post-slicing, but the checklist requires pre-slice naming of slow-type risks.

## Non-blocking findings (top 3)

4. **Private-type-ref fix direction inconsistency** — Research proposes "re-export from `@netscript/plugin-streams-core` or `@netscript/fresh/streams`"; Drift D-5d4-3 proposes "re-export from a public `@netscript/kv` subpath"; Plan L-5d4-2 says "public or local type aliases." The drift entry's fix direction introduces cross-package scope (touching `@netscript/kv`) that conflicts with the plan's Non-Scope. Lock on a single direction before implementation.
5. **Open-decision sweep / clock port ambiguity** — "Must resolve now" status and "Question for supervisor #1" create a chicken-and-egg. Either lock a default or reword status.
6. **Missing F-1 slice** — Research identifies 3 files likely over layer cap (DeferIsland 240, DeferPage 264, sse.ts 408). The umbrella explicitly targets 0 over-cap files. No slice addresses F-1; no debt entry defers.

---

## Recommendation

Return to Plan & Design. Address the three blocking findings:

1. **Expand Fitness Gates table** to cover all 18 required F-* gates for Arch 3, with `PASS`/`PENDING_SCRIPT`/`DEBT_ACCEPTED`/`n/a` status for each. Add Runtime/Aspire validation as a new slice or debt entry with umbrella drift.
2. **Extend slice lock** to retire the full 113-error doc-lint budget (including `defer/mod.ts` and `streams/mod.ts`) and the 3 F-1 over-cap candidates. If any must be deferred, create arch-debt entries and add an umbrella drift entry noting the exception to the "0 over-cap" target.
3. **Add jsr-audit scan output** (or a summary of the rubric against the planned surface) to the research or plan, naming slow-type risks before slicing.

Two `FAIL_PLAN` cycles are allowed; this is the first. The plan is otherwise coherent and the design is well-structured.
