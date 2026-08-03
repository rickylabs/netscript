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
- 2026-08-03 · **eval cycle 2: CHANGES_REQUESTED — second failure, ESCALATED to owner** (verdict
  `sol-eval-2.md`). Resolved by Sol: C1, C2, C4, C5, C6, C8, M3, M5, M6; no duplicate paragraphs;
  mirror byte-identical. Of the 8 cycle-2 findings, 5 fixed in the follow-up slice: C3 residue
  (reference-table row), C10 (tag-existence wording corrected against the tool), M7 (#1160 is
  closed — lineage note now says so), and C7 + M4 converted from undemonstrated to **demonstrated**
  (`gate-demos.md`: check-3 synthetic RED/GREEN; #1142 selection rule recovering PR #1155's true
  pre-merge verdict from its live rollup containing a post-merge FAILURE). Escalated, needing an
  owner ruling: **C9** — D2 is factually strained by pre-ratification 0.0.5-milestone merges
  #1153/#1155; the D2 evidence box is now UNTICKED pending a ruling (orchestrated-delivery reading
  recorded on #1120, or criterion moves); **M1/M2** — Sol holds `[observed]` must be cut-trace-only;
  the artifacts follow the ratified design doc's practice (trace + filed issues + dated design
  observations, cited per claim). Demoting filed-issue observations (#1113, #1115) to
  "asserted/unproven" would be less accurate, not more honest — supervisor position, owner to
  ratify or overrule. **No merge: the owner's green-gate condition is unmet.**
