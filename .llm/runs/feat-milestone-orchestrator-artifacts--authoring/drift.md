# Drift Log — feat-milestone-orchestrator-artifacts--authoring

Append-only.

- 2026-08-03 · **lane override (recorded, not drift-severity)** — implementation lane is Claude
  (this session) under the CLAUDE.md documentation-authoring exception: the diff touches only
  `.agents/skills/`, the generated `.claude/skills/` mirror, `.llm/harness/`, and `.llm/runs/`.
  No `packages/`/`plugins/` source.
- 2026-08-03 · **eval substitution (recorded per the reviewer-substitution waiver [observed])** —
  formal PLAN-EVAL is substituted by the owner's prior ratification of the design doc (PR #1150,
  decisions D1–D3 on #1120), and IMPL-EVAL by owner ratification of this draft PR (D1: the draft
  PR *is* the ratification instrument). Scope of the waiver: prose/doctrine artifacts, per the
  design doc's rule — "keep opposite-family review for code, drop it for run artifacts and
  evidence prose." No code is authored in this run.
- 2026-08-03 · **ratification delegated to the adversarial pass (owner directive, this session)** —
  the owner directed: launch a GPT-5.6 Sol high adversarial eval via the agentic toolchain; if
  green, merge. Routed per lane policy as `review_claude` (Codex · OpenAI · `gpt-5.6-sol` ·
  **xhigh** — the canonical binding for reviewing Claude work; the owner's "high" resolved to the
  enforced route rather than launching a mismatched identity). Launched app-server-attached in an
  isolated worktree (`/home/codex/repos/ns-msorch-eval-1161`, branch `review/pr-1161-sol`, head
  `aa11f0b33`); brief at `sol-eval-brief.md` in this run dir; thread id in
  `codex-thread-ids.md`. Verdict bar: any C/M finding → CHANGES_REQUESTED (no merge); PASS → mark
  ready, `status:ready-merge`, evidence mirror + close-gate, squash-merge.
- 2026-08-03 · **eval cycle 1: CHANGES_REQUESTED (9C/6M), all findings accepted** — verdict in
  `sol-eval-1.md` + PR comment. Notable drift the eval surfaced: (a) the artifacts' `[observed]`
  definition was narrower than their actual evidence base — widened to the recorded 0.0.4
  execution with per-claim citations rather than promoting or demoting claims silently; (b) the
  canary-note→stable-note accumulation was written as mechanism but is design intent — downgraded
  to [asserted] with the gap stated; (c) D2's "before any 0.0.5 delivery work" is already
  factually strained (#1153/#1155 merged pre-ratification carrying the 0.0.5 milestone) —
  surfaced to the owner in the acceptance evidence rather than papered over. Re-review steered on
  the same Sol thread (eval loop 1 of 2 before escalation).
