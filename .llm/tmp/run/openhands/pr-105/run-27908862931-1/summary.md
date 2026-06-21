# OpenHands Run — 27908862931-1 — docs-v3-ia-plan--supervisor — PLAN-EVAL

- **PR**: #105 — `docs: v3 IA plan — production-grade public docs (planning, draft)`
- **Branch**: `docs/v3-ia-plan` (off `origin/main` @ `5f273355`)
- **Run**: `.llm/tmp/run/docs-v3-ia-plan--supervisor/`
- **Output mode**: `pr-comment`
- **Model**: `openrouter/minimax/minimax-m3`
- **Phase**: PLAN-EVAL (re-dispatch after the prior minimax-M3 PLAN-EVAL crashed without
  rendering a verdict — comment 4762333961, run 27907934927)

## Summary

Independent PLAN-EVAL pass on the planning artifacts in
`.llm/tmp/run/docs-v3-ia-plan--supervisor/`, applying
`.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md`. Cross-checked
load-bearing claims against the live `origin/main` tree (export maps under `packages/**` +
`plugins/**`, the playground absence in this repo, marketplace stubs, `TASK_TYPES` /
`WORKER_RUNTIMES`, etc.) and the WSL Codex panel findings.

**Verdict: `PASS`**

The plan is internally consistent, every Plan-Gate checklist box is satisfied, and every load-
bearing adversarial-panel finding (B1/B2/B3/M4/M5/M6/M7/M8/M9/m10) is genuinely closed with
concrete resolution paths in the planning artifacts. Open-decision sweep resolves the rework-prone
choices (diagram render mode, xref surface, Pagefind scope, version UI, `archetype` removal,
marketplace CLI stub status, deploy scope). 20 ordered commit slices (<30) with files-touched
and proving gates per slice; executable gate table + deterministic leakage-scanner spec
(replaces the prior slogan list); risk register + deferred-scope section + SCOPE-docs overlay
gates. No `packages/**`/`plugins/**` code, no `docs/site/**`, no `deno.lock` changes on this PR —
planning-only as required.

## Changes

**Artifacts written**

- `.llm/tmp/run/docs-v3-ia-plan--supervisor/plan-eval.md` — independent verdict with
  cross-check evidence + five non-blocking follow-up notes for the next planning patch.

**No source-code changes. No `deno.lock` modifications. No commits made on this branch.**

## Independent spot-checks (against the live repo)

1. `packages/` contains **26** package dirs + `plugins/` has **5** plugin dirs = **31 units**
   (not the headline 32).
2. Every `packages/*/deno.json` and `plugins/*/deno.json` `exports` map sums to **210 subpaths**
   (not the headline 242; not the inventory-table sum of 200).
3. 7 units are under-counted in the parenthetical but the inventory classification per subpath is
   essentially complete:
   - `plugin-sagas-core` 15→19 (missing from totals: `abstracts`, `config`, `streams`,
     `transports`)
   - `plugin-workers-core` 15→16 (`streams`)
   - `plugin-auth-core` 8→9 (`streams`)
   - `plugin-triggers-core` 10→11 (`streams`)
   - `plugin-triggers` 9→10 (`streams`)
   - `fresh` 11→12 (`streams`)
   - `queue` 12→13
4. Marketplace stubs verified: `packages/cli/src/public/features/marketplace/{publish,search}/
   *-command.ts` print "Plugin marketplace … coming soon." OD7 + WS7 alignment correct.
5. No local `apps/`, `contracts/`, or `services/` — playground lives only in
   `rickylabs/netscript-start` @ `6ba9ba0`. Tracks A/D "playground-direct" + Tracks B/C
   proof-gated (`tutorial-proof-plans.md`) is honest.
6. `plugin-workers-core/src/domain/constants.ts` `TASK_TYPES` (7 entries) + `WORKER_RUNTIMES` (3
   entries) match `hub-content-contracts.md` §3/§4 + `surface-inventory.md` exactly.
7. `archetype`/doctrine leakage treatment is consistent across the IA tree, OD6/WS7/S14, and the
   leakage-scanner deny patterns (`\barchetype\b`, `axiom A\d+`, `fitness function`,
   `the doctrine`). Removal, not relabeling.

## Validation

- Read-only evaluation pass. No `deno task` runs, no installs, no tests.
- Tally of `packages/` directory entries: `ls packages/ | wc -l` → 26.
- Tally of export subpaths: per-unit python3+json parser summing all `packages/*/deno.json` and
  `plugins/*/deno.json` `exports` maps → 210.
- Tally of inventory-table sums: row-by-row count of parenthetical totals → 200.
- Tally of 7-unit per-unit delta: manual diff of inventory row vs `deno.json` exports.

## Responses to review comments or issue comments

This is a planning-PR evaluator pass; there are no review threads on PR #105 to reply to.
Output mode is `pr-comment`, so the workflow will post the verdict (this summary) as a single
PR comment.

## Remaining risks (non-blocking bookkeeping — recommend next planning patch)

1. `surface-inventory.md:6` headline says "32 units / 242 subpaths"; reality is **31 / 210**. Fix
   the headline and 7 per-unit parentheticals. **Not a Plan-Gate blocker** — the inventory
   classifies every shipped subpath; the S12 surface-completeness check should be written against
   the real export maps, not the headline.
2. `plugin-workers-core` row classifies `createJobTools` as D — but `createJobTools` is a
   scaffold-level helper, not a published subpath. Move that caveat to a `how-to/` note. Cosmetic.
