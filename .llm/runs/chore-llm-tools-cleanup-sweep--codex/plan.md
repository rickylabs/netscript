# Plan: non-agentic `.llm/tools/` cleanup sweep

## Run Metadata

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Run ID         | `chore-llm-tools-cleanup-sweep--codex`        |
| Branch         | `chore/llm-tools-cleanup-sweep`               |
| Phase          | `plan`                                        |
| Target         | internal repository tooling                   |
| Archetype      | `6 — CLI / Tooling`                           |
| Scope overlays | docs (README and maintenance references only) |

## Archetype and doctrine

Archetype 6 applies because these scripts are user/maintainer-run automation. A7/A8 require
Deno/@std-first implementation and concern-predictable folders. The package-oriented greenfield
spine is not imposed on small independent repo scripts; the playbook's concern taxonomy governs this
established internal surface.

## Goal and scope

Apply the cleanup playbook to every `.llm/tools/` surface except `agentic/`: evidence-led deletion,
coherent layout, consistency and @std audit, documentation rewrite, importer fidelity, and raw
CI-equivalent gates with no live behavior change.

Non-scope: `.llm/tools/agentic/**`, package/plugin behavior, historical run dirs, task-name changes,
release semantics, or lock churn beyond an intentionally added pinned `@std` dependency.

Hidden scope: whole-repo path strings, workflow invocations, generated provenance, skills and
generated Claude mirrors, docs-site tasks, and release imports of `deps/workspace.ts`.

## Locked Decisions

| ID | Decision                                                                                                                             | Rationale                                                                                   |
| -- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| D1 | Preserve every live task name, flag, output, exit code, and safety invariant.                                                        | User guardrail and playbook.                                                                |
| D2 | Delete `search/` and legacy `e2e/scaffold-e2e-test.ts` only after a final basename/path scan immediately before removal.             | They fail the owner-authority heuristic and have no live task/import authority.             |
| D3 | Keep root run-deno wrappers and asset generator in place.                                                                            | Their paths are external contracts; tooling.md explicitly justifies the generator location. |
| D4 | Keep existing concern folders unless a demonstrably mixed folder benefits from a move; preserve basenames and use `git mv`.          | Avoid structure churn without navigational gain.                                            |
| D5 | Centralize volatile values only where a suite actually has repeated volatile values; do not create empty speculative config folders. | A8 and no speculative seams.                                                                |
| D6 | Keep ambiguous live consumers and flag them for the owner.                                                                           | Prove-before-cut rule.                                                                      |

## Open-Decision Sweep

| Decision                         | Status                                        | Notes                                                                                         |
| -------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Exact release sub-grouping       | safe to defer until focused import/size audit | Any move retains basename and requires whole-repo importer update.                            |
| Whether docs checks should merge | safe to defer                                 | Similar names serve different working roots/contracts; preserve unless equivalence is proven. |
| Additional test deletion         | safe to defer                                 | Default is zero; delete only tautologies/duplicates.                                          |

## Risk Register

| Risk                                    | Mitigation                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Moved path breaks a remote importer     | Basename and old-path scans across `.llm/`, packages, plugins, `.github`, AGENTS, CLAUDE, docs before and after every move. |
| Scoped wrapper false-green              | Raw `deno check` over every touched TS file in addition to wrappers.                                                        |
| Cleanup changes behavior                | Preserve contracts, run focused tests, compare baseline counts.                                                             |
| Broad deletion removes an operator tool | Apply dead-code criteria plus authoritative owner heuristic; ambiguous files stay.                                          |
| Lock churn                              | No reload; inspect `deno.lock` against baseline.                                                                            |

## Anti-patterns and fitness

Address AP-1 oversized legacy e2e, AP-2 hand-rolled platform helpers, AP-16 vague grouping, and
AP-25 effects-at-edges where a behavior-neutral move is possible. Avoid speculative Archetype-6
scaffolding.

Required evidence: scoped check/lint/fmt for every touched folder; raw check of every touched TS
file; touched tests; `deno task docs:maintenance`; mirror check when skills change;
`git diff --check`; lock delta inspection.

## Commit slices

1. Inventory and harness plan artifacts — gate: reference matrix completeness and
   `git diff --check`; files: run dir only.
2. Remove proven legacy search/e2e surfaces and restructure warranted concerns — gate: whole-repo
   old-path scan, scoped gates, raw touched-file check.
3. Harmonize and apply Deno/@std/config cleanup — gate: scoped gates plus focused tests and
   volatile/helper scans.
4. Rewrite tool documentation and maintenance maps; update canonical references and regenerate
   mirrors if needed — gate: `docs:maintenance` and link/path verification.
5. Final regression/evidence and evaluator corrections — all requested gates, separate IMPL-EVAL.

## Deferred scope

- New product features, generalized ports/controllers, and behavior refactors.
- Any ambiguous removal without owner-quality evidence.
- Repo-wide formatting outside owned non-agentic tools and directly updated references.

## Drift watch

Record any additional deletion, any contract-affecting refactor, lock change, or divergence from the
five slices.
