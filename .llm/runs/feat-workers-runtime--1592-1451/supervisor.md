# Supervisor — workers runtime plumbing plan

## Run identity

| Field                       | Value                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Run id                      | `feat-workers-runtime--1592-1451`                                                  |
| Phase                       | Slice P implementation gate                                                        |
| Profile                     | Archetype 3 — runtime / behavior / engine change                                   |
| Affected connector boundary | Archetype 5 — `plugins/workers` remains a thin adapter around core contracts       |
| Worktree                    | `/home/agent/projects/netscript/worktrees/007-leaf-workers-p`                      |
| Branch                      | `feat/workers-progress-transport`                                                  |
| Baseline                    | `main` at `78be0e032624f12bcb30535d40e3a948b08b9784` (verified 2026-09-01)        |
| Issues                      | #1592 Slice 2                                                                      |
| Scope                       | Independently landable Slice P only                                                |

The owner selected a clustered planning run because both gaps meet at the workers runtime boundary.
Research confirmed that the cluster is useful for a shared architecture and gate analysis, while the
implementation remains three bounded slices: progress transport, config schema, and config-aware
generation. The progress and schema slices are independently landable; generation follows schema.

## Lane routing

| Lane                  | Provider / model / effort                                                      | Status                                     |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Plan author           | Earlier Codex session; exact model and effort are not exposed to this checkout | Complete                                   |
| Formal plan evaluator | Anthropic / Fable 5 / medium, per `lane-policy.md`                             | PASS on 2026-08-31                         |
| Slice P implementer   | Current Codex session; exact model and effort are not exposed to this checkout | Implementation and automated gates complete |
| Tier-A slice review   | Supervisor-owned separate review                                                | Pending; `quality:scan` receipt is present |
| Formal impl evaluator | Supervisor-owned separate session                                               | Not dispatched by owner instruction        |

The owner explicitly prohibited evaluator dispatch, labels, and merge actions in this turn. The
current session does not self-certify the slice; the next supervisor action is substantive Tier-A
review followed by the separately owned evaluator lifecycle.

## Harness controls

- `PLAN-EVAL: REQUIRED`
- Profile authority: `.llm/harness/archetypes/ARCHETYPE-3-runtime-behavior.md`
- Package authority: `docs/architecture/doctrine/` and the Archetype 3 verdict recorded in
  `research.md`
- Connector authority: the Archetype 5 thin-adapter rules apply to touched `plugins/workers` code
- Plan Gate deliverables requested by the owner: `research.md`, `plan.md`, `supervisor.md`, and
  `worklog.md`
- Slice P implementation, one commit, explicit-refspec push, and one draft PR are authorized
- No labels, evaluator dispatch, ready-for-review transition, or merge action is authorized
- Lock and cache mutation is prohibited; `deno.lock` must retain its baseline blob

The earlier plan-only session intentionally omitted `context-pack.md` and `drift.md`. Slice P adds
both standard artifacts because this implementation must be resumable and auditable.

## Phase state

| Phase          | State                     | Evidence                                                 |
| -------------- | ------------------------- | -------------------------------------------------------- |
| Rebaseline     | Complete                  | Branch equals fetched `origin/main`; clean starting tree |
| Research       | Complete                  | `research.md`                                            |
| Plan           | Complete                  | `plan.md`                                                |
| PLAN-EVAL      | PASS                       | `plan-eval.md`                                           |
| Implementation | Complete                   | Slice P product diff + focused tests                     |
| Gate           | Complete                   | `receipts/slice-p/`; doc lint is baseline-relative       |
| Tier-A review  | Pending                    | Supervisor-owned; quality scan already captured          |
| IMPL-EVAL      | Not dispatched             | Owner-reserved evaluator lifecycle                       |

## Stop conditions

Stop and return to planning if implementation discovers any of the following:

1. A live worker-thread adapter or outbound-message consumer not found by the focused searches in
   `research.md`.
2. A seventh execution-record declaration is required for progress transport.
3. Project policy cannot be loaded inside the installed generator child process under the project
   import graph.
4. A configured entry cannot be matched deterministically by normalized entrypoint plus id.
5. The generator must mutate a second manifest or generated configuration source.
6. A slice exceeds its file ceiling without a reviewed rescope.
