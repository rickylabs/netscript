# A3 / #2400 leaf

Implementation: Codex, feature tier, owner-authorized continuation from merged H01 PR #2476. Baseline main a410a815ce1401d533b18f2a85eb75e266de94a5. Branch fix/workers-listener-restart-budget, direct PR to main. Claim: issue #2400 comment 6536634074.

Scope: plugins/workers/worker/listener-supervisor.ts and tests, worker-options.ts, worker.ts, queue-consumer.ts, directly related listener health/runtime tests, worker runtime tuning docs, and this run directory. No changes to #2144 job-dispatcher.ts or job-execution.ts. No dependencies or scaffold output intended.

Process: coordinator #2474 brief #2400, PLAN-EVAL before implementation, independent Opus 5.5 high-effort read-only evaluator (same session across rounds), max2 plan/max5 implementation rounds. Final verdict must name exact pushed commit. No local scaffold.runtime; coordinator owns shared E2E labels and merge. No labels or milestones changed. No private runtime identities/paths in public evidence. Native repo launcher is the evaluator execution interface; routing query and owner override will be recorded before dispatch.

## Resume 2026-10-31

Codex resumes the existing owner-assigned feature leaf at
048bad37987ea86ee2fd67494c9ca96a04bcfcf4, adopting PR #2482 and its branch.
The permitted write surface remains the exact files listed above, plus run evidence
and the runtime tuning document already in the PR. Current main will be merged
without rebasing or rewriting history. Dispatcher/execution behavior stays main's.
The existing successful PLAN-EVAL and precommit review are retained. The owner
requires independent Claude Opus 5.5/high exact-head review, closed stdin and
read-only work; the matrix query and override are recorded in worklog.md.
No private machine details or evaluator handles are published.

Necessary generated surface discovered during validation: permit the native
`gen:agent-docs-prose` output at
`packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` and the
`gen:mcp-export-corpus` output at
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`.
These carriers must match the approved tuning guide and public worker surface.
No manual compressed/generated payload edits or unrelated generated changes.
