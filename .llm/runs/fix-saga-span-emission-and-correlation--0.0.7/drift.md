# Drift Log: Emit and correlate saga cascade spans

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — Remote-tracking main advanced after leaf baseline

- **What:** The worktree `HEAD` remains at the owner-locked `f8b4f804`, while the freshly observed
  local `origin/main` remote-tracking ref is `952cc106`.
- **Source:** Raw `git rev-parse HEAD` and `git rev-parse origin/main` during S1.
- **Expected:** Owner briefing identifies head/base as `origin/main @ f8b4f804`.
- **Actual:** The branch is correctly at `f8b4f804`; only the moving tracking ref advanced.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` records the immutable baseline. No rebase or product edit was made;
  changing the baseline is coordinator-controlled.

## 2026-08-30 — Owner-assigned implementation author owns S1

- **What:** The current Codex implementation-author session performed S1 research and plan.
- **Source:** Owner briefing: “You are the implementation author” and “S1 — research and a locked
  plan.”
- **Expected:** Generic lane policy routes deep analysis to its default research model.
- **Actual:** The explicit owner assignment takes precedence for this leaf; formal PLAN-EVAL remains
  a separate opposite-family session.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and override.

## 2026-08-30 — RTK executable unavailable

- **What:** The repo-preferred token-saving proxy is not installed in this environment.
- **Source:** `rtk --version` returned `rtk: command not found` during S1.
- **Expected:** Read-heavy git/rg commands are prefixed with RTK when available.
- **Actual:** Focused raw `rg`/git reads and structured repository wrappers are used instead.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Gate table names raw commands and structured wrappers as verdict sources.

## 2026-08-30 — Supervisor review corrected derivative and runtime gate ownership

- **What:** The initial S1 plan omitted `check:mcp-export-corpus` and listed the leased
  `scaffold.runtime` command in the author validation table despite the leaf's no-runtime boundary.
- **Source:** Supervisor plan review at `d1436696` and direct inspection of
  `.llm/tools/docs/generate-export-surface-corpus.ts` plus root task definitions.
- **Expected:** All four shared derivative writers are represented with non-mutating checks, and
  cluster-wide runtime gates are assigned only to a lease-holding supervisor.
- **Actual:** The first plan carried only three derivative gates and described the runtime command
  as later work without an explicit author-must-not-run owner.
- **Severity:** significant
- **Action:** fix
- **Evidence:** The corrected plan adds measured baseline/expected-stale MCP corpus evidence and
  marks Flow-B runtime proof `REQUIRED, supervisor-coordinated, author-must-not-run`.
