# Worklog — release 0.0.7 fixes topic

| Host-clock time (UTC) | Event | Evidence |
| --- | --- | --- |
| 2026-08-13T20:18:45Z | Activated the fixes topic run and loaded all required skills plus approved coordination artifacts. | `supervisor.md`; coordinator run artifacts |
| 2026-08-13T20:18:45Z | Reconciled live repository and Wave 0 issue state. `origin/main` is unchanged; all four issues are open in `0.0.7`; no colliding branches/PRs exist. | raw Git ground-truth commands; authenticated GitHub API reads |
| 2026-08-13T20:18:45Z | Created two isolated no-upstream leaf branches/worktrees from live `origin/main`. | `leaf-registry.md`; raw Git worktree/branch checks |
| 2026-08-13T20:22:40Z | Launched both Wave 0 implementers attached through `agentic:launch-codex-slice`; requested and observed routes match, exact worktrees match, and WIP is 2 implementers / 0 evaluators. | leaf `codex-thread-ids.md`; `agentic:codex-status`; `leaf-registry.md` |
| 2026-08-13T20:22:40Z | Global expensive-gate lease remains ungranted. Both agents were explicitly barred from `scaffold.runtime`, Aspire, and Docker until coordinator confirmation. | launch briefs; Expensive-gate lease section below |
| 2026-08-13T20:26:59Z | Legacy leaf opened draft PR #1643 after a plan/bootstrap commit with a justified mechanical `PLAN-EVAL: N/A`. | PR #1643; `e49948bbf` |
| 2026-08-13T20:30:35Z | Legacy leaf stopped on significant frozen-contract drift before committing product code: current shared schema/copy compatibility requires the filed manifest fields, while the viable fail-loud CLI fix requires an undeclared test file. | PR #1643 PLAN comment; focused structured test exit 1 (10 pass, 8 fail); `69aaeba2a` |
| 2026-08-13T20:33:45Z | Topic orchestrator declined to expand the contract, preserved the exact proposed patch as evidence, restored a clean leaf worktree, and kept PR #1643 draft at `status:plan`. | `f3cf40909`; clean raw Git status; same-thread steering record |
| 2026-08-13T20:38:25Z | Scaffold leaf completed independent red-first probes. #1262 seed output lacks model-aware rows, #1263 generated runtime lacks GET/PATCH/DELETE not-found handling, and #1588 SQLite output retains other-provider parsers. The #1263 OpenAPI 404 sub-symptom is already fixed on current main and is retained as an approved regression-test fallback. | leaf `receipts/red-first.md`; leaf research/worklog |
| 2026-08-13T20:41:24Z | Scaffold leaf locked its non-mechanical plan but stopped before product edits because provider selection and model-aware seed generation require two generator surfaces omitted from the frozen contract. | draft PR #1654 RESEARCH/PLAN comments; `88b735a36` |
| 2026-08-13T20:44:08Z | Scaffold leaf committed and explicitly pushed its clean artifact-only paused state. It now requires a coordinator-amended contract followed by a separate PLAN-EVAL before the implementation thread may resume. | `42572af32`; draft PR #1654; clean raw Git status |
| 2026-08-15T00:00:00+02:00 (reset boundary) | Owner revoked the temporary Codex topic-orchestrator fallback for this lane; coordinator `codex-root-0.0.7` parked the prior Codex topic thread `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` at `TOPIC_CONTROLLER_PARKED`/idle/clean and it must never be resumed as topic controller. Native Claude Sonnet 5 low replaces it on the same preserved worktree/branch. A prior fixes-topic DeepSeek/OpenRouter IMPL-EVAL attempt for #1643 was stopped pre-verdict by the coordinator; its transport artifact was removed and the evaluator brief amended to require a fresh native Claude/Fable gate after reset. | coordinator `supervisor.md` reset-transition section; `briefs/reset-gates/dispatch.json` |
| 2026-08-15T22:22:23Z (host clock, pre-reset UTC stamp) | First-turn Claude reconciliation. Read the common reset contract and coordinator dispatch set. Verified both leaf worktrees clean and both draft PRs (#1643, #1654) open/mergeable at exactly the heads named in `dispatch.json`: legacy leaf at `e6ba15ec6414c0a42b1f9870791131162ea71c36` (dispatch order 2, fresh IMPL-EVAL, Sonnet 5 low) and scaffold leaf at `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` (dispatch order 5, fresh PLAN-EVAL cycle 1, Sonnet 5 medium). No drift found — the topic-local coordinator-decision-required blockers recorded 2026-08-13 for both leaves were resolved upstream (contracts amended, implementation advanced past the paused heads) between this topic's last local update and the reset. `leaf-registry.md` state/base columns updated to match. No Docker containers running, no expensive-gate lease held. Per the reset contract and this session's exact brief, no leaf or evaluator is launched this turn; both remain held pending the coordinator's explicit serial dispatch grant. | `leaf-registry.md`; `gh pr view 1643/1654 --json headRefOid,state,isDraft,mergeable`; `git log`/`git status` in both leaf worktrees; `docker ps` |

## Design

- Public surface: none in the topic-control branch; product surfaces are exclusively leaf-owned.
- Vocabulary: topic, leaf, implementation WIP, evaluator WIP, expensive-gate lease, coordinator
  handoff.
- Ports: Git/GitHub and the checked-in agentic runtime only.
- Constants: immutable base `01e0960494c95ce56eb35892c211a095eb13e6ed`; WIP `2/1/1`.
- Commit slices: topic bootstrap/identity; launch identity capture; supervision/handoff evidence.
- Deferred scope: all post-Wave-0 leaves and all coordinator merge/release actions.
- Contributor path: `leaf-registry.md` is the compact operational index; each leaf's own run dir is
  the detailed source.

## Expensive-gate lease

No lease is held locally. Both briefs require a coordinator grant before `scaffold.runtime`,
Aspire, or Docker work begins. The grouped scaffold leaf has first topic priority when the global
lease becomes available because its three-issue acceptance shares that one verdict.

## Coordinator decision required — legacy-port-pin-sweep

The live issue assumption that the manifest ports are mechanically removable is false on current
`main`: the shared manifest schema and official-copy compatibility protocol still consume them.
The bounded fail-loud CLI remedy is viable, but its focused regression test file is absent from the
frozen leaf contract. The leaf is clean and paused at `f3cf40909`; the coordinator must either
issue a replacement contract naming the authorized surfaces/remedy or disposition #1243 outside
this leaf. This topic run will not infer that scope change.

## Coordinator decision required — scaffold-generated-output-correctness

The approved behavior remains bounded, but the frozen surface omits the generator seam required to
select provider-specific Prisma configuration and the generator/scaffolder seam required to emit a
model-aware or explicit empty-schema seed. The coordinator must amend the contract to include
`packages/cli/src/kernel/templates/database/generate-prisma-config.ts`,
`packages/cli/src/kernel/adapters/database/scaffolder.ts`, and a new
`packages/cli/src/kernel/templates/database/generate-database-seed.ts` plus its focused test. After
that amendment, launch one separate PLAN-EVAL against `42572af32`; only an unqualified PASS permits
the attached implementation thread to resume. The shared `scaffold.runtime` verdict remains
lease-gated and has not run.
