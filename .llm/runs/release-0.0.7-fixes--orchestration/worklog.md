# Worklog — release 0.0.7 fixes topic

| Host-clock time (UTC) | Event | Evidence |
| --- | --- | --- |
| 2026-08-13T20:18:45Z | Activated the fixes topic run and loaded all required skills plus approved coordination artifacts. | `supervisor.md`; coordinator run artifacts |
| 2026-08-13T20:18:45Z | Reconciled live repository and Wave 0 issue state. `origin/main` is unchanged; all four issues are open in `0.0.7`; no colliding branches/PRs exist. | raw Git ground-truth commands; authenticated GitHub API reads |
| 2026-08-13T20:18:45Z | Created two isolated no-upstream leaf branches/worktrees from live `origin/main`. | `leaf-registry.md`; raw Git worktree/branch checks |
| 2026-08-13T20:22:40Z | Launched both Wave 0 implementers attached through `agentic:launch-codex-slice`; requested and observed routes match, exact worktrees match, and WIP is 2 implementers / 0 evaluators. | leaf `codex-thread-ids.md`; `agentic:codex-status`; `leaf-registry.md` |
| 2026-08-13T20:22:40Z | Global expensive-gate lease remains ungranted. Both agents were explicitly barred from `scaffold.runtime`, Aspire, and Docker until coordinator confirmation. | launch briefs; Expensive-gate lease section below |

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
