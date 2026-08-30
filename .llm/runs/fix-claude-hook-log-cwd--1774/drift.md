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
