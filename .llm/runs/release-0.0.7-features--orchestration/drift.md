# Drift — NetScript 0.0.7 features lane

Append-only. Severity: `minor` | `significant` | `architectural`.

## D-1 — attached thread lacks remote-control proof (significant)

**Date:** 2026-08-13. `agentic:launch-codex-slice` created daemon-managed, steerable thread
`019ffcc5-d3e1-7c13-9815-e9956ec43683` with matched route and exact worktree identity, but its live
startup stream reported `remoteControl/status=disabled`. A read-only `agentic:runtime repair
codex-remote --dry-run` observed `disconnected` and refused repair because the leaf turn/child
commands are active. Per the Tier-D truth rule, mobile visibility is **not claimed**. Continue the
safe turn, then re-check/repair only at an idle boundary; never interrupt this or sibling work.

No scope or `main` drift was found. Live `origin/main` still matches the immutable dispatch base and
the approved #1348/#1502 contracts remain current.

## D-2 — #1502 contract evidence scope was omitted from the leaf plan (significant)

**Date:** 2026-08-13. PLAN-EVAL cycle 1 found that the RFC-only author plan did not cite the
coordinator-approved `rfc-plugin-cli-contribution` leaf contract, waived four of its six proving
gates, and deferred its applicable JSR audit. The user's dispatch remains authoritative that this
leaf authors the RFC and proposes a separate later implementation epic, with no CLI seam
implementation now. The topic resolution therefore keeps package/plugin paths as inspection and
audit surfaces while restoring every selected gate and JSR obligation. Any package/plugin mutation
would be a scope expansion requiring coordinator amendment and a new plan.

The requested Fable 5 / medium evaluator route was unavailable because its recorded allowance was
exhausted. Cycle 1 used the approved opposite-family native Claude Opus 5 / medium fallback and
recorded both requested and observed routes; no route match is claimed.
