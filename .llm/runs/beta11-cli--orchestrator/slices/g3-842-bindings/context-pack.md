# Context Pack: G3 #842 type-safe desktop bindings

## Run Metadata

| Field          | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g3-842-bindings`                                   |
| Branch         | `feat/desktop-frontend-842-bindings`                                                |
| Current phase  | `plan-eval` — plan ready, supervisor-owned evaluator not dispatched by this session |
| Archetype      | `4 — Public DSL / Builder` with adapter/runtime subtype gates                       |
| Scope overlays | `frontend` browser/Aspire no-op; UI/route/visual gates N/A                          |

## Current State

Research, plan, and the Design checkpoint are complete on integration baseline `e6e1be08`. The
public surfaces, three-operation bind protocol, per-window state ownership, typed oRPC composition,
Fresh feature detection, three implementation slices, and all gates are locked. No SDK/Fresh
implementation file has been created. The Plan-Gate hard stop is active.

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

## In Progress

- Create the planning commit, open/configure the draft sub-PR, post
  `Plan & Design — READY FOR REVIEW`, and stop for supervisor-owned Plan-Gate evaluation.

## Next Steps

1. Supervisor dispatches a separate-session PLAN-EVAL and records `PASS` or `FAIL_PLAN` in
   `plan-eval.md` and on the PR.
2. If `FAIL_PLAN`, revise only the research/design artifacts and repeat the handoff.
3. If `PASS`, supervisor transitions the sole lifecycle label to `status:impl` and explicitly
   returns the implementation lane.
4. Implement slice 1 only, run its complete gates, commit/push/comment, then pause for Tier-A
   review.

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

No product/package file is changed in the planning checkpoint.

## Gates

| Gate family | Current status                         | Evidence                                                                                                           |
| ----------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Static      | BASELINED / implementation NOT_RUN     | Raw package dry-runs pass; implementation wrappers/full tests await Plan-Gate.                                     |
| Fitness     | PLAN COMPLETE / implementation NOT_RUN | Doctrine mapping, anti-pattern controls, risk register, full gate set, and JSR baselines in research/plan/worklog. |
| Runtime     | DESIGNED / NOT_RUN                     | Installed oRPC and official Deno behavior inspected; acceptance matrix locked.                                     |
| Consumer    | DESIGNED / NOT_RUN                     | Public caller shapes locked; fixtures belong to slices 1–3.                                                        |

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

- Planning commit and subsequent PR-handoff commit are recorded here after the draft PR is opened.
- See the draft PR's commit list + per-phase PR comment after handoff (V3 retired `commits.md`).

## Hard Stops

- No implementation before a separate Plan-Gate `PASS`.
- No evaluator or Tier-A review dispatch from this implementation session.
- No merge without CI green and opposite-family eval PASS.
- No release publish or milestone 13 closure without owner sign-off in-turn.
