# NetScript Harness v2

Harness v2 is the agent operating system for doctrine-aware work in this repo. It keeps the v1
separation of planner, generator, and evaluator, but the run shape is now derived from the NetScript
Architecture Doctrine.

Authoritative doctrine:

- `.llm/research/architecture-doctrine-docs-v2/doctrine/`

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
| `workflow/`   | Run mechanics: activation, loop, retrieval, commits, circuit breakers |
| `archetypes/` | Doctrine archetype profiles plus scope overlays                       |
| `gates/`      | Static, fitness, runtime, and consumer gate definitions               |
| `evaluator/`  | Separate evaluator-session protocol and verdict definitions           |
| `templates/`  | Canonical run artifact templates                                      |
| `lessons/`    | Stable cross-run lessons promoted after repetition                    |
| `debt/`       | Persistent architecture debt registry and rules                       |

## Core Contract

- Important state lives in `.llm/tmp/run/<run-id>/`, not chat memory.
- The generator fills a Design checkpoint before creating implementation files.
- The generator commits by slice, not by monolith.
- The generator does not self-certify completion.
- The evaluator is a separate session and writes a structured verdict.
- The evaluator verifies design evidence and slice alignment.
- Every package or plugin run identifies the doctrine archetype before work.
- Every deferred doctrine violation is recorded in `debt/arch-debt.md`.

## Run Artifacts

Run artifacts live under `.llm/tmp/run/<run-id>/` and use the templates in `templates/`:

- `research.md`
- `plan.md`
- `implement.md` (when the run phase needs it)
- `worklog.md` (with mandatory `## Design` section)
- `plan-eval.md` (PLAN-EVAL verdict)
- `evaluate.md` (IMPL-EVAL verdict)
- `context-pack.md`
- `drift.md`
- `commits.md`

Append `commits.md` immediately after every commit.
