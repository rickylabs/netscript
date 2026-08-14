# Context pack — release 0.0.7 fixes topic

## Control plane

- Coordinator artifacts: `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
  Read `briefs/reset-gates/dispatch.json` after the central state; it supersedes every earlier route
  matrix. The absolute topic contract is `briefs/topic-claude-reset-common.md`.
- Coordinator `codex-root-0.0.7` (Codex session `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`) holds sole
  merge/publish/relabel/close and central-state authority. This lane supervises only.
- Active controller: native Claude · Opus 5 · high, session `c7597d28-6774-44c9-aa00-b8b40b776165`,
  PID `2430399`, bridge `session_014pCd2QWkCscgZpVdjcUPST`, Remote Control attached. Predecessor
  Codex thread `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` is parked (`TOPIC_CONTROLLER_PARKED`, idle) and
  must never be resumed as topic controller. Full identity proof is in `supervisor.md`.
- Immutable dispatch base and current live `origin/main`: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Approved plan head: `331f7c664`; coordinator control head at dispatch: `5330285f65242eff639cfc5c7ed68a80740de910`.
- Topic branch `orchestrator/release-0.0.7-fixes` has no upstream by design — push by explicit
  refspec only.

## Wave 0 state (verified 2026-08-14T22:56:20Z)

Both leaves are **held**, clean, and at exactly their dispatch heads. Both attached Codex threads
are idle at `task_complete`. Nothing may resume until the coordinator grants the specific serial
dispatch order.

- `legacy-port-pin-sweep` (#1243, PR #1643, `status:impl`): **order 2 IMPL-EVAL returned `PASS`** at
  evaluated head `e6ba15ec6414c0a42b1f9870791131162ea71c36`; verdict commit `a949a6cd1` is pushed and
  the branch head is now `a949a6cd1`. Product diff is `auth-plugin-command.ts` plus its test;
  manifest/copy port fields were deliberately retained as coordinator-classified compatibility
  metadata. The `PASS` clears the gate at that head only — ready transition, merge, issue closure,
  relabeling, and publication stay coordinator-only, and this lane took none of them. Open follow-up
  for the coordinator: evaluator finding **N1**, the residual
  `session revoke --auth-url` → `http://localhost:8094/api/v1/auth` default, same pin class as #1243
  but outside its narrowing; it needs its own issue.
- `scaffold-generated-output-correctness` (#1262, #1263, #1588, PR #1654, `status:plan-eval`):
  **PLAN-EVAL cycle 1 returned `FAIL_PLAN`** at evaluated head
  `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9`; verdict commit `13008abf8` is pushed and the branch
  head is now `13008abf8`. Still plan-only, no product code. Plan repair is dispatched to the
  **existing** Codex plan-author thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85` (never a replacement),
  bound to the three required fixes: resolve OD-1 (generated memory router carries no error map, so
  `notFound` cannot produce a defined 404) plus an explicit open-decision sweep covering OD-2;
  restate every slice as `proves -> gate -> files` and add `generate-engine-mod.ts` to the plan's
  surface list; and account for #1262 acceptance item 3 while correcting the stale worklog status.
  The repair is plan-text only and stops at the cycle-2 handoff. **Cycle 2 is not authorized** — it
  needs an updated immutable source brief and an explicit coordinator grant. Two `FAIL_PLAN` cycles
  are permitted before escalation; this is cycle 1.

Both 2026-08-13 "coordinator decision required" blockers are resolved; see `worklog.md`.

## Constraints carried forward

- No global expensive-gate lease is held. `scaffold.runtime`, Aspire, and Docker remain barred until
  the coordinator grants the singleton lease; the grouped scaffold leaf has first topic priority when
  it becomes available, because its three-issue acceptance shares that one verdict.
- Zero Docker containers and no evaluator are running; one evaluator at a time, cluster-wide.
- Exact leaf identities and same-thread steering commands live in `leaf-registry.md` and each leaf's
  `codex-thread-ids.md`. Never send a second `send-message-v2` at an owned worktree — resume.
- Open coordinator item, non-blocking here: the generated DAG still tags #1360 `lane: fixes` while
  the leaf plan and cluster state place it in `features`. See `drift.md`.
