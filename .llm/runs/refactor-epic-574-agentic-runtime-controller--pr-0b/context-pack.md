# Context Pack: PR 0B desired-state agentic runtime controller

## Run Metadata

| Field | Value |
| --- | --- |
| Issue / PR | #576 / draft #585 |
| Branch | `refactor/epic-574-agentic-runtime-controller` |
| Worktree | `/home/codex/repos/netscript-epic-574-pr0b-controller` |
| Base | PR #584 sign-off `9b75470` |
| Phase | Plan & Design complete; Plan-Gate pending coordinator |
| Thread | `019f4b72-2ea4-7050-917e-6d6918371265` (resume only) |

## Current State

Research and Design are complete. The plan defines a typed schema `1.0`, separate desired/observed/
plan models, read and mutation ports, Claude/Codex/Gemini/provider/mobile adapters, mechanically
read-only inspection/dry-run, value-free local state, stable failure taxonomy, transactional apply
and ownership-scoped rollback, five implementation slices, exact gates, and file/scope budgets.

No implementation source was edited in the planning turn. The owner waived external evaluator
dispatch but explicitly left substantive Plan-Gate approval to the coordinator; this worker has not
self-certified and no `plan-eval.md` exists.

## Locked Boundaries

- #576 owns the controller contract, generic explicit operations, adapters, rollback, and wrappers.
- #577 owns provider/OpenRouter profiles and credential injection.
- #578 owns Gemini grounded evidence acquisition.
- #579 owns automatic quota fallback state/history/reset policy.
- #580 owns durable sender locking and live Codex remote repair.
- #581 owns canonical routing/model policy migration.
- #582 owns full rollout canaries and promotion.
- Deferred live capability returns a structured block; it never succeeds or mutates.

## Planned Slices

1. Contract/state/ports/pure planner.
2. Controller/renderers/foundation/local-state/mobile adapters and read-only canonical CLI.
3. Claude/Codex/Gemini/provider lifecycle adapters.
4. Transactional apply, explicit fallback/restore, rollback, and failure behavior.
5. Compatibility wrappers, documentation, and full scoped gates.

## Next Action

The coordinator substantively reviews `research.md`, `plan.md`, and the `## Design` section of
`worklog.md` against the Plan-Gate. If approved, the coordinator records the waiver-aware approval
without claiming an external evaluator, then resumes this exact thread for S1. Do not launch another
sender and do not implement before that approval.

## Safety

- Native ext4 only; explicit push refspec only.
- No credentials in argv, repo, output, comments, or run artifacts.
- No global provider defaults, provider login, live daemon repair, root formatting, dependency
  change, lock deletion/reload, or rollout promotion.
- Compatibility wrappers are retained; no deletion in #576.
