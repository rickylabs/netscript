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

## 2026-08-03 — Formal evaluator credential unavailable

- **What:** The canonical local PLAN-EVAL route resolved correctly but could not launch because the
  isolated child environment has no OpenRouter credential.
- **Source:** `planClaudeCommand` route validation, `ChildProcessEnvironmentAdapter`, and a bounded
  `agentic:provider-canary --live` probe.
- **Expected:** Claude Code + OpenRouter, bound open-model Qwen evaluator, high effort.
- **Actual:** route diagnostics were empty, then child injection returned `auth_required`;
  `OPENROUTER_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, and `ANTHROPIC_API_KEY` are all absent, and the
  provider canary reported `credential: absent` without starting a model turn.
- **Severity:** significant.
- **Action:** block before implementation and request the owner's smallest authorized recovery:
  make the local OpenRouter credential available, authorize an open-model cloud evaluator fallback,
  or explicitly waive PLAN-EVAL.
- **Evidence:** launch at `2026-08-03T15:29:29+02:00`; no `plan-eval.md` was written and no source
  implementation file was changed.

## 2026-08-03 — Owner waives Plan-Gate after #1087 safety finding

- **What:** The owner explicitly waived PLAN-EVAL and directed immediate implementation, acting as
  the opposite-family reviewer of Codex-authored work.
- **Source:** owner instruction in the Codex session, 2026-08-03; #1087 precedent.
- **Expected:** bound local open-model Qwen formal evaluator before implementation.
- **Actual:** the lane remains credential-blocked by design because #1087 observed an evaluator
  autonomously spawning prohibited closed-model helpers; the route guard constrains only the
  launched route, not helpers the model launches. Re-enabling it would make paid-model leakage
  reachable again.
- **Severity:** significant process override; no product-scope change.
- **Action:** accept the explicit written Plan-Gate waiver. Preserve generator/reviewer separation
  through opposite-family slice review and final implementation review; do not describe the
  blocked evaluator as having passed.
- **Evidence:** this drift entry, the owner message, and the PR #1122 phase trail. Same stated waiver
  precedent: PRs #1075, #1088, and #1091.
