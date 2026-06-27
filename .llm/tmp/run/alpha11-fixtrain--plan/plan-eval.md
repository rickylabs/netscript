# alpha.11 fix-train — PLAN-EVAL verdict

**Run:** `alpha11-fixtrain--plan`
**Surface:** `netscript-framework` (CLI + SDK + fresh + service + e2e + docs)
**Evaluator:** OpenHands minimax-M3, separate session
**Inputs reviewed:** `research.md` (114 lines), `plan.md` (214 lines), doctrine (10 files), `gate/plan-gate.md`, `verdict-definitions.md`, plus targeted code-truth verification against current `main` (alpha.11-pre).

## Verdict

**`PASS`** — plan is implementation-ready. Six non-blocking advisories follow; none require a slice change.

## Plan-Gate checklist

| # | Box | Status | Evidence |
|---|-----|--------|----------|
| 1 | Research present and current | ✅ | `research.md` exists; re-baselined against current `main` (PR #154 Aspire 13.4.6 merge noted at line 112; `a864` code-truth scout result folded in). |
| 2 | Decisions locked | ✅ | All five dispositions (F-3, F-4, F-6, F-11, F-13/12, F-15) carry rationale + user decision date 2026-06-27. F-6 disposition corrected after scout (`research.md` lines 80-92). |
| 3 | Open-decision sweep | ✅ | Four open items (plan §"Open for PLAN-EVAL to rule on", lines 206-214); three are implementation details (cache env contract name, `withHealth` wiring path, `getQueryState` rewrite vs add). None would force rework if deferred. Interactive scope is explicitly LOCKED BROAD. |
| 4 | Commit slices enumerated, ordered, < 30 | ✅ | Six slices (A, B, C, D, E, F) with clear file scope, gate, and what each proves. Topology diagram (lines 31-38) shows parallel-safe A/B/E and serial D/F. Each slice maps to ≤ 5 commits on review. |
| 5 | Risk register | ✅ | Garnet/deno-kv integration thinness (plan §"Debt", lines 199-204); F-15c publish-only drift; F-13 conditional on Slice E probe; SDK `getQueryState` addition (only if Slice B takes that path). Each has a mitigation. |
| 6 | Gate set selected | ✅ | Per-slice scoped `run-deno-{check,lint,fmt}.ts --ext ts,tsx` on touched packages (`.llm/tools/`); `deno task test` per package; `deno doc --lint` on changed public exports; full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` GREEN incl. new `:3001` probe and default redis cache resource; Lume build + xref + comp-syntax landmine pre-flight. |
| 7 | Deferred scope explicit | ✅ | #138 fixed-port flake (cross-cutting, plan line 182); deno-kv/garnet backends "default redis MUST be fully working for alpha.11" (line 128). |
| 8 | jsr-audit on planned public surface | ✅ | New CLI surface (`--cache` / `--cache-backend`) → contract-first with full public-surface scan via `deno doc --lint` (plan lines 119, 128). Potential SDK surface change (`getQueryState`) flagged as deliberate public-surface addition (plan line 73, 204). |

## Adjudications (the six items the task asked me to rule on)

### 1. Slice decomposition & lane split

**Verdict: correct.**

- A (CLI-core, F-3 + F-4) — independent, no new public surface, Codex lane. ✅
- B (type-soundness, F-15) — independent, scoped to `packages/sdk` + scaffold template; Codex lane for F-15a/b, verify-only for F-15c. ✅
- C (interactive + cache, F-11) — **new public surface** → contract-first; its own PLAN-EVAL focus is correct because the gate set must include `deno doc --lint` on the cache flags and a snapshot test per backend. ✅
- D (doc-truth, F-6/8/12 + minors) — docs lane, sequenced AFTER code so docs reflect reality. ✅
- E (health + e2e, F-14 + F-13 diagnosis + coverage gap) — Codex lane; the new `:3001` probe also DIAGNOSES F-13 (conditional plan: "if probe is RED on Linux/aspire-start, escalate to a service-runtime scaffold slice"). ✅
- F (install pin + alpha banner, F-1) — docs lane, independent of D. ✅

The Claude-supervises / Codex-implements / docs-lane split is correct: Slices A/B/C/E are framework source → Codex; Slices D/F are docs lanes (Claude per the docs-authoring exception).

### 2. F-6 disposition (db self-provisions Aspire → doc fix, not code reorder)

**Verdict: confirmed.**

Code-truth check against `packages/cli/src/infra/database/operation-runner.ts:76-99,128-131,195-217`: `DbOperationRunner.executeDetached()` shells out to `aspire start` detached, runs the Prisma op as an Aspire resource, polls `aspire describe`/`aspire wait`, then stops. The CLI's `initNextSteps()` order (`aspire restore` → `db` → `aspire run`, `init-orchestrator.ts:94-131`) is intentionally correct. The plan's "F-6 = doc/messaging fix, not code reorder" is **correct**.

Latent risk (plan line 90): db's INTERNAL `aspire start` can collide on #138 fixed ports if the user already has a separate Aspire up. Plan correctly defers the deep fix to #138 (cross-linked from Slice D) and records the caveat in `drift.md`. ✅

### 3. F-13 diagnosis (Windows-`aspire run`-specific, fixed via Slice D)

**Verdict: sound.**

`init-orchestrator.ts` line 111 (`initNextSteps()` for local-import mode) emits `aspire run`, not `aspire start`. The e2e `scaffold.runtime` uses `aspire start --apphost <p> --isolated --non-interactive --nologo` and is green on Linux. Plan's diagnosis: the F-13 `:3001` not-served defect is Windows-`aspire run`-specific; Slice D's `aspire run`→`aspire start` fix closes the user-facing symptom, and Slice E's new `:3001` e2e probe provides a regression guard. The conditional escalation ("if probe is RED on Linux, the service genuinely isn't wired → escalate to a new service-runtime slice") is the right safety valve. ✅

### 4. New public surface (Slice C)

**Verdict: doctrine-conformant and adequately specified.**

- Flags: `--cache` (default ON) + `--cache-backend redis|garnet|deno-kv` (default redis). Defaults preserved for CI non-interactive. ✅
- Interactive prompt host: `PromptPort` (`packages/cli/src/kernel/ports/prompt-port.ts`) + `CliffyPrompt` adapter (`packages/cli/src/kernel/adapters/runtime/prompt/cliffy-prompt.ts`) are dormant infrastructure; `init` is the first consumer. The wiring is additive, not a new abstraction. ✅
- `--ci` and `--yes` already exist on `init-command.ts:57` and `scaffold-command.ts:40`, labeled "non-interactive mode" — confirms interactive was the designed default. Plan's "TTY + not `--ci`/`--yes` → prompt" gating aligns with the existing escape hatches. ✅
- Per-backend scaffold emission (redis / garnet / deno-kv) is specified at the right level of abstraction (resource name, appsettings, env wiring per backend). Plan correctly says "Default redis MUST be fully working for alpha.11" and records the others as debt if thin. ✅
- `deno doc --lint` on the new flags is in the gate set. ✅

### 5. Type-soundness (Slice B)

**Verdict: preferred path correct; F-15c disposition acceptable.**

- F-15a/b: `QueryClientPort` (`packages/sdk/src/ports/query-client.ts:35-63`) lacks `getQueryState`, but the method DOES exist on the underlying `@tanstack/query-core` 5.101.0 (verified: `queryClient.d.ts` ships `getQueryState<T>(queryKey): QueryState | undefined`). The template calls the method on a real `QueryClient` (not via the port), so the runtime works; only the local **type** is wrong because the port is structural. **Template-rewrite to existing port methods is preferred** — no need to widen the SDK public surface for a method that already exists on the underlying client. ✅
- F-15c: `NetScriptVitePlugin` returns a Vite `Plugin` (scout couldn't reproduce the `PluginOption` error from local source). Most likely cause = published alpha.10 drift. The plan's "verify against published alpha.10; if publish-only, record, do not chase a local non-error" is **correct** — the cost/benefit of hunting a phantom local type error is bad. The fix self-resolves on alpha.11 republish. ✅

### 6. Gate set + debt

**Verdict: sufficient and complete.**

- Per-slice gates: scoped `check`/`lint`/`fmt` (TypeScript only) + package unit tests + `deno doc --lint` on changed public exports + e2e `scaffold.runtime` GREEN with the new `:3001` probe and the default redis cache resource. ✅
- Debt list: garnet/deno-kv integration constants (if any ship behind follow-up); F-15c publish-only drift (record, don't chase); F-13 conditional on Slice E probe; SDK `getQueryState` (only if Slice B takes that path). All four have an owner-class ("drift.md branch" / "arch-debt.md" / "Plan & Design reopen"). ✅
- Deferred scope: #138 fixed-port flake explicitly cross-linked from Slice D (line 182). ✅

## Non-blocking advisories

1. **F-14 may be a no-op on current `main`.** Code-truth check: `defineService()` (the preset used by `packages/cli/src/kernel/assets/service/main.ts.template:10`) calls `builder.withHealth()` UNCONDITIONALLY at `packages/service/src/presets/define-service.ts:205`. `withHealth()` registers `GET /health|/health/live|/health/ready` via `createHealthHandler` (`packages/service/src/builder/service-builder-impl.ts:354-363`), and `/health` is in `DEFAULT_ANONYMOUS_PREFIXES` (`packages/service/src/auth/auth-middleware.ts:23`) → unauthenticated. The research.md claim that the scaffolded service "is oRPC-only and never calls it" is **stale** for current `main`. The F-14 disposition should be downgraded from "code change required" to "verify the fix is in place; only the e2e probe is the new work." Slice E's "failsafe" template rewrite is harmless if redundant. **Action:** implementer should run the new `:3001` probe first; if it goes GREEN, treat the template rewrite as an optional hardening pass and close F-14 in `drift.md` with evidence.

2. **Slice B default path locked.** The plan says "PLAN-EVAL to confirm which path" for F-15a/b. The preferred path is **template-rewrite** (see adjudication §5). The SDK widening (`getQueryState` on `QueryClientPort`) is a contract-first addition that warrants its own PLAN-EVAL focus if taken — implementer should NOT take it casually during Slice B.

3. **Slice C: cache env contract name.** The plan says "CACHE_URL or the framework's cache env contract" (line 107). Before adding a new key, the implementer should grep `appsettings.json` templates and `CACHE_URL`/`CACHE_*` references across the SDK and service packages to avoid name drift. Reuse the existing framework convention if one exists.

4. **Slice F: version mechanism first.** The plan says "FIRST verify whether the docs homepage already injects a version dynamically" (line 171). This is the right sequencing — if `docs/site/_data` (Lume) or `docs/site/_config.ts` already has a version source, the work is "use the existing mechanism across all tutorials + add alpha banner." If not, a new Lume `_data` source is needed. The plan covers both paths; just do the verification first.

5. **Eye-test serialization guard.** The plan mentions "serialize vs any Windows eye-test Aspire to avoid the cross-OS :18891 collision until #138 lands" (lines 185-186). This is a runtime coordination note for the supervisor; should be captured in `worklog.md` for the eye-test follow-up run so the implementer doesn't trip on it.

6. **F-15c evidence.** When Slice B closes, the implementer should record the publish-only drift evidence in `drift.md` (a clean local `deno check` on `packages/fresh` + the published alpha.10 vs local `Plugin` type comparison). The plan says "record, do not chase" — consistent with this.

## Summary

Plan is implementation-ready. Slice decomposition, dependency order, lane split, gate set, and debt list are all sound. The four items left for PLAN-EVAL adjudication are all resolved above (template-rewrite preferred for B; cache env contract name to be checked in C; `withHealth` wiring path is implementation-detail; interactive scope is locked). F-6 disposition is confirmed. F-14 advisory is the only finding that downgrades Slice E's template work from "required" to "verify-only."

**Verdict: `PASS`**

