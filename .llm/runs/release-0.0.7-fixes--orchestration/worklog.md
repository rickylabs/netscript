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
