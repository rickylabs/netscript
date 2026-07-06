# Supervisor Identity - beta5-impl--supervisor

Written at run start per `workflow/lane-policy.md` section Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex GPT-5 implementation session |
| Session | WSL Codex implementation slice launched by user prompt |
| Host | Linux / WSL-compatible workspace |
| Checkout | `/home/codex/repos/netscript-303-doclint` |
| Worktree | `/home/codex/repos/netscript-303-doclint` |
| Branch | `chore/303-enterprise-surface-sweep` |
| Baseline | `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` from `origin/main` |
| Run ID | `beta5-impl--supervisor` |

## Lane table in force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | External beta.5 supervisor | Owns final merge-readiness, runtime smoke, and issue #303 acceptance. |
| D | WSL Codex implementation slice | Performs public-surface doc-lint sweep, trivial type fixes, validation, commits, push, and draft PR comments. |
| E | Separate evaluator session | PLAN-EVAL before code implementation and IMPL-EVAL after final gates, per harness invariant. |

## Recorded lane/eval overrides

- None at bootstrap. If OpenHands evaluator dispatch is unavailable from this worktree, record the
  blocked launch in `drift.md` before using any owner-authorized fallback.