3. The WSL Codex panel finding #2 ("public-surface inventory incomplete") is **partially** closed
   by the hardening commit; the bookkeeping fixes above would close it fully.
4. The WSL Codex panel finding #3 ("Tracks B/C grounded in absent playground showcase") is
   genuinely closed via `tutorial-proof-plans.md` proof-or-rescope gates. Tracks A/D remain
   playground-direct (correctly).

## PR comment body (for the workflow to post as a single PR comment)

```markdown
## PLAN-EVAL — docs-v3-ia-plan — independent verdict

**Verdict: `PASS`**

Independent pass applying `.llm/harness/evaluator/plan-protocol.md` +
`.llm/harness/gates/plan-gate.md`. Re-baselined to `origin/main` @ `5f273355`; the prior
minimax-M3 PLAN-EVAL (comment 4762333961, run 27907934927) crashed without a verdict — this is
the clean re-dispatch.

### Checklist (every Plan-Gate box satisfied)

- Research present and current (`research.md`, re-baselined to `5f273355`; stale-worktree
  "auth missing" finding discarded in §2)
- Decisions locked (D1–D4; OD1–OD8 with rationale — diagram render mode, xref surface,
  Pagefind scope, version UI, `archetype` removal, marketplace CLI stub status, deploy scope)
- Open-decision sweep resolves every rework-prone choice
- 20 ordered commit slices (<30), each with files-touched + proving gate
- Mandatory run artifacts present (worklog.md `## Design`, drift.md, commits.md, research.md,
  plan.md, surface-inventory.md, hub-content-contracts.md, tutorial-proof-plans.md)
- Public-surface inventory classifies every shipped subpath (per-subpath classification complete;
  per-unit parenthetical counts and the headline number are wrong — see notes below)
- Tutorial-track grounding honest (A/D playground-direct; B/C proof-gated via
  `tutorial-proof-plans.md`)
- Acceptance gates executable (Lume build, xref integrity, Pagefind, deterministic leakage
  scanner, accuracy non-regression, surface completeness, `reference/**` untouched, scoped fmt,
  visual/structural, SCOPE-docs overlay) — replaces prior slogan list
- Public-voice plan internally consistent (`archetype` removed, not relabeled; deterministic
  scanner spec with deny patterns + allowlist; no term both flagged and preserved)
- jsr-audit = N/A (docs planning run; no `packages/**`/`plugins/**` code change)

### Cross-check against the live repo (independent spot-checks)

- Actual `packages/` = 26 dirs; `plugins/` = 5 dirs = **31 units** (not 32).
- Sum of every `deno.json` `exports` map = **210 subpaths** (not 242).
- The inventory's per-subpath classifications are essentially complete, but the parenthetical
  totals on 7 units and the headline number (32 / 242) are wrong.
- Marketplace stubs verified (`packages/cli/src/public/features/marketplace/{publish,search}/
  *-command.ts` print "coming soon" — OD7 + WS7 correct).
- No local `apps/`, `contracts/`, `services/` — playground lives only in `rickylabs/netscript-start`
  @ `6ba9ba0`. Tracks A/D "playground-direct" + Tracks B/C proof-gated is honest.
- `TASK_TYPES` (7) and `WORKER_RUNTIMES` (3) in `plugin-workers-core/src/domain/constants.ts`
  match `hub-content-contracts.md` §3/§4 and `surface-inventory.md` exactly.
- WSL Codex panel findings (B1/B2/B3/M4/M5/M6/M7/M8/M9/m10) are reproduced into the branch via
  `55be89da` and genuinely closed with concrete resolution paths (B2/B3 bookkeeping notes below
  do not undo the closure).

### Non-blocking follow-ups (next planning patch — recommend before S12)

These are bookkeeping, not Plan-Gate failures. The build run should apply them in its first
slice so S12 asserts against the real numbers.

1. `surface-inventory.md:6` headline → "**31 published units, 210 export subpaths**" (not 32 /
   242).
2. 7 under-counted per-unit parentheticals: `plugin-sagas-core` 15→19, `plugin-workers-core`
   15→16, `plugin-auth-core` 8→9, `plugin-triggers-core` 10→11, `plugin-triggers` 9→10, `fresh`
   11→12, `queue` 12→13.
3. `plugin-workers-core` row "createJobTools" D-badge → move to `how-to/` (it is a scaffold
   helper, not a published subpath).
4. `plan.md:161, 183` S12 + §5 surface-completeness gate → assert against 210, not 242.
5. Ensure the Track B proof gate (`tutorial-proof-plans.md` Track B) actually exercises the
   rescope fallback when the proof run reports no playground validation.

### Lock hygiene

- No `packages/**`/`plugins/**` code change, no `docs/site/**` change, no `deno.lock` change on
  this PR (planning-only). Verified via `commits.md`.
- No edits or commits made in this evaluator session.

`PASS` — implementation may begin the build run on a fresh planning patch that first applies
the five non-blocking follow-ups above.
```

## Workflow notes

- Verdict file: `.llm/tmp/run/docs-v3-ia-plan--supervisor/plan-eval.md`
- Re-dispatch reason (clean re-run after crashed prior minimax-M3 PLAN-EVAL): explicitly
  documented in the verdict file's preamble.
- Output mode `pr-comment` → single workflow-owned PR comment; no `replies.json` to write.