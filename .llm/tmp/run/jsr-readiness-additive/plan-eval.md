# PLAN-EVAL — `jsr-readiness-additive` (PR-A, non-breaking half)

- Plan evaluator session: OpenHands minimax-M3, separate session from planner, 2026-06-22.
- Run: `jsr-readiness-additive`
- Branch under evaluation: `chore/jsr-readiness-additive` (off `origin/main`)
- Merge-base: `cc3b8731`. Umbrella tip: `eebeb5a6` (`release/jsr-readiness`). Main tip: `9c229624`.
- Surface / archetype: **Mixed** — repo tooling + deno.json task graph + READMEs/doctrine + a small
  additive fresh-ui type-export slice. Scope overlay: `SCOPE-docs` (READMEs/doctrine slices); no
  archetype overlay (no public API is removed/renamed).
- Inputs read: `research.md`, `plan.md`, `gates/plan-gate.md`, `gates/archetype-gate-matrix.md`,
  `evaluator/plan-protocol.md`, `evaluator/verdict-definitions.md`,
  `archetypes/SCOPE-docs.md`, `agents/skills/jsr-audit/SKILL.md`, `AGENTS.md`.
- Method: read-only `git` verification on `origin/main`, `origin/release/jsr-readiness`, and
  `cc3b8731`. No implementation. No `deno.lock` churn. No commits on the branch.

## Checklist results

