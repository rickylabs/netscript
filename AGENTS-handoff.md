# Agent Handoff Protocol

This repo treats GitHub PR and issue comments as the shared message bus between local agents and
OpenHands (GitHub Actions and the VPS Web UI). This file is a **thin pointer** — the handoff spec is
maintained in two canonical homes so it is not duplicated (and cannot contradict itself):

- **`.agents/skills/openhands-handoff/SKILL.md`** — the operational routing card: trigger syntax
  (`fix-me`/`openhands` labels, `agent:<profile>`, `@openhands-agent …`, `[openhands …]` commit
  tokens, manual dispatch), the **model precedence** order and the provider→secret inference table,
  the **output modes** (`pr-comment` / `respond-comments` / `thread-replies` / `summary-only`), the
  **token rule** (`PAT_TOKEN`/GitHub App token for chained cloud events), the operational gotchas
  (eval lock-churn, stale summary comment, per-PR concurrency-cancel), and the `.llm/tools/agentic/`
  dispatch/status suite.
- **`.llm/harness/workflow/agent-handoff.md`** — the **harness output contract**: for a harness run
  the OpenHands evaluator's verdict and trace live in the **tracked** run dir — `OPENHANDS_RUN_DIR`
  (`.llm/runs/<run-id>/`, where `plan-eval.md`/`evaluate.md` is committed) and `TRACE_DIR`
  (`trace/` beneath it, env `OPENHANDS_TRACE_DIR`). This **replaces** the legacy git-ignored
  `.llm/tmp/run/openhands/…` and `.llm/tmp/openhands/summary.md` scratch paths, which are never the
  verdict of record.

For anything about triggering, model selection, output modes, or the token rule, read the
`openhands-handoff` SKILL. For where a harness run's artifacts and verdict must land, read
`.llm/harness/workflow/agent-handoff.md`. Do not re-specify either here.

## Long-Running VPS Sessions

The only handoff fact unique to this doc: choose the surface by run length.

- **Actions workflow** — short PR/issue fixups, evaluator passes, small research tasks, mobile
  triggers.
- **VPS Web UI/SDK session** — long-running implementation, planning with checkpoints, or work
  needing a human-in-the-loop review before continuing. Deploy from
  `ops/openhands/docker-compose.yml` (Dokploy). Leave a PR/issue comment linking the session outcome
  back to the GitHub thread.
