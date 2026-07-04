# Agent Handoff

Harness work can be delegated between local agents, OpenHands in GitHub Actions, and OpenHands on
the VPS through GitHub PR/issue comments.

## When to Use

Use this workflow note when a harness run needs:

- mobile-triggered cloud work,
- a model-specific cloud evaluator or fixer,
- a cloud review-comment response loop,
- a local-to-cloud handoff from a commit message,
- a cloud-to-local handoff through a `ready:local` label or PR comment.

## Trigger Contract

Preferred triggers:

- label `fix-me` or `openhands`,
- label `agent:sonnet`, `agent:gpt`, or `agent:gemini`,
- comment `@openhands-agent model=<provider/model> output=<mode> ...`,
- commit message `[openhands model=<provider/model> output=<mode>] ...`,
- manual `OpenHands Agent` workflow dispatch.

The canonical details live in `AGENTS-handoff.md` and `.agents/skills/openhands-handoff/SKILL.md`.

## Harness Rules

- The phrase `use harness` still activates the normal harness run loop.
- PLAN-EVAL and IMPL-EVAL remain separate sessions. A cloud OpenHands run can perform one of those
  roles, but it must not self-certify work it generated in the same session.
- Cloud agents must update the normal run artifacts under `.llm/runs/<run-id>/` when the task is
  a harness run.
- The OpenHands workflow summary artifact is additional handoff evidence, not a replacement for
  `worklog.md`, `evaluate.md`, or `drift.md`.
- If a cloud run discovers plan drift, it records drift in the harness artifact first, then reports
  the drift in the PR comment.

## Output Contract

For a harness run, the OpenHands evaluator's verdict and trace are part of the **tracked**,
reviewable run record — they never live in git-ignored scratch. The evaluator writes to:

- **`OPENHANDS_RUN_DIR`** — the run's tracked run dir, `.llm/runs/<run-id>/`. The verdict artifact
  (`plan-eval.md` for PLAN-EVAL, `evaluate.md` for IMPL-EVAL) lands here and is committed as the
  reviewable trail. There is no `commits.md`: the draft PR's commit list plus per-slice comments are
  the commit trail (see the V3 tracked-run-dir relocation).
- **`TRACE_DIR`** — a `trace/` subdirectory beneath `OPENHANDS_RUN_DIR`
  (`.llm/runs/<run-id>/trace/`, env `OPENHANDS_TRACE_DIR`) holding the compact per-run trace
  metadata the workflow mirrors.

This **replaces** the older ad-hoc `.llm/tmp/run/openhands/…` and `.llm/tmp/openhands/summary.md`
paths: those remain git-ignored per-run scratch only and are never the harness verdict of record.
The workflow still posts the summary comment back to the issue or PR unless output mode is
`summary-only`. Dispatch the run and read its verdict through the agentic suite
(`.llm/tools/agentic/dispatch-openhands.ts`, `.llm/tools/agentic/openhands-status.ts`).

For review-comment response loops:

- `respond-comments` means one PR comment with explicit responses.
- `thread-replies` means one PR comment plus optional threaded replies supplied via
  `OPENHANDS_REPLIES_PATH`.

## Token Rule

Do not expect chain triggers from the default `GITHUB_TOKEN`. Use `PAT_TOKEN` or a GitHub App token
for cloud-created commits/comments/labels that should trigger another workflow.

## Closeout

When an OpenHands cloud run participates in harness work, record:

- trigger used,
- selected model,
- output mode,
- Actions run URL,
- summary comment URL when available,
- validation gates run,
- whether any follow-up local/VPS session is needed.
