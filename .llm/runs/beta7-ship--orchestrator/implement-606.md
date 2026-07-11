use harness

# Slice brief — #606: shared local-source preparation fixture helper for CLI e2e

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (Claude session `df71d36c`).
  Do NOT open PRs. **PLAN-EVAL waiver** (owner-waived, drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-wt-606`, branch `test/606-shared-local-source-fixture`.
- Push: `git push origin HEAD:refs/heads/test/606-shared-local-source-fixture`.
- Worklog at `.llm/runs/test-606-shared-fixture--codex/worklog.md`, committed with the slice.

## Task (issue #606)

The generated-project local-source mapping is reinvented per gate. Two existing implementations to
unify (study both first):

- #597's `scaffold.ui-local-source` mapping for `@netscript/ai` (see `packages/cli/e2e`),
- #598's per-resource telemetry/sdk mapping for Flow-B (T8), incl. the flow-b fixture
  package-source-awareness from PRs #621–#623.

Extract ONE shared fixture helper in `packages/cli/e2e` that maps unpublished workspace members
into generated projects (import-map/package-source rewrite), parameterized by package set and
target resource/workspace. Refactor both call sites onto it. Test-layer only: no scaffold
templates, no product source changes.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/cli` (`run-deno-check.ts`/`run-deno-lint.ts`, `--ext ts,tsx`).
- Unit tests for the helper if the e2e layer has a unit-test seam.
- Affected e2e gates: run the narrow gates that exercise both call sites
  (`deno task e2e:cli gates <gate-ids>`) — NOT the full scaffold.runtime suite (orchestrator owns
  merge-readiness runs; note in worklog if you believe a full run is required).

## Done means

Shared helper landed, both call sites refactored, gates green, worklog committed + pushed.
Report "DONE" or "BLOCKED: <why>".
