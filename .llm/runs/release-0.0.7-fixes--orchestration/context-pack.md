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
  **Slices 2-5 are landed** at head `cab6d1feb813a88afde7403ee21de44503503fa0`, clean and pushed,
  on the original thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`: `32cd429c0` (#1588 provider-selected
  output), `275ae091c` (#1262 truthful seed), `589a01a55` (#1263 defined missing-row errors),
  `cab6d1feb` (grouped acceptance prep). Plan gate closed at cycle-2 `PASS`.

  **Topic Tier-A review is done and sign-off is HELD on finding T-1.** Verified independently: the
  slice-2 gate reproduces 9/0, `quality:scan` is clean with all 7 allowances pre-existing and none
  in a touched file (no new suppression to green a wrapper), `arch:check` has no FAIL rows,
  `deno.lock` is unchanged, and no runtime/Aspire/Docker process ran.

  **T-1:** `generators_test.ts` went 11 -> 8 `it()` cases. The replacement four-engine
  required/forbidden matrix is stronger for #1588, but the deleted mssql loopback-normalization case
  was the only pin on `normalizeSqlServerHost`, which is still live generated code and now has zero
  test coverage; the slice-2 comment does not record the removal or its rationale. Fix is one
  bounded fix-up on the same thread, then re-run the slice-2 gate and amend the comment.

  Blocked until T-1 clears: the supervisor sign-off commit and the mandatory fresh opposite-family
  IMPL-EVAL. Blocked independently: slice 6, which needs the **ungranted** `scaffold.runtime`
  singleton lease.

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
