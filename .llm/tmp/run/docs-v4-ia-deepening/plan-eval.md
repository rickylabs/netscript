# PLAN-EVAL — docs-v4-ia-deepening (cycle 2 of 2, FINAL)

- Plan evaluator session: OpenHands minimax-M3 (separate session; not the Claude author / not the
  WSL Codex implementer / not the WSL Codex panel that ran cycle 2 layer B)
- Run: `docs-v4-ia-deepening`
- Branch: `docs/v4-ia-deepening` @ `b9f46222` (off `origin/docs/v3-ia-plan` @ `89ad3cc5`)
- Surface / archetype: **n/a** (docs planning PR; the single ARCHETYPE slice — `packages/auth-better-auth`
  R0 passthrough — rides its own framework PR ordered behind this docs PR per `plan.md`
  §"Build / eval / merge flow" step 5)
- Scope overlays: `SCOPE-docs` + one bounded `ARCHETYPE-1`/`ARCHETYPE-2` overlay for the R0 seam
  slice (NOT authored in this run's commits — IMPL-EVAL-gated Codex slice per `arch-debt.md:935`)
- Inputs verified: `plan.md` (post-fix `b9f46222`), `research.md`, `ia-tree.md`, `seam-coverage.md`,
  `drift.md` (D1 + corrected D2 + RR-1/RR-2), `panel/fold-in.md` (7 panel findings folded),
  `arch-debt.md` R0–R5 entry (line 935), `gates/plan-gate.md`, `evaluator/plan-protocol.md`,
  `evaluator/verdict-definitions.md`.
- Re-checked against live source tree on `origin/docs/v4-ia-deepening` @ `b9f46222`:
  `packages/plugin-sagas-core/deno.json`, `mod.ts`, `src/public/mod.ts`, `src/runtime/mod.ts`,
  `packages/auth-better-auth/src/better-auth.ts`, `packages/fresh/deno.json`, `packages/fresh/src/`.
- Layer-B (WSL Codex panel) verdict reference: `panel/fold-in.md` → `PANEL: CHANGES_REQUIRED` with
  7 findings, all folded into `b9f46222`. The panel independently concurred with OpenHands cycle-1
  on the 3 open IA questions.

---

## Verdict

```
PASS
```

The cycle-1 required fixes are correctly applied; the 7 panel fixes are folded into `b9f46222` and
ground-truth-verified; the corrected `createSagaRuntime` subpath claim is source-verified; the
Plan-Gate checklist is fully satisfied.

---

## Independent spot-checks against the live repo (cycle 2)

1. **`createSagaRuntime` subpath claim (correction verification).**
   - `packages/plugin-sagas-core/src/runtime/mod.ts:75` —
     `export { createSagaRuntime } from './create-saga-runtime.ts';` ✓
   - `packages/plugin-sagas-core/deno.json` — `"exports"` maps `.`→`./mod.ts`,
     `./runtime`→`./src/runtime/mod.ts`. `createSagaRuntime` is reachable ONLY via the
     `@netscript/plugin-sagas-core/runtime` subpath.
   - `packages/plugin-sagas-core/mod.ts` — `export * from './src/public/mod.ts';` — no
     `createSagaRuntime` on root `.`.
   - `packages/plugin-sagas-core/src/public/mod.ts` — grep for `createSagaRuntime` returns
     ZERO matches.
   - The cycle-1 plan-eval note asserting `createSagaRuntime` is re-exported via
     `packages/plugin-sagas-core/src/public/mod.ts` was wrong; `drift.md` D2 (post-fix) and
     `plan.md` W4 line 74 (`createSagaRuntime imported from the @netscript/plugin-sagas-core/runtime
     subpath`) are now consistent with source. **The user-flagged NOTE/CORRECTION is satisfied.**

2. **`@netscript/fresh` Web-Layer 10-page + 1 showcase accounting (panel Fix #2).**
   - `packages/fresh/deno.json` exports map: `.`, `./server`, `./builders`, `./route`, `./defer`,
     `./form`, `./error`, `./streams`, `./query`, `./interactive`, `./vite`, `./testing` — 11
     export subpaths (the 10 export-backed pages map to 10 of these; the 11th is the showcase
     leaf "Examples / sandbox" which is explicitly declared prose-only). `plan.md:15`–`18`
     correctly distinguishes the two categories.

3. **Query leaf naming root `.` cache helpers (panel Fix #3).**
   - `ia-tree.md:23`–`25` names BOTH `./query` AND the root `.` cache helpers
     (`hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList`). `plan.md` W3 line 66–67
     repeats the same triple. Both align with the `@netscript/fresh` root `.` exports.

4. **W5 mechanically-enforceable gates (panel Fix #4).**
   - `plan.md` locked decision 5 lines 34–49 specifies: (i) HTML-comment marker grammar
     `<!-- caveat: <ref> -->`, `<!-- seam: seam-coverage:<row-id> -->`; (ii) checked-in scripts
     `.llm/tools/docs/check-caveat-harvest.ts` and `.llm/tools/docs/check-seam-coverage.ts`
     (scan `docs/site/**/*.md{,x}`, exit non-zero on untracked caveat / unseamed claim); (iii)
     extend xref throw-on-missing to `featureGrid` and `diagram`. **None of these scripts exist
     yet** (verified — `.llm/tools/docs/` is not present) — that is correct: W5 is the workstream
     that SHIPS them. The plan names them by path + behaviour, not as pre-existing.

5. **Track-D repoint-only (panel Fix #5).**
   - `plan.md:28`–`33` (locked decision 4) — DEFAULT is repoint-only; a new Track-D tutorial is
     NOT authored in this run; only a W1 implementation audit could prove a new tutorial is
     required, and that would be its own scoped decision. Consistent with `research.md`'s finding
     that all four existing tutorials are present.

6. **Table-backed better-auth plugins R1 caveat (panel Fix #6).**
   - `seam-coverage.md:36`–`42` now splits: `bearer`/`jwt` are stateless and turnkey via R0;
     `organization`/`twoFactor`/`admin`/`apiKey` are table-backed → runnable only after R1
     schema-gen, until then they type-check but fail at runtime on missing tables → docs MUST
     carry the R1 caveat. `plan.md` locked decision 2 + W4 (lines 68–72) repeat the honesty
     constraint at the page level. `drift.md` RR-2 records the risk.

7. **W0 Mermaid determinism + rollback gate (panel Fix #7).**
   - `plan.md` W0 lines 53–59 — render every `.mmd` into a temp dir, diff against committed
     `.svg` (fail on drift or missing), document local + CI `mmdc` install; rollback rule: if
     `mmdc` cannot run reproducibly in CI, keep the missing-asset gate but defer live rendering
     (commit pre-rendered SVGs) — W0 must never become a hard blocker on all docs builds.

8. **`@netscript/auth-better-auth` seam diagnosis (still true post-fold).**
   - `packages/auth-better-auth/src/better-auth.ts` — `NetscriptBetterAuthOptions` interface
     has no `plugins` field (fields present: prisma, provider, debugLogs?, usePlural?,
     transaction?, appName?, baseURL?, basePath?, secret?, trustedOrigins?, advanced?,
     telemetry?); `BetterAuthInstance` is a structural `{ handler, api.getSession }` interface.
     The `createBetterAuthBackend({ auth })` escape hatch documented in `seam-coverage.md:13`–`22`
     type-checks against the live source today. R0 framework slice (the bounded ARCHETYPE slice
     that rides behind this docs PR) will add a forward-through passthrough. ✓

---

## Plan-Gate checklist walkthrough

| # | Plan-Gate item | Status | Evidence |
|---|----------------|--------|----------|
| 1 | Research present and current (re-baselined against current `main`/branch) | ✓ | `research.md`; re-spot-checks above. |
| 2 | Decisions locked (with rationale + reversibility note) | ✓ | `plan.md` §"Locked decisions" 1–5, each with rationale and ordering notes. |
| 3 | Open-decision sweep — every open question delegated to PLAN gate | ✓ | `plan.md` §"Open IA questions" — panel + PLAN-EVAL rule on all 3; panel independently concurred. |
| 4 | Commit slices — workstreams named with proof + gate per slice | ✓ | W0–W6 (7 slices, ≤ 30 commit budget) each name proof + gate. |
| 5 | Risk register — open hazards with mitigation + owner | ✓ | `drift.md` RR-1 (docs-vs-R0 ordering), RR-2 (R0 without R1) — concrete mitigations, owners. |
| 6 | Gate set selected — surface + overlays correct | ✓ | SCOPE-docs + bounded ARCHETYPE-1/2 overlay for R0 slice (own framework PR, ordered behind docs). |
| 7 | Deferred scope explicit (never silently dropped) | ✓ | `plan.md` §"Out of scope" — R1–R5, P3-*/P4-*, PR #63, #6, #35, #36, #44, #67; `reference/**` untouched. |
| 8 | jsr-audit (package/plugin waves) | ✓ | Single ARCHETYPE slice; small, type-bounded passthrough; no slow-type risk. |

---

## Open IA questions — PLAN-EVAL rulings (concurring with cycle 1 + panel)

1. **Background Processing vs Durable Workflows** — SPLIT (pillars 3 and 4). Distinct pillars.
   Rationale: cognitive load (two capability surfaces, two ownership groups), and durable-workflow
   primitives (sagas / triggers / streams) are not just "background work" — they are durability
   primitives with different persistence/runtime semantics from ephemeral queues.
2. **Reference layout** — pillar-local Reference leaves + thin global index. Rationale: avoids
   the parallel-sidebar failure mode documented in `research.md` (Medusa) and keeps the
   capability hub coherent; the global index is a fan-out index, not a parallel catalog.
3. **Fresh "Examples / sandbox"** — prose now, StackBlitz/sandbox = backlog. Rationale: avoids
   inventing a non-existent symbol/exports; preserves the option to ship live sandbox later.

---

## What this PR may NOT do

- No code changes to `packages/**`/`plugins/**` may land on this docs PR (the bounded ARCHETYPE
  slice rides its own framework PR per `plan.md` step 5; ordering hazard tracked as RR-1).
- `docs/site` is worktree-orphan in this planning run; no authoring until PASS. (Build branch
  opens AFTER this verdict.)
- `deno.lock` / source churn must not be introduced by a PLAN-EVAL run.

---

## PR-comment body (for the workflow to post on PR #107)

````markdown
## OpenHands PLAN-EVAL — docs-v4-ia-deepening (cycle 2, FINAL)

**Verdict:** `PASS` (cycle 2 of 2 — layered PLAN gate's binding Layer-A pass; per
`evaluator/plan-protocol.md` §"Loop limit" this is the FINAL cycle).

**Evaluator:** OpenHands minimax-M3, separate session (not the Claude author / not the
WSL Codex implementer / not the WSL Codex panel that ran cycle 2 Layer-B). Run-id:
`docs-v4-ia-deepening`. Branch: `docs/v4-ia-deepening` @ `b9f46222`.

**Full verdict:** `.llm/tmp/run/docs-v4-ia-deepening/plan-eval.md`

### What was verified

- All 3 cycle-1 required fixes are correctly applied in `b9f46222`:
  1. `createSagaRuntime` subpath correction — `drift.md` D2 (post-fix) + `plan.md` W4 line 74
     cite the symbol as reachable ONLY via `@netscript/plugin-sagas-core/runtime`. The
     cycle-1 plan-eval's note about `src/public/mod.ts` re-export is confirmed WRONG against
     source: `packages/plugin-sagas-core/src/public/mod.ts` has zero references to
     `createSagaRuntime`; the only export site is `packages/plugin-sagas-core/src/runtime/mod.ts:75`,
     reachable via `packages/plugin-sagas-core/deno.json` map `./runtime`→`./src/runtime/mod.ts`.
  2. RR-1 (docs-vs-R0 ordering) + RR-2 (R0 ships without R1) — `drift.md:83`–`84` with concrete
     mitigations + owners.
  3. W4 R1 schema-gen caveat at the PAGE level (not buried in tutorial) — `plan.md:71`–`72`
     and `seam-coverage.md:36`–`42`.

- All 7 WSL Codex panel (Layer B) findings are folded in `b9f46222`:
  1. Saga subpath citation (same as cycle-1 fix 1) ✓
  2. "10 export-backed + 1 examples leaf" page accounting — `plan.md:15`–`18` + `ia-tree.md` ✓
  3. Query leaf names root `.` cache helpers — `ia-tree.md:23`–`25` + `plan.md` W3 ✓
  4. W5 process gates are mechanically enforceable — marker grammar + checked-in scripts
     `.llm/tools/docs/check-caveat-harvest.ts` + `check-seam-coverage.ts` + extend xref
     throw-on-missing to `featureGrid`/`diagram` ✓
  5. Track-D repoint-only — `plan.md:28`–`33` ✓
  6. Table-backed better-auth plugins carry the R1 caveat; only `bearer`/`jwt` are turnkey via R0
     — `seam-coverage.md:36`–`42` + RR-2 ✓
  7. W0 Mermaid determinism + rollback gate — `plan.md:53`–`59` ✓

- The 3 open IA questions are ruled (panel concurred): Background Processing vs Durable
  Workflows = SPLIT; Reference = pillar-local + thin global index; Fresh Examples = prose now.

### What this PR may NOT do

- No code changes to `packages/**`/`plugins/**` on this docs PR — the bounded ARCHETYPE slice
  (R0 passthrough on `createNetscriptBetterAuth`) rides its own framework PR, ordered behind
  docs per `plan.md` step 5. Risk RR-1 in `drift.md` is the explicit tracker; IMPL-EVAL
  verifies the (a)-hold-merge or (b)-explicit-"shipping in `<ref>`" mitigation before docs go live.
- `docs/site` stays worktree-orphan until the build branch opens after this verdict.
- `deno.lock` and source churn must not be introduced by a PLAN-EVAL run.
````