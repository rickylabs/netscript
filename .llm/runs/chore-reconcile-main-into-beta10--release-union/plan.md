# Plan: reconcile main into beta.10 integration

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-reconcile-main-into-beta10--release-union` |
| Branch | `chore/reconcile-main-into-beta10` |
| Phase | `plan` |
| Target | release-integration tooling union |
| Archetype | N/A — merge reconciliation, not new framework architecture |
| Scope overlays | docs/tooling |

## Goal and Scope

Merge `origin/main` into the beta.10 integration head before the wave PR so CI and documentation
exercise the actual release union. Preserve both features in overlapping files.

## Non-Scope

- No evaluator dispatch and no merge of the resulting draft PR.
- No dependency upgrades, release cut, or unrelated cleanup.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Preserve the integration side's #794 review-pairing ladder. | Owner-ratified review routing must survive the union. |
| D2 | Take main's #784 state for all non-review lanes. | Fable restoration retires the temporary subscription substitution. |
| D3 | Remove every `temporary_while_fable_outside_subscription` condition and update stale tests. | Explicit owner acceptance criterion. |
| D4 | Resolve every other overlap as a semantic union. | Neither shipped feature may be dropped. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Conflict policy | resolved now | Fully specified by D1–D4. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Routing docs and machine policy diverge. | Compare both files and run the full agentic runtime/config test directories. |
| Merge silently drops MCP or OpenCode behavior. | Inspect combined diff and run focused MCP smoke plus root check. |
| Lock churn is accidental. | Preserve merge-sourced lock changes only; do not reload or regenerate caches. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Agentic runtime/config | `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/` | PASS |
| 2 | MCP smoke | focused package test if `packages/mcp` is present in the union | PASS |
| 3 | Static | `deno task check` | PASS |
| 4 | Quality | `deno task quality:scan` changed-file mode | PASS |

## Deferred Scope

- Formal PLAN-EVAL and IMPL-EVAL are deferred by explicit owner instruction; the draft PR remains
  at `status:impl-eval` for later independent evaluation.
