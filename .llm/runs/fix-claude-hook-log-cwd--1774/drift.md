# Drift Log: Claude hook cwd independence

Drift is append-only.

## 2026-08-30 — Owner-selected planning session

- **What:** The already-launched leaf session uses Codex GPT-5.6 Sol medium for Bootstrap, Research,
  and Plan.
- **Source:** `codex-thread-ids.md` and the owner brief.
- **Expected:** Canonical long-running planning defaults to the planning-decisions route.
- **Actual:** The owner provided a bounded existing Codex medium leaf session and required a hard
  stop before external PLAN-EVAL.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`, `codex-thread-ids.md`

## 2026-08-30 — PR phase sync used repository REST

- **What:** `gh pr edit` could not update the draft body/labels because its GraphQL query requested
  organization/discussion fields outside the owner-described repo-only PAT.
- **Source:** `gh pr edit 1775` returned required-scope errors for `read:org`/`read:discussion`.
- **Expected:** Repository-scoped PR body and label updates would use only `repo` permission.
- **Actual:** The GraphQL client route over-fetched unrelated fields; repository REST endpoints
  accepted the same body, comment, and exact label-set updates with the available token.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Draft PR #1775 remains draft at `status:plan-eval`, milestone `0.0.7`, with exactly
  the requested type/area labels and one status label.

## 2026-08-30 — Project-root premise corrected to session launch root

- **What:** Cycle-1 PLAN-EVAL verified that `CLAUDE_PROJECT_DIR` stays at the checkout where the
  Claude session started and does not follow `EnterWorktree`.
- **Source:** Evaluator-owned `plan-eval.md` at `842816a2` plus the official Claude hooks/worktrees
  reference it checked.
- **Expected:** D1, Goal, D8, and the acceptance evidence described the variable as an active
  worktree root that followed each worktree.
- **Actual:** The mechanism fixes #1774's nested `.llm/runs/<run>` cwd defect against the session
  launch root only. A worktree entered later is cwd, not a new `CLAUDE_PROJECT_DIR`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Amended `plan.md` narrows D1/Goal/Non-Scope and the decoy proof; PR #1775 acceptance
  evidence makes the same limitation explicit. Worktree-following output is deferred, and #1776
  separately tracks the unrelated `wslHome()` default defect.

## 2026-08-30 — Fetched main advanced beyond the handoff SHA

- **What:** The implementation handoff named `52a881c58842f521b7b253b9781a0b56ae897069` as current
  inert `main`, while a fresh fetch resolved `origin/main` to
  `9710a2898d4f0536752ab303b737e70411a4c399`.
- **Source:** Raw `git fetch origin main` and `git rev-parse origin/main` during S3 bootstrap.
- **Expected:** The named main SHA would still be the remote tip and would be inert under
  `.claude/**` and `.llm/tools/agentic/**`.
- **Actual:** The remote moved. Diffing the branch base through the fetched tip found only teardown
  fixture/probe changes under `.llm/tools/agentic/teardown/**`; the owned hook surface
  (`.claude/**`, `.llm/tools/agentic/claude/**`, `deno.json`, and the agentic README) has zero
  drift.
- **Severity:** minor
- **Action:** accept
- **Evidence:** No rebase was performed, as explicitly required; the implementation continues on the
  plan-evaluated base.
