# Context Pack: G3 #842 type-safe desktop bindings

## Run Metadata

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g3-842-bindings`                                 |
| Branch         | `feat/desktop-frontend-842-bindings`                                              |
| Draft PR       | [#853](https://github.com/rickylabs/netscript/pull/853) → `feat/desktop-frontend` |
| Current phase  | `implement` — slice 2 complete, awaiting Tier-A review                            |
| Archetype      | `4 — Public DSL / Builder` with adapter/runtime subtype gates                     |
| Scope overlays | `frontend` browser/Aspire no-op; UI/route/visual gates N/A                        |

## Current State

The group Plan-Gate passed D1–D16. Slice 1 (`a77b210c`) implemented the SDK transport and received
Tier-A PASS. Slice 2 now implements `@netscript/fresh/desktop`: structural Desktop gating,
`RPCHandler.upgrade`, per-window binding ownership, explicit disabled lifecycle, and idempotent
close/unbind. Draft PR #853 still targets `feat/desktop-frontend`, carries `Closes #842`, remains
draft on milestone 13, and uses `status:impl`; issue #842 was reconciled to the same lifecycle.

## Completed

- Read every user-named skill, the run-loop, activation, lane policy, Plan-Gate/evaluator protocol,
  relevant archetypes, frontend scope overlay, fitness gates, doctrine, debt registry matches, and
  run templates.
- Read live #842/#840 and PR #822 RFC plus rev 10 plan.
- Used `deno doc` before focused SDK/Fresh source reads and inspected the installed oRPC 1.14.6
  MessagePort declarations/implementation.
- Read current official Deno Desktop binding and oRPC MessagePort guidance.
- Fast-forwarded the clean feature branch to `feat/desktop-frontend` @ `e6e1be08`, including G2's
  reviewed auto-update seam.
- Re-ran SDK/Fresh doc-lint, JSR helper, and raw publish dry-run baselines after that sync.
- Locked all decisions, risks, anti-pattern controls, commit slices, public examples, and full
  package/JSR/quality/architecture gates.
- Committed/pushed the seven planning artifacts and opened/configured draft PR #853 against the
  integration branch.

## In Progress

- Commit and push slice 2, post its structured gate evidence, and pause for Tier-A review.

## Next Steps

1. Supervisor performs the Tier-A slice-2 review; this session does not dispatch it.
2. On PASS, implement slice 3 consumer/JSR closeout without adding capability.
3. Run both full package tasks and the complete publication/quality/architecture gate set.
4. Commit/push/comment slice 3, then pause for its Tier-A review and supervisor-owned IMPL-EVAL.

## Key Decisions

| Decision                                           | Source       | Notes                                                                                     |
| -------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| SDK/Fresh focused desktop subpaths                 | plan D1      | Root barrels do not re-export runtime-only APIs.                                          |
| Full-duplex send/receive/close protocol            | plan D5–D6   | One client pump; one per-window server queue/waiter; no global state.                     |
| Cast-free structural MessagePort                   | plan D7      | Must compile against shipped oRPC 1.14.6 directly.                                        |
| Existing typed service client algebra              | plan D10     | One contract types HTTP and Desktop; no `bindings.d.ts`.                                  |
| Fresh owns `RPCHandler.upgrade` and bind lifecycle | plan D11–D13 | Explicit `bound`/`disabled` handle, POC-style feature detection, idempotent unbind/close. |
| Default serialization only                         | plan D14     | String/binary including `Uint8Array`; no `experimental_transfer`.                         |
| Full test directories                              | plan D16     | Required after every slice touching a package.                                            |

## Files Changed

| Path                                                                        | Status | Notes                                                      |
| --------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/supervisor.md`   | new    | Nested identity, routes, and exact stop-lines.             |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/research.md`     | new    | Live-source/dependency research and package JSR baselines. |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/plan.md`         | new    | Locked decisions, risks, gates, slices, and scope.         |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/worklog.md`      | new    | Design checkpoint and baseline evidence.                   |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/context-pack.md` | new    | Resumable Plan-Gate state.                                 |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/drift.md`        | new    | Integration/toolchain/doc-baseline drift.                  |
| `.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/plan-eval.md`    | new    | Pending supervisor-owned evaluator placeholder.            |

Slice 1 added `packages/sdk/src/desktop/**` and its tests/docs/export. Slice 2 adds
`packages/fresh/src/runtime/desktop/**` plus Fresh README/export/task/dependency wiring. The draft
PR commit list is the canonical exact file trail.

## Gates

| Gate family | Current status              | Evidence                                                                       |
| ----------- | --------------------------- | ------------------------------------------------------------------------------ |
| Static      | PASS through slice 2        | SDK 36/36, Fresh 206/206, and both scoped wrapper sets pass.                   |
| Fitness     | PASS_WITH_BASELINES         | New entrypoints are doc-clean; quality/architecture/publish gates pass.        |
| Runtime     | PASS through slice 2        | Strings, bytes, errors, isolation, no-op detection, and cleanup are exercised. |
| Consumer    | SDK PASS / closeout pending | SDK type fixture passes; combined public consumer closeout remains slice 3.    |

## Open Questions

- None that force implementation rework. Every considered question is resolved or explicitly safe to
  defer in `plan.md` § Open-Decision Sweep.

## Drift and Debt

- Drift: integration advanced during research and was cleanly synchronized; local Deno is 2.9.3;
  current Fresh doc/JSR baselines differ from resolved historical documentation; JSR helper has a
  known progress-banner false positive.
- Debt: no new/deepened SDK/Fresh debt is planned. New entrypoints must be independently clean;
  unrelated SDK one-finding and Fresh 40-finding doc baselines are preserved and attributed.

## Commits

- `2bdd882` — `docs(harness): plan desktop RPC bindings` (research, plan, Design checkpoint,
  baselines, drift, and pending evaluator placeholder).
- The immediately following documentation-only branch commit records PR #853 and the supervisor
  handoff; its exact hash is canonical in the PR commit list and readiness comment.
- See the draft PR's commit list + per-phase PR comment after handoff (V3 retired `commits.md`).

## Hard Stops

- No implementation before a separate Plan-Gate `PASS`.
- No evaluator or Tier-A review dispatch from this implementation session.
- No merge without CI green and opposite-family eval PASS.
- No release publish or milestone 13 closure without owner sign-off in-turn.
