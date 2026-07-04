# NetScript Harness v3

Harness v3 is the agent operating system for doctrine-aware work in this repo. It keeps the v1
separation of planner, generator, and evaluator and the v2 doctrine-derived run shape, and adds
tiered agent lanes, git-tracked run dirs under `.llm/runs/`, and stage-labeled draft PRs as the
commit trail (no `commits.md`).

Authoritative doctrine:

- `docs/architecture/doctrine/` — the doctrine itself (the source of truth).
- [`DOCTRINE-REF.md`](./DOCTRINE-REF.md) — the navigable index that enumerates every doctrine page,
  maps the harness files to doctrine, and carries the axiom digest. Start here to find the doctrine
  home for a concept.

Do not copy doctrine passages into harness files. Harness files point to the doctrine and explain
how an agent uses it during a run.

## Start Here

1. Read `workflow/activation.md`.
2. Read `workflow/run-loop.md` (especially § 3b Design checkpoint and § 4 Plan-Gate).
3. Select an archetype with `archetypes/README.md`.
4. Read the matching `archetypes/ARCHETYPE-*.md` (including its Design Checkpoint Expectations and
   Concept of Done sections).
5. Apply a scope overlay when the work is frontend, service, or docs.
6. Read `gates/archetype-gate-matrix.md`.
7. Use the matching artifact template from `templates/`.

## Folder Contract

| Folder        | Concern                                                               |
| ------------- | --------------------------------------------------------------------- |
| `workflow/`   | Run mechanics: activation, loop, retrieval, lane policy, tooling index, circuit breakers |
| `archetypes/` | Doctrine archetype profiles plus scope overlays                       |
| `gates/`      | Static, fitness, runtime, and consumer gate definitions               |
| `evaluator/`  | Separate evaluator-session protocol and verdict definitions           |
| `templates/`  | Canonical run artifact templates                                      |
| `lessons/`    | Stable cross-run lessons promoted after repetition                    |
| `debt/`       | Persistent architecture debt registry and rules                       |

## Core Contract

- Important state lives in `.llm/runs/<run-id>/`, not chat memory.
- The generator fills a Design checkpoint before creating implementation files.
- The generator commits by slice, not by monolith.
- The generator does not self-certify completion.
- The evaluator is a separate session and writes a structured verdict.
- The evaluator verifies design evidence and slice alignment.
- Every package or plugin run identifies the doctrine archetype before work.
- Every deferred doctrine violation is recorded in `debt/arch-debt.md`.
- Cross-agent handoffs use `workflow/agent-handoff.md`; GitHub comments remain evidence, not a
  replacement for harness artifacts.
- Gate evidence is wrapper-sourced: [`workflow/tooling.md`](./workflow/tooling.md) indexes the
  mandatory tool surface (scoped check/lint/fmt + `deps/*` wrappers, the `agentic:*` task family,
  and the event-driven wake tools), cross-referencing the `netscript-tools` and
  `netscript-deno-toolchain` skills.

## Run Artifacts

Run artifacts live under `.llm/runs/<run-id>/` and use the templates in `templates/`:

- `research.md`
- `plan.md`
- `implement.md` (when the run phase needs it)
- `worklog.md` (with mandatory `## Design` section)
- `plan-eval.md` (PLAN-EVAL verdict)
- `evaluate.md` (IMPL-EVAL verdict)
- `context-pack.md`
- `drift.md`

The draft-PR commit list + per-slice PR comments are the commit trail; there is no `commits.md`. Keep
`worklog.md` + `context-pack.md` current as part of every slice.
