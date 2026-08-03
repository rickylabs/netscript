# Drift Log: Canary label surface (#1121)

Drift is append-only.

## 2026-08-03 — Observed trace lives outside the requested checkout

- **What:** The brief's trace path does not exist in this worktree or `origin/main` at the pinned
  baseline; the artifact exists at the same repo-relative path in sibling checkout `ns-004`.
- **Source:** direct filesystem and `git ls-tree` checks.
- **Expected:** `.llm/runs/release-0.0.4--orchestration/cut-trace.md` in this checkout.
- **Actual:** `/home/codex/repos/ns-004/.llm/runs/release-0.0.4--orchestration/cut-trace.md`.
- **Severity:** minor.
- **Action:** accept for research; do not copy the foreign run artifact into this slice.
- **Evidence:** research re-baseline and quoted commit/PR mapping.

## 2026-08-03 — Interactive supervisor entry route

- **What:** The user opened this run in the Codex API surface rather than the lane-policy default
  Fable supervisor.
- **Source:** system session identity and user request.
- **Expected:** canonical `planning_decisions` supervisor route.
- **Actual:** Codex root session supervises; implementation/review/formal evaluation retain their
  canonical separate routes.
- **Severity:** minor.
- **Action:** accept as an entry-surface override; preserve all separation invariants.
- **Evidence:** `supervisor.md` route table.
