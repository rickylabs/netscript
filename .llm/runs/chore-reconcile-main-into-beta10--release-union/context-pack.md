# Context Pack: beta.10 release union

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-reconcile-main-into-beta10--release-union` |
| Branch | `chore/reconcile-main-into-beta10` |
| Current phase | evaluate |
| Archetype | N/A — release-integration tooling reconciliation |
| Scope overlays | docs/tooling |

## Current State

The integration head `d962502f` is merged with fetched `origin/main` `10162bfd`. Seven conflicts
were resolved as semantic unions, all requested local gates pass, and the branch is ready for its
merge commit, explicit push, and draft PR creation.

## Completed

- Harness activation, research, locked plan, and Design checkpoint.
- Owner-authorized Plan-Gate waiver recorded; no evaluator dispatched.
- Agentic runtime/config: 153 pass / 0 fail after one stale OpenCode snapshot fix.
- MCP smoke: 40 pass / 0 fail.
- Root check, repository and changed-file quality scans, and doctrine gate: PASS.

## Next Steps

1. Commit the merge and harness evidence.
2. Push the explicit branch refspec.
3. Open the requested draft PR at `status:impl-eval` without dispatching evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preserve #794 review ladder | Owner brief / routing tests | Light and fast use Opus/Sonnet; normal and complex use Fable/Opus, with complex at medium. |
| Restore #784 non-review routes | Owner brief / `origin/main` | Fable low orchestrator and deep-analysis primaries; separate mobile lane removed. |
| Preserve union additions | Merge audit | Formal Qwen evaluator, OpenCode/Kimi lane, MCP/skills/agent CLI, and CI gates retained. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Agentic 153/0; root check exit 0. |
| Fitness | PASS | Repository + changed-file quality scans; `arch:check` exit 0. |
| Runtime | PASS | MCP package 40/0. |
| Consumer | PASS | MCP focused smoke. |

## Drift and Debt

- Drift: evaluator dispatch intentionally omitted by owner instruction.
- Debt: none created.

## Commits

- See the draft PR commit list + per-slice PR comment.
