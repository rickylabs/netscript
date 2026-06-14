# Run dir — Wave 5d umbrella (`@netscript/fresh`)

Supervisor-owned umbrella for sub-wave 5d. Contents:

- `plan.md` — **BINDING target architecture** for the whole package: mission,
  archetype, final entrypoints (12 + `./testing`), final folder shape,
  quality bar, accepted drift tolerance, sequencing, evaluation protocol.
  Every 5d sub-plan derives from it.
- `handover-5d1-plan.md` … `handover-5d6-plan.md` — copy-pasteable PLAN-phase
  prompts for the six sub-gate generator sessions.
- `worklog.md` / `commits.md` / `drift.md` — append-only umbrella bookkeeping.

## Sub-gate map

| Gate | Scope | Branch suffix | Worktree | PR |
|---|---|---|---|---|
| 5d1 | error · utils · vite · interactive · mod skeleton · doctrine spine | `5d1-support` | `wave5-apps-5d1-support` | #34 |
| 5d2 | builders (definePage DSL) | `5d2-builders` | `wave5-apps-5d2-builders` | #35 |
| 5d3 | route (manifest + contract runtime) | `5d3-route` | `wave5-apps-5d3-route` | #36 |
| 5d4 | defer + streams (+ server streaming internals) | `5d4-streaming` | `wave5-apps-5d4-streaming` | #37 |
| 5d5 | form (RFC 15, fresh-ui seams) | `5d5-form` | `wave5-apps-5d5-form` | #38 |
| 5d6 | query + server/defineFreshApp + final surface + wave closeout | `5d6-query` | `wave5-apps-5d6-query` | #39 |

All branches fork from `c64cb16` (5c head post-umbrella-reconcile). PLAN
phases parallel; IMPLEMENTATION chained 5d1→5d6. Plan review by Fable 5 on
each sub-PR, then PLAN-EVAL (separate session).

## Publication Protocol For Subagents

Implementation and evaluator agents must run from native WSL ext4 worktrees. They should attempt a
normal `git push` once after committing. If the shell reports missing GitHub HTTPS credentials
(`could not read Username for 'https://github.com'`) or `gh` is unavailable/unauthenticated, do not
repeat unauthenticated pushes. Record the blocker in `drift.md`/`worklog.md`, comment the PR through
the GitHub connector when available, and hand publication back to the supervisor.

The supervisor may publish branch-visible source/artifact state through the GitHub connector when
normal shell credentials are absent. Connector-published commits may not preserve local commit SHAs;
record both local and remote commit IDs explicitly in the run artifacts and PR handoff.

