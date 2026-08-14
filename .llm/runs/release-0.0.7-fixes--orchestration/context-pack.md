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
- `scaffold-generated-output-correctness` (#1262, #1263, #1588, PR #1654, **`status:impl`**, draft):
  Plan gate is **closed** — PLAN-EVAL cycle 2 `PASS` at `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5`,
  verdict commit `b8fc5eb53`, cycle-1 `FAIL_PLAN` preserved byte-identical as
  `plan-eval-cycle-1.md`. **Implementation is running on the original Codex thread
  `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`** (resumed, never replaced; exactly one sender at that
  worktree) from head `b8fc5eb53`.

  Authorized this turn: **slices 2 -> 5 only, stopping before slice 6.** Slice 6 is the one-pass
  `deno task e2e:cli run scaffold.runtime` and needs the **singleton expensive-gate lease, which
  remains ungranted**. Each slice follows the plan's `Proves -> Decisive gate -> Files`, uses the
  structured wrappers as sole verdict source, and — because every one touches `packages/**` — must
  also clear `deno task quality:scan` and `deno task arch:check`; a new `// deno-lint-ignore`,
  `as any`, or `as unknown as` added to green a wrapper is review-blocking, not a pass.

  Still ahead after slice 5, none of it lifted by the plan PASS: topic Tier-A substantive review and
  the supervisor sign-off commit, the coordinator lease decision for slice 6, and a mandatory fresh
  opposite-family IMPL-EVAL. No lane self-certifies.

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
