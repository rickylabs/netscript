# Worklog

## Design

1. **Public surface:** existing `netscript db` commands keep exit-code/cleanup behavior while waiting without spawning a CLI process every second. No new package exports.
2. **Vocabulary:** follower = owned long-lived NDJSON Aspire child; resource update = one named resource state; completion = terminal executable state with numeric exit code.
3. **Ports:** existing `AspireCommandExecutor` gains a stream method; cancellation uses AbortSignal and lifecycle uses async-iterator disposal. Existing AppHost lock and request-file seams remain.
4. **Constants:** named follow arguments, total timeout and buffer bounds; existing terminal-state set retained.
5. **Commit slices:** bootstrap/draft → adapter/runner regression proof/docs → final evidence/handoff, with gates and files in plan.md.
6. **Deferred scope:** upstream patch/upgrade; converting explicit one-shot user commands; existing finite internal stage snapshots. Scaffold.runtime is required CI evidence, coordinator arms label.
7. **Contributor path:** `packages/cli/src/kernel/adapters/database/operations/aspire-command-executor.ts` defines the single Aspire command/stream seam.

## Routing authority

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” This overrides matrix evaluator model selection and effort; preserves session and family separation. Matrix feature policies remain two plan/five implementation rounds. No repository profiles loaded.

## Bootstrap

- Read complete assignment; preflight issue/comments and PR search found no covering PR. PR #2235 was an unrelated search hit (service authentication).
- Consulted previous environment/validation memory; no connected memory tool exists. RTK missing; focused raw reads plus structured wrappers are used.
- Asked NetScript MCP find_guidance then search_docs before design. Guidance points to existing event observation and distinguishes NDJSON follow from snapshot resources arrays.
- Bootstrap baseline matches origin/main. No runtime resources started.
