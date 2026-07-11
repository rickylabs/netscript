# Plan — multi-turn Codex slice runner

## Locked decisions

1. Add `run-codex-slice.ts`; keep the single-turn launcher/resumer compatibility surfaces intact.
2. Delegate first-turn launch to `launch-codex-slice.ts`; attach only when sender ownership names
   the same worktree/thread.
3. Require the final non-empty response line to be exactly `DONE` or `BLOCKED: <reason>`.
4. Retry classified quota/capacity failures within both turn and wall-clock budgets; use parsed
   reset time when available and bounded exponential delay otherwise.
5. Append Markdown turn records and atomically rewrite a dedicated JSON heartbeat/status file.

## Open-decision sweep

- Safe to defer: routing fallback. This slice waits/retries; route switching belongs to runtime policy.
- Safe to defer: unbounded supervisor workflows. Budgets are mandatory.
- Must resolve now: dry-run semantics. Dry-run emits a deterministic two-turn simulation and writes nothing.

## Commit slice

One slice: runner, pure library/tests, docs, and run artifacts. Gates: scoped check/lint/fmt,
targeted tests, then full agentic tests.

## Risks

- Launch output shape drift: reuse existing parser/launcher.
- Duplicate sender: validate the durable sender record before attach; launcher validates before launch.
- Excessive sleep: clamp every delay to the remaining wall-clock budget.
- Supervisor starvation: write status after every turn/quota event.

## Deferred scope

- Automatic provider/model fallback and daemon repair.
- PR creation/comments (explicitly prohibited by the brief).
