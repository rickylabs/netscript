# Context Pack: PR 0B desired-state agentic runtime controller

## Run Metadata

| Field | Value |
| --- | --- |
| Issue / PR | #576 / draft #585 |
| Branch | `refactor/epic-574-agentic-runtime-controller` |
| Worktree | `/home/codex/repos/netscript-epic-574-pr0b-controller` |
| Base | PR #584 sign-off `9b75470` |
| Phase | S1 remediation gates pass; Tier-A S1 re-review pending |
| Thread | `019f4b72-2ea4-7050-917e-6d6918371265` (resume only) |

## Current State

Research and Design are complete, and coordinator Plan-Gate approval authorized S1. S1 now provides
schema `1.0` contracts, value-free desired/observed/checkpoint state, separate read/mutation ports,
and a pure deterministic reconciliation planner. Equal state plans no actions, actions are data
only, and deferred capability requests return explicit blocked intents.

Tier-A requested three S1 corrections: preserve the complete PR 0A observed component vocabulary
while restricting bootstrap to an installable subset, make command modes legal by construction and
runtime-guarded, and give configure a desired-state content reference plus a dedicated read-only
source port. All three are implemented in the existing S1 files.

Focused tests pass `18/18`; scoped check, lint, format, `git diff --check`, secret/content scans, and
lock proof pass. All six files remain within their locked LOC budgets. No dependency or `deno.lock`
change occurred. Tier-A S1 re-review is not self-certified and remains pending; S2 has not started.

## Locked Boundaries

- #576 owns the controller contract, generic explicit operations, adapters, rollback, and wrappers.
- #577 owns provider/OpenRouter profiles and credential injection.
- #578 owns Gemini grounded evidence acquisition.
- #579 owns automatic quota fallback state/history/reset policy.
- #580 owns durable sender locking and live Codex remote repair.
- #581 owns canonical routing/model policy migration.
- #582 owns full rollout canaries and promotion.
- Deferred live capability returns a structured block; it never succeeds or mutates.

## Slice State

1. S1 contract/state/ports/pure planner: Tier-A findings remediated; automated gates pass; Tier-A
   re-review pending.
2. S2 controller/renderers/foundation/local-state/mobile adapters and read-only canonical CLI: not
   started.
3. S3 Claude/Codex/Gemini/provider lifecycle adapters: not started.
4. S4 transactional apply, explicit fallback/restore, rollback, and failure behavior: not started.
5. S5 compatibility wrappers, documentation, and full scoped gates: not started.

## S1 Files and Evidence

- `.llm/tools/agentic/runtime/contract.ts`
- `.llm/tools/agentic/runtime/state.ts`
- `.llm/tools/agentic/runtime/ports.ts`
- `.llm/tools/agentic/runtime/planner.ts`
- `.llm/tools/agentic/runtime/contract_test.ts`
- `.llm/tools/agentic/runtime/planner_test.ts`
- Focused test: exit 0, `18 passed | 0 failed`, with `--no-lock` and no permissions.
- Scoped wrappers: check/lint/format exit 0 across all 6 files with 0 findings.
- Hard LOC budgets: PASS (`220`, `152`, `123`, `348`, `257`, `274` lines respectively).
- Secret-bearing/content field scans: PASS. `deno.lock` matches S1 commit `9f59ad8` exactly.
- Drift/debt: none. Deferred implementation remains assigned to #577 through #582 as planned.

## Next Action

Coordinator reviews the separate S1 remediation commit and records the Tier-A re-review result. Do
not start S2 or launch another sender. Resume this exact thread only after coordinator approval and
a concrete S2 brief.

## Safety

- Native ext4 only; explicit push refspec only.
- No credentials in argv, repo, output, comments, or run artifacts.
- No global provider defaults, provider login, live daemon repair, root formatting, dependency
  change, lock deletion/reload, or rollout promotion.
- Compatibility wrappers are retained; no deletion in #576.