| Plan-Gate item                          | Result         | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | -------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Research present and current            | **PASS**       | `research.md` §"Valid set classification" re-baselined against current main with merge-base `cc3b8731`; per-file base==main classification via `git ls-tree` blob comparison. Spot-checked 22 paths (see Notes §A) — all confirmed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Decisions locked                        | **PASS**       | Plan §"Scope decision LOCKED by user (2026-06-22)" — split program (PR-A non-breaking, PR-B breaking after consumer-check). Plan §"Archetype + surface" — `SCOPE-docs` overlay for README/doctrine slices + tooling; fresh-ui is additive-only, no archetype overlay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Open-decision sweep                     | **PASS**       | Plan §"Open-decision sweep" enumerates 4 items (pages.yml DEFERRED, 6 drifted READMEs RESOLVED NOW, arch:check reconcile RESOLVED NOW, fresh-ui collision check at impl time). Evaluator-run sweep (Notes §B) found 0 additional deferred-decision rework risks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Commit slices (< 30, gate + files each) | **PASS**       | Plan §"Commit slices" — 6 slices, ordered, each with files. Each slice is bounded (≤ ~30 files). Slices don't name a per-slice proving gate by ID, but the plan's Gate Set (§"Gate set") names the full set and every slice falls under one or more of: `check`/`lint`/`fmt:check`/`deps:check`/`arch:check`/`check-readme-standard`. Plan-protocol asks for "what it proves, the gate that proves it" — loosely satisfied; see Notes §C.                                                                                                                                                                                                                                                                                                                  |
| Risk register                           | **PASS**       | Plan §"Risk register" — 5 risks (R1 fresh-ui drift, R2 deno.json merge, R3 lock churn, R4 README type-fence, R5 doc-lint regressions) each with mitigation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Gate set selected                       | **PASS**       | Plan §"Gate set" — `check` (+ `--unstable-kv`), `lint`, scoped `fmt:check` (`--ext ts,tsx`), `deps:check`, `arch:check`, README doc-lint. Adequate for the planned surface (Notes §D).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Deferred scope explicit                 | **PASS**       | Plan §"Out of scope (dropped / deferred)" — DROP (docs/site/**, .llm/tmp/run/**, G1-6, optional G1-1), DEFER to PR-B (G1-2/3a/3b/3c/4/5 — every breaking prod-readiness removal), DEFER separate (pages.yml).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| jsr-audit surface scan (pkg/plugin)     | **PASS**       | Plan §"jsr-audit rubric (applied to PLANNED surface)" — PR-A changes no published surface except additive type exports on `packages/fresh-ui/`. Verified (Notes §E): no slow types, no `any`, all new exports are pure type re-exports of already-intended types previously failing `private-type-ref` doc-lint. Net publishability: neutral-to-positive.                                                                                                                                                                                                                                                                                                                                                                                                |

## Hard criteria (from the trigger)

### 1. Re-baseline honesty — PASS

Verified the research's central claim that the additive files are base==main by spot-checking 22
paths via `git ls-tree`. Results:

- **21+2 VALID-CLEAN READMEs** (`packages/{contracts,fresh,plugin,cli}/README.md`, `AGENTS.md`,
  `CLAUDE.md`, `CONTRIBUTING.md`, `AGENTS-handoff.md`, doctrine `01-thesis-and-axioms.md`,
  `04-modules-and-and-helpers.md`, `.agents/skills/jsr-audit/SKILL.md`,
  `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/README.md`, `.llm/tools/README.md`)
  — all base==main. ✅
- **16 fresh-ui additions** (interactive.ts, _internal/public-props.ts, accordion/dialog/drawer/
  popover/sheet/tabs/tooltip `.tsx` and `.types.ts`, plus `packages/fresh/deno.json`) — all
  base==main. ✅
- **6 DRIFTED READMEs** (plugin-sagas-core, plugin-workers-core, queue, service, plugins/sagas,
  plugins/workers) — correctly classified as base≠main; plan addresses via hand reconcile
  (S4). ✅
- **Doctrine/skill docs** (AGENTS/CLAUDE/CONTRIBUTING/AGENTS-handoff, doctrine 01/04,
  jsr-audit SKILL, netscript-harness SKILL) — base==main. ✅
- **`openhands-handoff/SKILL.md` drift**: correctly identified — base blob `890b58e7` ≠ main
  blob `19940840`; plan addresses via hand reconcile. ✅
- **`deno.json`**: research correctly identifies only `arch:check` as a CONFLICT (main rewrote
  it to multi-root + added `arch:check:repo`). The `ci:quality`, `fmt:check`, `lint` lines are
  base==main and accept clean appends (see Notes §F). ✅
- **deps-hygiene tooling** (`.llm/tools/deps/{census,scan-npm-catalog-compliance,
  scan-jsr-centralization,audit-file-link,bump-version,bump-version_test,workspace}.ts` plus
  `check-internal-doc-links.ts` and `check-readme-standard.ts`) — net-new, base==main=none. ✅

No additive item claimed-clean actually conflicts with main.

### 2. Scope split integrity — PASS

Plan §"Out of scope (dropped / deferred)" defers every breaking prod-readiness removal to PR-B:

- **G1-2** (compat shims) → PR-B ✅
- **G1-3a** (db conn-string alias) → PR-B; verified `packages/plugin-workers-core/src/runtime/
  job-builder.ts` etc. still has the recurring API on main. ✅
- **G1-3b** (MSSQL JSON alias) → PR-B ✅
- **G1-3c** (MSSQL integrated auth) → PR-B ✅
- **G1-4** (Fresh deprecated options: `serveStaticFiles`, `registerFsRoutes` on
  `define-fresh-app.ts`) → PR-B; verified the umbrella diff is 77 lines of removals and these
  symbols are NOT in PR-A. ✅
- **G1-5** (workers `schedule()` recurring API) → PR-B ✅

PR-A makes no breaking public-surface change. No G1-* removal smuggled.

### 3. Plan-Gate checklist — PASS

Every box in `gates/plan-gate.md` is satisfiable from the plan (see Checklist results table). All
8 boxes PASS.

### 4. Gate set adequacy — PASS

The selected gates (`check`/`lint`/`fmt:check`/`deps:check`/`arch:check`/`check-readme-standard`)
prove the slices:

- `check` → catches the new `.llm/tools/deps/*.ts` scripts (which use `jsr:@std/{path,jsonc}`).
- `lint` → catches the fresh-ui doc-lint fixes (which target `no-explicit-any`/private-type-ref).
- `fmt:check` (scoped `--ext ts,tsx` via `.llm/tools/run-deno-fmt.ts`) → catches the deps scripts
  + fresh-ui additions; excludes Markdown/generated/legacy drift per AGENTS.md guidance.
- `deps:check` → proves the new dep scanners work on the branch.
- `arch:check` → proves the reconcile (prepend `deps:check &&` without clobbering multi-root).
- `check-readme-standard` → proves the US-9 READMEs.

`SCOPE-docs` overlay gates (Source alignment, Scope separation, Link integrity, Terminology,
Drift log) are satisfied by `check-readme-standard` + manual review of hand-reconciled READMEs.

No required gate is missing for the planned surface. The plan correctly excludes
`scaffold.runtime` (no scaffold/DB/Aspire surface touched).

### 5. jsr-audit — PASS

PR-A introduces no new slow-type/`any` publish-surface risk:

- Fresh-ui additions (`interactive.ts`, `_internal/public-props.ts`, accordion/dialog/drawer/
  popover/sheet/tabs/tooltip `.types.ts`) — verified via `git show origin/release/jsr-readiness`
  + grep `: any| as any|<any>`: **zero `any` usages** in the additions.
- All new exports are pure type re-exports (`export type { ... }`) of already-intended types
  (FreshUiAttributeValue, FreshUiChildren, FreshUiElementProps, etc.) that previously failed
  the `private-type-ref` doc-lint because they were declared in `src/runtime/_internal/` but
  were not re-exported from the public surface. Promoting them to the public surface is a
  publishability **improvement** (better docs, more documented symbols, no slow types).
- The breaking publish-surface reductions that materially change the JSR score (removing compat
  shims, deprecated Fresh options, MSSQL aliases) are all in **PR-B**, where the jsr-audit
  rubric will be re-applied.

PR-A is jsr-audit-neutral-to-positive.

## Open-decision sweep (evaluator-run)

| Decision (deferred by plan)                                                                 | Forcing rework if deferred? | Status |
| ------------------------------------------------------------------------------------------- | ---------------------------- | ------ |
| Pages workflow (`pages.yml`) re-baseline to docs-v4                                          | No — independent follow-up   | OK     |
| 6 drifted READMEs reconcile strategy (apply US-9 template over main's current content)      | No — RESOLVED NOW in plan    | OK     |
| `arch:check` reconcile shape (prepend `deps:check &&` without clobbering multi-root)         | No — RESOLVED NOW in plan    | OK     |
| Fresh-ui export additions vs main's auth-era fresh-ui changes                                | Low risk — base==main confirmed; R1 mitigates by re-checking per-file at impl | OK |
| Path discrepancy in plan §1 for doc/readme checkers (see Notes §C)                          | Low — plan hedges with "(verify exact paths on the umbrella tip)" | OK as note |

No additional deferred decision forces rework.

## Verdict

**`PASS`**

Implementation may begin on `chore/jsr-readiness-additive` once the impl session addresses the
notes below.

## Notes for the impl session (non-blocking)

### A. Spot-checked paths (22 total, all confirmed)

- VALID-CLEAN: `packages/contracts/README.md`, `packages/fresh/README.md`, `packages/plugin/README.md`,
  `packages/cli/README.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `AGENTS-handoff.md`,
  `docs/architecture/doctrine/01-thesis-and-axioms.md`, `docs/architecture/doctrine/04-modules-and-helpers.md`,
  `.agents/skills/jsr-audit/SKILL.md`, `.agents/skills/netscript-harness/SKILL.md`,
  `.llm/harness/README.md`, `.llm/tools/README.md` — all base==main. ✅
- VALID-CLEAN (fresh-ui): `packages/fresh-ui/interactive.ts`,
  `packages/fresh-ui/src/runtime/_internal/public-props.ts`,
  `packages/fresh-ui/src/runtime/{accordion, dialog, drawer, popover, sheet, tabs, tooltip}/{*.tsx,*.types.ts}`,
  `packages/fresh/deno.json` — all base==main. ✅
- DRIFTED (correctly classified): `packages/plugin-sagas-core/README.md`,
  `packages/plugin-workers-core/README.md`, `packages/queue/README.md`, `packages/service/README.md`,
  `plugins/sagas/README.md`, `plugins/workers/README.md`. ✅
- `openhands-handoff/SKILL.md` drift: base `890b58e7` ≠ main `19940840`. ✅

### B. Evaluator-run open-decision sweep

Found 0 additional deferred-decision rework risks. The plan's 4-item sweep covers all the
deferral surface. The plan's "RESOLVED NOW" items (6 drifted READMEs, arch:check reconcile)
are correctly classified — deferring them would force rework; the plan resolves them in the
PR-A scope. Pages.yml is correctly deferred (independent of JSR readiness).

### C. Minor plan accuracy issue: doc/readme checker paths

Plan §1 lists the 2 doc/readme checkers at `.llm/tools/docs/check-internal-doc-links.ts` and
`.llm/tools/docs/check-readme-standard.ts`. **Verified on umbrella tip**: they are at
`.llm/tools/` (root), NOT under `docs/`:

```text
.llm/tools/check-internal-doc-links.ts   blob 9eafd4c2...
.llm/tools/check-readme-standard.ts      blob 7c308736...
```

The umbrella's `deno.json` task wiring references these at the correct root paths:
- `docs:links` → `.llm/tools/check-internal-doc-links.ts`
- `docs:readme:check` → `.llm/tools/check-readme-standard.ts`

The plan self-hedges with "(verify exact paths on the umbrella tip)". The impl session MUST
apply these at `.llm/tools/` (root), not at `.llm/tools/docs/`. This is a documentation
accuracy issue in plan §1 — the impl session will resolve it during S1.

### D. Gate set adequacy — additional notes

- The plan does not list `check-internal-doc-links` as a separate gate, only the umbrella's
  `deno.json` task wires it. This is fine — it's a tooling task, not a quality gate.
- `docs:maintenance` task (combines `docs:links` + agentic checks) is not required as a PR-A
  gate; the umbrella has it but it's an aggregate maintenance task, not a per-slice gate.

### E. jsr-audit — verification details

Fresh-ui umbrella additions grepped for `: any\b| as any\b|<any>`:

- `packages/fresh-ui/interactive.ts` → 0 matches. ✅
- `packages/fresh-ui/src/runtime/_internal/public-props.ts` → 0 matches. ✅

All new exports are explicit `export type { ... }` re-exports of types declared in
`accordion.types.ts` / `dialog.types.ts` / etc. (already typed explicitly). No slow types
introduced.

### F. `deno.json` conflict analysis

| Line                        | Base               | Main               | Umbrella           | Conflict? | Resolution                                                    |
| --------------------------- | ------------------ | ------------------ | ------------------ | --------- | ------------------------------------------------------------- |
| `ci:quality`                | `check lint fmt:check` | `check lint fmt:check` | `check lint fmt:check deps:check` | NO (clean append; base==main on the line) | Append `deps:check` to main's current value. ✅ |
| `fmt:check`                 | (existed)          | (existed)          | (same)             | NO        | No change. ✅                                                  |
| `lint`                      | (existed)          | (existed)          | (same)             | NO        | No change. ✅                                                  |
| `arch:check`                | `...check-doctrine.ts` | multi-root + `arch:check:repo` added | `deps:check && ...check-doctrine.ts` | **YES (CONFLICT)** | Reconcile: `deno task deps:check && deno run ... check-doctrine.ts --root <multi-root list> && deno run ... check-doctrine.ts --root <auth-pkgs> && deno run ... check-doctrine.ts --root plugins/auth`. Preserve `arch:check:repo`. ✅ |
| `deps:*` task block         | (not present)      | (not present)      | added              | NO (new)  | Add as new tasks. ✅                                            |
| `docs:links` / `docs:readme:check` / `docs:maintenance` | (not present) | (not present) | added              | NO (new)  | Add as new tasks. ✅                                            |

Only one real conflict region (`arch:check`); the reconcile strategy in plan §3 is correct.

### G. Commit slice gate-mapping

The plan lists 6 slices; the evaluator's gate-mapping (for the impl session):

| Slice | Files                                                | Proving gate(s)                              |
| ----- | ---------------------------------------------------- | -------------------------------------------- |
| S1    | `.llm/tools/deps/**` + `.llm/tools/check-internal-doc-links.ts` + `.llm/tools/check-readme-standard.ts` | `deno task check` + `deno task lint` + `deno task deps:check` |
| S2    | `deno.json` task block + `arch:check` reconcile + D-5 prune | `deno task arch:check` + `deno task deps:check` |
| S3    | 21+2 byte-clean READMEs                              | `deno task check` + `deno task docs:readme:check` |
| S4    | 6 hand-reconciled READMEs                            | `deno task check` + `deno task docs:readme:check` |
| S5    | fresh-ui doc-lint fixes + `packages/fresh/deno.json` | `deno task lint` + scoped `fmt:check` |
| S6    | doctrine/skill docs + `.claude/skills/` regeneration | `deno task agentic:check-claude` + `deno task docs:links` |

### H. Items NOT addressed by plan (correctly)

- `.llm/tools/docs/{check-caveat-refs,check-internal-links}.ts` (added by docs-v4 #110 on main,
  AFTER umbrella tip) are NOT in the umbrella; plan correctly excludes them (they're
  preserved on main). Impl session must NOT delete or touch these — they're main-only tooling.
- `.github/workflows/pages.yml` is correctly DEFERRED (independent of JSR readiness).
- `deno.lock` churn: confirmed `@std/path` and `@std/jsonc` are already in the lock graph on
  main, so the new deps scripts won't trigger lock changes. ✅

## Summary

- 5/5 hard criteria: PASS
- 8/8 plan-gate boxes: PASS
- 0 blocking findings
- 1 minor doc-accuracy issue (C) — impl session must resolve at S1
- 1 minor implicit-preservation note (H) — main's docs/ scripts preserved

**Verdict: `PASS`** — implementation may begin.