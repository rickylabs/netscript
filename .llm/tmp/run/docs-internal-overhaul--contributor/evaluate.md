# Evaluation: docs/internal-overhaul (Group 4 — internal/contributor docs)

Run ID: `docs-internal-overhaul--contributor`
Evaluator: IMPL-EVAL (OpenHands, Qwen 3.7 max, separate session from generator)
Branch tip: `7a8b1c38`
Date: 2026-06-18

## Overall Verdict

**PASS**

## Rationale Summary

All 7 authoring slices (S1-S7) satisfy their proving gates, commit-slice contracts, and locked
decisions (IO-1…IO-6). No off-limits boundary crossed (no `packages/`/`plugins/` source; no doctrine
*decision* text changed — S4 is link/reference only; no hand-edited `.claude/skills/` mirror; no doc
files deleted). All gates independently re-verified. The single known issue (26 pre-existing
`impeccable`-skill dead links blocking `docs:maintenance`) is properly recorded as arch-debt
`impeccable-dead-reference-links` with all required fields, and the resolution is (c) accept as
recorded debt — see Open Question Ruling below.

### Minor Finding (non-blocking)

The worklog records a "worktree-pin reconciliation" incident where the Claude workflow subagents
initially wrote 5/7 slices into the wrong worktree, requiring supervisor patching. The incident is
documented in the worklog but **not recorded in `drift.md`** (which remains empty: "none yet").
While the supervisor successfully reconciled and the branch is correct, this drift event should be
logged in the drift file per protocol § 5 ("Drift is explicit: if implementation reality diverges
from plan, docs, or doctrine, record it in the harness run drift/worklog artifacts"). The worklog
entry is evidence, but `drift.md` is the canonical drift log. This is a **bookkeeping gap**, not an
implementation defect — all slices are on the correct branch and gates pass. No FAIL warranted;
flagged for process hygiene.

---

## Per-Slice Verdict Table

| Slice | Commit | Verdict | Gate(s) | Contract | Locked Decisions | Boundary | Evidence |
|-------|--------|---------|---------|----------|------------------|----------|----------|
| S0 | — | PASS | bootstrap | re-baseline sanity | N/A | N/A | Branch `docs/internal-overhaul` @ `7a8b1c38`; run artifacts present in `.llm/tmp/run/docs-internal-overhaul--contributor/` |
| S1 | `17f658ed` | PASS | G-surface, G-mirror, G-links | `deno doc` section in `jsr-audit` skill | IO-3 | OK | `.agents/skills/jsr-audit/SKILL.md` +89 LOC (npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, `deno doc --lint` as publish bar); `.claude/skills/jsr-audit/SKILL.md` regenerated (mirror IDENTICAL); no doctrine/packages/plugins edits |
| S2 | `ade81736` | PASS | G-links | `deno doc` section in harness docs | IO-3 | OK | `.llm/harness/tools-and-commands.md` +42 LOC (new file: deno-doc-first index); `.llm/harness/workflow/run-loop.md` +4 LOC (pointer added); no doctrine/packages/plugins edits |
| S3 | `95b14136` | PASS | G-links, G-doctrine | canonical-home de-dup (AGENTS ↔ harness ↔ skills) | IO-1, IO-6 | OK | `AGENTS.md` +21/-7 LOC (concept→home map applied); `.agents/skills/netscript-harness/SKILL.md` +11/-6 LOC (link-only: canonical-home rubric); `.claude/skills/netscript-harness/SKILL.md` regenerated (mirror IDENTICAL); no doctrine/packages/plugins edits |
| S4 | `b7baca34` | PASS | G-doctrine | doctrine reference tidy (dead-link de-link only) | IO-4 | OK | `.llm/harness/README.md` +5/-1 LOC (link tidy); `docs/architecture/doctrine/01-thesis-and-axioms.md` +12/-12 LOC (removed dead `phase-0-research/*.md` links, converted to plain text references — no decision text changed); `docs/architecture/doctrine/04-modules-and-helpers.md` +16/-16 LOC (same: dead-link removal only, all doctrine decisions preserved); no packages/plugins edits |
| S5 | `8073bb57` | PASS | G-links, G-doctrine | `.llm/` tooling/agentic architecture doc | N/A | OK | `.llm/tools/README.md` +101/-6 LOC (single navigable home for `.llm/tools/{deps,fitness,agentic}/` + watch/handoff utilities); no doctrine/packages/plugins edits |
| S6 | `ad6d559f` | PASS | G-links | root-ops + agent-surface coherence | N/A | OK | `README.md` +13 LOC (cross-refs added); `CONTRIBUTING.md` +16/-5 LOC (link-only: agent-surface coherence); no doctrine/packages/plugins edits |
| S7 | `42da427b` | PASS | gate wired | doc-maintenance gate E1 wired | N/A | OK | `.llm/tools/check-internal-doc-links.ts` +352 LOC (new script: internal link/anchor/orphan check); `deno.json` +2 LOC (added `docs:links` + `docs:maintenance` tasks); `.llm/harness/gates/static-gates.md` +22/-1 LOC (gate documented); gate exists in `deno.json`/harness; no packages/plugins edits |
| — | `6ae41fc3` | PASS | bookkeeping | worklog + arch-debt + commits.md | N/A | N/A | Bookkeeping commit (2 files: worklog.md + arch-debt.md) |
| — | `7a8b1c38` | PASS | bookkeeping | commits.md append | N/A | N/A | Bookkeeping commit (1 file: commits.md) |

---

## Gate Re-verification (raw command output)

| Gate | Command | Exit Code | Result |
|------|---------|-----------|--------|
| G-mirror | `deno task agentic:sync-claude:check` | 0 | `agentic:sync-claude OK: 17 skill(s), 17 mirrored file(s)` |
| G-surface | `deno task agentic:check-claude` | 0 | `OK CLAUDE.md: contains @AGENTS.md` · `OK .claude/settings.json: valid JSON` · `OK .gitignore: ignores .claude/settings.local.json` · `OK .claude/skills: agentic:sync-claude OK` · `OK claude hook lock check: deno.lock unchanged after 3 hook runs` |
| G-links | `deno task docs:links` | 1 | 99 docs, 26 broken links, 0 broken anchors, 0 orphans. **ALL 26 broken links are in `.agents/skills/impeccable/SKILL.md`** pointing at `impeccable/reference/*.md` files that do not exist. Group-4-owned surface (harness/doctrine/`.llm`/`AGENTS`/`CLAUDE`/root-ops) is link-clean. Doctrine `phase-0-research` links fixed by S4 (converted to plain text). |
| G-doctrine | manual diff review | N/A | S4 diff shows only dead-link removal in doctrine files; all doctrine decisions (thesis, axioms, helper rules, port/adapter patterns) preserved verbatim. No decision text changed. |
| G-mirror (manual) | `diff .agents/skills/jsr-audit/SKILL.md .claude/skills/jsr-audit/SKILL.md` | 0 | IDENTICAL (mirror regenerated, not hand-edited) |
| G-mirror (manual) | `diff .agents/skills/netscript-harness/SKILL.md .claude/skills/netscript-harness/SKILL.md` | 0 | IDENTICAL (mirror regenerated, not hand-edited) |
| boundary | `git diff 17f658ed~1..7a8b1c38 --name-only | grep -E "^packages/|^plugins/"` | 0 | empty (no `packages/` or `plugins/` source edited) |
| boundary | `git log --diff-filter=D --name-only 17f658ed~1..7a8b1c38` | 0 | empty (no doc files deleted) |

---

## Locked Decisions Compliance

| ID | Decision | Status | Evidence |
|----|----------|--------|----------|
| IO-1 | One authoritative home per concept; others link to it | OK | S3 applied canonical-home rubric to AGENTS.md + harness skill; cross-links added; no duplication introduced |
| IO-2 | `.claude/skills/` regenerated from `.agents/skills/`; never hand-edited | OK | Mirrors regenerated (jsr-audit, netscript-harness); `git show` confirms both commits include mirror + source; diff clean; `agentic:sync-claude:check` PASS |
| IO-3 | `deno doc` documented as canonical internal-API surface tool | OK | S1 added `deno doc` section to jsr-audit skill (npm-dep rendering, JSX/TSX, `--lint`); S2 added tools-and-commands index to harness; AGENTS.md already references `deno doc` |
| IO-4 | Consolidation rewrites content; file deletion is Group 1's job | OK | No doc files deleted (git log --diff-filter=D empty); S4 de-linked dead references (content rewrite, not deletion) |
| IO-5 | No Diátaxis for internal docs; keep functional/role-based structure | OK | All slices maintain functional/role-based IA (harness mechanics · doctrine · skills · agent surface · root ops); no Diátaxis quadrant imposed |
| IO-6 | Canonical-home rubric applied | OK | S3 applied rubric (architecture decisions→doctrine; cross-agent rules→AGENTS.md; domain procedure→skills; Claude startup→CLAUDE.md; run/orchestration→harness); AGENTS.md updated with explicit concept→home map |

---

## Off-Limits Boundary Compliance

| Boundary | Status | Evidence |
|----------|--------|----------|
| No `packages/` source edits | OK | `git diff` empty |
| No `plugins/` source edits | OK | `git diff` empty |
| No doctrine *decision* text changed | OK | S4 diff: only dead-link removal; all thesis/axioms/helper rules/port-adapter patterns preserved |
| No hand-edited `.claude/skills/` mirror | OK | Mirrors regenerated from `.agents/skills/`; diff clean |
| No doc files deleted | OK | `git log --diff-filter=D` empty |
| No `deno.lock` or source churn committed | OK | Bookkeeping commits only: worklog.md, arch-debt.md, commits.md |

---

## Open Question Ruling

**Question:** `deno task docs:maintenance` (the S7 composite) is currently RED solely because of the
26 pre-existing `impeccable`-skill dead links — recorded as arch-debt
`impeccable-dead-reference-links`, outside Group 4's file scope. Rule on the resolution: (a) scope
`check-internal-doc-links.ts` to exclude the incomplete vendored `impeccable` skill (supervisor's
recommendation), (b) fix/prune `impeccable` in a follow-up slice, or (c) accept as recorded debt and
gate only Group-4-owned surfaces. State which, and whether it blocks PASS.

**Ruling:** (c) accept as recorded debt and gate only Group-4-owned surfaces. This does **not**
block PASS.

**Rationale:**

1. The arch-debt entry `impeccable-dead-reference-links` is properly formed with all required
   fields (reason, impact, owner, resolution options, created date, status, gate). It accurately
   describes the scope (26 pre-existing broken links), the root cause (incomplete vendored
   authoring skill with missing `reference/*.md` files), and the impact (gate redness is
   pre-existing/out-of-scope).

2. The gate itself is **wired correctly** — it detects real link rot. The redness is not a wiring
   defect; it's surfacing legitimate debt that exists in the repo but is outside Group 4's file
   scope (Group 4 governs harness/doctrine/`.llm`/`AGENTS`/`CLAUDE`/root-ops; `impeccable` is a
   vendored general-purpose authoring skill).

3. The debt is recorded and visible. Option (a) would weaken the gate (exclude a real skill to
   make it green), which is the wrong direction — the gate should surface rot, not hide it. Option
   (b) would add scope to Group 4 (fixing a vendored skill) that the plan explicitly excludes
   ("impeccable skill is outside Group 4's file scope" per worklog + arch-debt). Option (c) is the
   correct resolution: the debt is acknowledged, the gate is honest, and a separate follow-up owned
   by the `impeccable` skill maintainers can close the entry when they complete or prune the
   `reference/*.md` subtree.

4. Group 4's scope is complete: all 7 authoring slices satisfy their contracts, all Group-4-owned
   surfaces are link-clean (doctrine `phase-0-research` links fixed by S4), and the gate is wired.
   The `impeccable` debt does not invalidate Group 4's work; it's a separate surface that the new
   gate has surfaced for the first time.

**Status:** Recorded as arch-debt, not blocking. The gate remains RED until `impeccable` maintainers
complete/prune the `reference/*.md` subtree, which is a follow-up slice outside Group 4's scope.

---

## Concept of Done (per slice)

| Slice | Concept of Done | Status |
|-------|-----------------|--------|
| S1 | `deno doc` section exists in jsr-audit skill; covers npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, `deno doc --lint` as publish bar; mirror regenerated; links valid | DONE |
| S2 | `deno doc` section exists in harness docs; tells contributors to reach for `deno doc <module>` / `deno doc --filter <symbol>` / `deno why` before broad reads; pointer from run-loop.md | DONE |
| S3 | Canonical-home duplication map applied; each duplicated rule has exactly one home + cross-links; IO-6 rubric applied; links valid; doctrine spot-check clean | DONE |
| S4 | Doctrine reference tidy-up complete; dead links removed; doctrine decisions unchanged; IO-4 boundary honored | DONE |
| S5 | `.llm/` tooling/agentic architecture doc exists; one navigable home for `.llm/tools/{deps,fitness,agentic}/` + watch/handoff utilities; links valid | DONE |
| S6 | Root-ops + agent-surface coherence complete; root `*.md`, `AGENTS.md`, `CLAUDE.md` cross-refs coherent; no orphans | DONE |
| S7 | Doc-maintenance gate E1 wired; internal link/anchor/orphan check exists in `deno.json`/harness gates; gate detects rot (currently surfacing pre-existing `impeccable` debt) | DONE (gate wired; redness is recorded debt) |
| S8 | Final gate sweep | N/A (gate-only slice; gates re-verified above) |

---

## Process Notes

1. **Worktree-pin reconciliation incident:** The worklog documents that the Claude workflow
   subagents inherited the parent session's worktree pin (`release+jsr-readiness`) and 5/7 slices
   initially wrote into the wrong worktree. The supervisor detected this, patched the 4 leaked
   files onto `docs/internal-overhaul` (base byte-identical; `git apply --check` clean), and
   reverted them in the umbrella checkout. The reconciliation was successful, and the branch is
   correct. However, this drift event is recorded in the worklog but **not in `drift.md`** (which
   remains empty: "none yet"). Per evaluator protocol § 5, drift should be explicit in the drift
   log. This is a **minor bookkeeping gap**, not an implementation defect. No FAIL warranted.

2. **PLAN-EVAL cycle 1 FAIL_PLAN → cycle 2 PASS:** The plan initially lacked the `## Commit Slices`
   enumeration (required per `run-loop.md §3b` item 5). Cycle-1 remediation added S0-S8 with
   what-it-proves + gate + files per the evaluator's illustrative shape. No locked decision, scope,
   gate, or risk-register row was changed. Cycle-2 PLAN-EVAL passed (worklog confirms). No process
   failure.

3. **LD-DOCS-LANE compliance:** Authoring slices S1-S6 produced by the Claude dynamic workflow (Opus;
   S3 high, rest medium) under the harness SKILL (`netscript-harness` + `jsr-audit`/`netscript-doctrine`);
   OpenHands validates per-domain (Qwen 3.7 max, separate session — this evaluation). Gate slices
   S0/S7/S8 are mechanical/validator. Separation of generator and evaluator maintained.

---

## Recommendations

1. **Update `drift.md`** to record the worktree-pin reconciliation incident (minor severity). The
   worklog entry is evidence, but `drift.md` is the canonical drift log per protocol.

2. **Coordinate with `impeccable` skill maintainers** to complete or prune the `reference/*.md`
   subtree. The arch-debt entry is surfaced and visible; the gate will stay RED until the debt is
   closed. This is a follow-up slice outside Group 4's scope.

3. **Consider scoping `check-internal-doc-links.ts`** to exclude vendored/incomplete skills (like
   `impeccable`) if the gate is intended to surface only Group-4-owned surface rot. However, this
   is a design decision for the gate owner, not a Group 4 deliverable.

---

## Verdict

**PASS**

All authoring slices (S1-S7) satisfy their proving gates, commit-slice contracts, and locked
decisions (IO-1…IO-6). No off-limits boundary crossed. All gates independently re-verified. The
single known issue (26 pre-existing `impeccable`-skill dead links) is properly recorded as
arch-debt with all required fields, and the resolution is (c) accept as recorded debt — does not
block PASS. Minor bookkeeping gap (drift.md not updated for worktree-pin reconciliation incident)
flagged but not blocking.

Group 4 scope complete. Ready to merge pending `impeccable` debt closure (separate follow-up).
