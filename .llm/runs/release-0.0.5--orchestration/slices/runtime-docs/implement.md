use harness

# Slice W3 (docs lane): deterministic testing, observation, failure replay — #1109

You are the documentation-authoring agent for the PR closing #1109 (run
`release-0.0.5--orchestration`). Read the issue body first: seven boxes — six worked examples
across the background runtimes (cron `MemoryCronAdapter`, queue DLQ `list`/`depth`/`reprocess`,
sagas `createTestSagaRuntime`, streams telemetry facade, triggers manual fire/replay, workers
`defineWorkflow`/`WorkflowExecutor`) plus focused compile-or-executable coverage per example.
Docs only — **no `packages/` or `plugins/` source changes** (the pre-merge audit rejects them
from this lane). Exact published subpath imports. Explicitly out of scope: the cron retry
defect (#1104 owns it).

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`

## Verification before handoff

Examples type-check via `.llm/tools/run-deno-check.ts` (quote command + result in your slice
worklog); docs link checks green; self-audit `git diff --name-only` for lane purity.

## PR contract

Branch `docs/runtime-testing-replay` (this worktree), target `main`. Labels: `type:docs`,
`area:plugins`, `area:docs`, exactly one `status:`; milestone `0.0.5`. `Closes #1109` only with
every box truthfully ticked + evidence; authoritative `## Definition of Done` — tick every
template DoD box you can truthfully claim (unticked boilerplate fails close-gate). Push via
explicit refspec, open draft PR, record handoff in this slice dir's worklog.
